package service

import (
	"bytes"
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"strings"
	"time"

	"game-api/internal/domain/entity"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminLogServiceImpl struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewAdminLogService 創建新的日誌服務實例
func NewAdminLogService(
	db *gorm.DB,
	logger logger.Logger,
) interfaces.AdminLogService {
	return &AdminLogServiceImpl{
		db:     db,
		logger: logger,
	}
}

// GetLogList 獲取操作日誌列表
func (s *AdminLogServiceImpl) GetLogList(ctx context.Context, req models.AdminLogListRequest) (*models.AdminLogListResponse, error) {
	var (
		total    int64
		pageSize = req.PageSize
		offset   = (req.Page - 1) * pageSize
	)

	// 基本查詢 - 使用連接查詢以獲取管理員名稱
	query := s.db.Table("admin_operation_logs l").
		Select("l.*, a.full_name as admin_name").
		Joins("LEFT JOIN admin_users a ON l.admin_id = a.admin_id")

	// 應用過濾條件
	query = s.applyFilters(query, req)

	// 獲取總記錄數
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// 應用排序
	if req.SortBy != "" {
		direction := "DESC"
		if strings.ToLower(req.SortOrder) == "asc" {
			direction = "ASC"
		}
		query = query.Order(fmt.Sprintf("l.%s %s", req.SortBy, direction))
	} else {
		// 預設按執行時間降序排序
		query = query.Order("l.executed_at DESC")
	}

	// 應用分頁
	query = query.Limit(pageSize).Offset(offset)

	// 執行查詢
	type LogWithDetails struct {
		entity.AdminOperationLog
		AdminName string `gorm:"column:admin_name"`
	}

	var results []LogWithDetails
	if err := query.Find(&results).Error; err != nil {
		return nil, err
	}

	// 計算總頁數
	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)

	// 構建響應
	response := &models.AdminLogListResponse{
		CurrentPage: req.Page,
		PageSize:    pageSize,
		TotalPages:  int(totalPages),
		Total:       total,
		Logs:        make([]models.AdminLogSummary, 0, len(results)),
	}

	// 轉換為響應格式
	for _, log := range results {
		summary := models.AdminLogSummary{
			ID:          log.ID.String(),
			Operation:   models.OperationType(log.Operation),
			EntityType:  models.EntityType(log.EntityType),
			Description: log.Description,
			Status:      log.Status,
			ExecutedAt:  log.ExecutedAt,
			AdminName:   log.AdminName,
		}

		if log.AdminID != nil {
			summary.AdminID = log.AdminID.String()
		}

		if log.EntityID != nil {
			summary.EntityID = *log.EntityID
		}

		if log.IPAddress != nil {
			summary.IPAddress = *log.IPAddress
		}

		if log.UserAgent != nil {
			summary.UserAgent = *log.UserAgent
		}

		response.Logs = append(response.Logs, summary)
	}

	return response, nil
}

// GetLogStats 獲取操作日誌統計
func (s *AdminLogServiceImpl) GetLogStats(ctx context.Context, startDateStr, endDateStr string) (*models.AdminLogStatsResponse, error) {
	// 解析日期
	var startDate, endDate time.Time
	var err error

	if startDateStr == "" {
		// 如果未提供開始日期，默認使用今天
		startDate = time.Now().Truncate(24 * time.Hour)
	} else {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			return nil, errors.New("無效的開始日期格式")
		}
	}

	if endDateStr == "" {
		// 如果未提供結束日期，默認使用今天
		endDate = time.Now().Truncate(24 * time.Hour).Add(24*time.Hour - time.Second)
	} else {
		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			return nil, errors.New("無效的結束日期格式")
		}
		// 設置結束日期為當天的結束時間
		endDate = endDate.Add(24*time.Hour - time.Second)
	}

	// 初始化統計響應
	stats := &models.AdminLogStatsResponse{
		StartDate:              startDate.Format("2006-01-02"),
		EndDate:                endDate.Format("2006-01-02"),
		EntityTypeDistribution: make(map[string]int),
	}

	// 查詢條件 - 時間範圍
	timeCondition := s.db.Where("executed_at BETWEEN ? AND ?", startDate, endDate)

	// 獲取總日誌數
	var totalLogs int64
	if err := timeCondition.Model(&entity.AdminOperationLog{}).Count(&totalLogs).Error; err != nil {
		return nil, err
	}
	stats.TotalLogs = int(totalLogs)

	// 獲取各類操作次數
	var createOps int64
	if err := timeCondition.Model(&entity.AdminOperationLog{}).
		Where("operation = ?", entity.OperationCreate).
		Count(&createOps).Error; err != nil {
		return nil, err
	}
	stats.CreateOperations = int(createOps)

	var updateOps int64
	if err := timeCondition.Model(&entity.AdminOperationLog{}).
		Where("operation = ?", entity.OperationUpdate).
		Count(&updateOps).Error; err != nil {
		return nil, err
	}
	stats.UpdateOperations = int(updateOps)

	var deleteOps int64
	if err := timeCondition.Model(&entity.AdminOperationLog{}).
		Where("operation = ?", entity.OperationDelete).
		Count(&deleteOps).Error; err != nil {
		return nil, err
	}
	stats.DeleteOperations = int(deleteOps)

	var loginOps int64
	if err := timeCondition.Model(&entity.AdminOperationLog{}).
		Where("operation = ?", entity.OperationLogin).
		Count(&loginOps).Error; err != nil {
		return nil, err
	}
	stats.LoginOperations = int(loginOps)

	// 獲取其他操作次數 (非創建、更新、刪除、登入)
	var otherOps int64
	if err := timeCondition.Model(&entity.AdminOperationLog{}).
		Where("operation NOT IN (?, ?, ?, ?)",
			entity.OperationCreate,
			entity.OperationUpdate,
			entity.OperationDelete,
			entity.OperationLogin).
		Count(&otherOps).Error; err != nil {
		return nil, err
	}
	stats.OtherOperations = int(otherOps)

	// 統計各實體類型分佈
	entityTypes := []entity.EntityType{
		entity.EntityUser,
		entity.EntityGame,
		entity.EntityTransaction,
		entity.EntitySetting,
		entity.EntityAdmin,
		entity.EntitySystem,
	}

	for _, entityType := range entityTypes {
		var count int64
		if err := timeCondition.Model(&entity.AdminOperationLog{}).
			Where("entity_type = ?", entityType).
			Count(&count).Error; err != nil {
			return nil, err
		}
		stats.EntityTypeDistribution[string(entityType)] = int(count)
	}

	// 獲取管理員活動排名
	type AdminActivityData struct {
		AdminID   uuid.UUID `gorm:"column:admin_id"`
		AdminName string    `gorm:"column:full_name"`
		Count     int       `gorm:"column:count"`
	}

	var adminActivities []AdminActivityData
	if err := s.db.Table("admin_operation_logs l").
		Select("l.admin_id, a.full_name, COUNT(*) as count").
		Joins("LEFT JOIN admin_users a ON l.admin_id = a.admin_id").
		Where("l.executed_at BETWEEN ? AND ?", startDate, endDate).
		Where("l.admin_id IS NOT NULL").
		Group("l.admin_id, a.full_name").
		Order("count DESC").
		Limit(10).
		Find(&adminActivities).Error; err != nil {
		return nil, err
	}

	// 轉換為響應格式
	stats.AdminActivityRanking = make([]models.AdminActivity, 0, len(adminActivities))
	for _, activity := range adminActivities {
		stats.AdminActivityRanking = append(stats.AdminActivityRanking, models.AdminActivity{
			AdminID:   activity.AdminID.String(),
			AdminName: activity.AdminName,
			Count:     activity.Count,
		})
	}

	return stats, nil
}

// ExportLogs 匯出操作日誌為CSV
func (s *AdminLogServiceImpl) ExportLogs(ctx context.Context, req models.LogExportRequest) ([]byte, string, error) {
	// 使用 CSV 作為匯出格式
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	// 寫入UTF-8 BOM，確保Excel可以正確顯示中文
	buffer.WriteString("\xEF\xBB\xBF")

	// 寫入標題行
	headers := []string{
		"日誌ID", "管理員ID", "管理員名稱", "操作類型", "操作對象類型",
		"操作對象ID", "描述", "IP位址", "使用者代理", "狀態", "執行時間",
	}
	if err := writer.Write(headers); err != nil {
		return nil, "", err
	}

	// 查詢日誌數據
	query := s.db.Table("admin_operation_logs l").
		Select("l.*, a.full_name as admin_name").
		Joins("LEFT JOIN admin_users a ON l.admin_id = a.admin_id").
		Where("l.executed_at BETWEEN ? AND ?", req.StartDate, req.EndDate.Add(24*time.Hour-time.Second))

	// 根據操作類型篩選
	if req.Operation != "" && req.Operation != "all" {
		query = query.Where("l.operation = ?", req.Operation)
	}

	// 根據實體類型篩選
	if req.EntityType != "" && req.EntityType != "all" {
		query = query.Where("l.entity_type = ?", req.EntityType)
	}

	// 按時間排序
	query = query.Order("l.executed_at ASC")

	// 執行查詢
	type LogWithDetails struct {
		entity.AdminOperationLog
		AdminName string `gorm:"column:admin_name"`
	}

	var logs []LogWithDetails
	if err := query.Find(&logs).Error; err != nil {
		return nil, "", err
	}

	// 寫入數據行
	for _, log := range logs {
		adminID := ""
		if log.AdminID != nil {
			adminID = log.AdminID.String()
		}

		entityID := ""
		if log.EntityID != nil {
			entityID = *log.EntityID
		}

		ipAddress := ""
		if log.IPAddress != nil {
			ipAddress = *log.IPAddress
		}

		userAgent := ""
		if log.UserAgent != nil {
			userAgent = *log.UserAgent
		}

		// 準備行數據
		row := []string{
			log.ID.String(),
			adminID,
			log.AdminName,
			string(log.Operation),
			string(log.EntityType),
			entityID,
			log.Description,
			ipAddress,
			userAgent,
			log.Status,
			log.ExecutedAt.Format("2006-01-02 15:04:05"),
		}

		if err := writer.Write(row); err != nil {
			return nil, "", err
		}
	}

	// 獲取統計數據
	stats, err := s.GetLogStats(ctx, req.StartDate.Format("2006-01-02"), req.EndDate.Format("2006-01-02"))
	if err != nil {
		return nil, "", err
	}

	// 寫入空行
	writer.Write([]string{})
	writer.Write([]string{})

	// 寫入統計信息
	writer.Write([]string{"統計報表", fmt.Sprintf("%s 至 %s", stats.StartDate, stats.EndDate)})
	writer.Write([]string{})
	writer.Write([]string{"操作類型", "次數"})
	writer.Write([]string{"創建操作", fmt.Sprintf("%d", stats.CreateOperations)})
	writer.Write([]string{"更新操作", fmt.Sprintf("%d", stats.UpdateOperations)})
	writer.Write([]string{"刪除操作", fmt.Sprintf("%d", stats.DeleteOperations)})
	writer.Write([]string{"登入操作", fmt.Sprintf("%d", stats.LoginOperations)})
	writer.Write([]string{"其他操作", fmt.Sprintf("%d", stats.OtherOperations)})
	writer.Write([]string{})
	writer.Write([]string{"操作對象類型", "次數"})

	for entityType, count := range stats.EntityTypeDistribution {
		writer.Write([]string{entityType, fmt.Sprintf("%d", count)})
	}

	writer.Write([]string{})
	writer.Write([]string{"日誌總數", fmt.Sprintf("%d", stats.TotalLogs)})

	// 確保所有資料都寫入緩衝區
	writer.Flush()

	// 檢查寫入過程是否有錯誤
	if err := writer.Error(); err != nil {
		return nil, "", err
	}

	// 生成檔案名稱
	fileName := fmt.Sprintf("操作日誌_%s_%s.csv", req.StartDate.Format("20060102"), req.EndDate.Format("20060102"))

	return buffer.Bytes(), fileName, nil
}

// applyFilters 應用過濾條件
func (s *AdminLogServiceImpl) applyFilters(query *gorm.DB, req models.AdminLogListRequest) *gorm.DB {
	// 按操作內容或操作者搜索
	if req.Search != "" {
		search := "%" + req.Search + "%"
		query = query.Where(
			s.db.Where("l.description LIKE ?", search).
				Or("a.full_name LIKE ?", search),
		)
	}

	// 按操作類型過濾
	if req.Operation != "" && req.Operation != "all" {
		query = query.Where("l.operation = ?", req.Operation)
	}

	// 按實體類型過濾
	if req.EntityType != "" && req.EntityType != "all" {
		query = query.Where("l.entity_type = ?", req.EntityType)
	}

	// 按日期範圍過濾
	if !req.StartDate.IsZero() {
		query = query.Where("l.executed_at >= ?", req.StartDate)
	}

	if !req.EndDate.IsZero() {
		// 結束日期增加一天(不含)，確保包含結束日期當天的數據
		endDate := req.EndDate.Add(24 * time.Hour)
		query = query.Where("l.executed_at < ?", endDate)
	}

	return query
}
