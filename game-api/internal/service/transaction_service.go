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

	"gorm.io/gorm"
)

type TransactionServiceImpl struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewTransactionService 創建新的交易服務實例
func NewTransactionService(
	db *gorm.DB,
	logger logger.Logger,
) interfaces.TransactionService {
	return &TransactionServiceImpl{
		db:     db,
		logger: logger,
	}
}

// GetTransactionList 獲取交易列表
func (s *TransactionServiceImpl) GetTransactionList(ctx context.Context, req models.AdminTransactionListRequest) (*models.AdminTransactionListResponse, error) {
	var (
		total    int64
		pageSize = req.PageSize
		offset   = (req.Page - 1) * pageSize
	)

	// 基本查詢 - 使用連接查詢以獲取用戶名
	query := s.db.Table("transactions t").
		Select("t.*, u.name as username, g.title as game_name").
		Joins("LEFT JOIN users u ON t.user_id = u.user_id::text").
		Joins("LEFT JOIN games g ON t.game_id = g.game_id::text")

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
		query = query.Order(fmt.Sprintf("t.%s %s", req.SortBy, direction))
	} else {
		// 預設按建立時間降序排序
		query = query.Order("t.created_at DESC")
	}

	// 應用分頁
	query = query.Limit(pageSize).Offset(offset)

	// 執行查詢
	type TransactionWithDetails struct {
		entity.Transaction
		Username string `gorm:"column:username"`
		GameName string `gorm:"column:game_name"`
	}

	var results []TransactionWithDetails
	if err := query.Find(&results).Error; err != nil {
		return nil, err
	}

	// 計算總頁數
	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)

	// 構建響應
	response := &models.AdminTransactionListResponse{
		CurrentPage:  req.Page,
		PageSize:     pageSize,
		TotalPages:   int(totalPages),
		Total:        total,
		Transactions: make([]models.AdminTransactionSummary, 0, len(results)),
	}

	// 轉換為響應格式
	for _, tx := range results {
		summary := models.AdminTransactionSummary{
			ID:            tx.ID,
			UserID:        tx.UserID,
			Username:      tx.Username,
			Type:          string(tx.Type),
			Amount:        tx.Amount,
			Status:        string(tx.Status),
			BalanceBefore: tx.BalanceBefore,
			BalanceAfter:  tx.BalanceAfter,
			CreatedAt:     tx.CreatedAt,
		}

		if tx.GameID != nil {
			summary.GameName = tx.GameName
		}

		if tx.ReferenceID != nil {
			summary.ReferenceID = *tx.ReferenceID
		}

		if tx.Description != nil {
			summary.Description = *tx.Description
		}

		response.Transactions = append(response.Transactions, summary)
	}

	return response, nil
}

// GetTransactionStats 獲取交易統計
func (s *TransactionServiceImpl) GetTransactionStats(ctx context.Context, startDateStr, endDateStr string) (*models.AdminTransactionStatsResponse, error) {
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
	stats := &models.AdminTransactionStatsResponse{
		StartDate: startDate.Format("2006-01-02"),
		EndDate:   endDate.Format("2006-01-02"),
	}

	// 查詢條件 - 時間範圍
	timeCondition := s.db.Where("created_at BETWEEN ? AND ?", startDate, endDate)

	// 獲取存款總額和數量
	s.db.Model(&entity.Transaction{}).
		Where("type = ?", entity.TransactionDeposit).
		Where(timeCondition).
		Select("COALESCE(SUM(amount), 0) as total, COUNT(*) as count").
		Row().Scan(&stats.TotalDeposit, &stats.DepositCount)

	// 獲取提款總額和數量
	s.db.Model(&entity.Transaction{}).
		Where("type = ?", entity.TransactionWithdraw).
		Where(timeCondition).
		Select("COALESCE(SUM(amount), 0) as total, COUNT(*) as count").
		Row().Scan(&stats.TotalWithdraw, &stats.WithdrawCount)

	// 獲取下注總額和數量
	s.db.Model(&entity.Transaction{}).
		Where("type = ?", entity.TransactionBet).
		Where(timeCondition).
		Select("COALESCE(SUM(amount), 0) as total, COUNT(*) as count").
		Row().Scan(&stats.TotalBet, &stats.BetCount)

	// 獲取獲勝總額和數量
	s.db.Model(&entity.Transaction{}).
		Where("type = ?", entity.TransactionWin).
		Where(timeCondition).
		Select("COALESCE(SUM(amount), 0) as total, COUNT(*) as count").
		Row().Scan(&stats.TotalWin, &stats.WinCount)

	// 計算總交易數
	stats.TransactionCount = stats.DepositCount + stats.WithdrawCount + stats.BetCount + stats.WinCount

	// 計算淨收入 = 總存款 - 總提款
	stats.NetIncome = stats.TotalDeposit - stats.TotalWithdraw

	// 計算博彩毛利 = 總下注 - 總獲勝
	stats.GrossGamingRevenue = stats.TotalBet - stats.TotalWin

	return stats, nil
}

// ExportTransactions 匯出交易報表為CSV
func (s *TransactionServiceImpl) ExportTransactions(ctx context.Context, req models.TransactionExportRequest) ([]byte, string, error) {
	// 使用 CSV 作為匯出格式
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	// 寫入UTF-8 BOM，確保Excel可以正確顯示中文
	buffer.WriteString("\xEF\xBB\xBF")

	// 寫入標題行
	headers := []string{
		"交易ID", "用戶ID", "用戶名", "交易類型", "金額", "狀態",
		"遊戲名稱", "參考編號", "描述", "交易前餘額", "交易後餘額", "創建時間",
	}
	if err := writer.Write(headers); err != nil {
		return nil, "", err
	}

	// 查詢交易數據
	query := s.db.Table("transactions t").
		Select("t.*, u.name as username, g.title as game_name").
		Joins("LEFT JOIN users u ON t.user_id = u.user_id::text").
		Joins("LEFT JOIN games g ON t.game_id = g.game_id::text").
		Where("t.created_at BETWEEN ? AND ?", req.StartDate, req.EndDate.Add(24*time.Hour-time.Second))

	// 根據類型篩選
	if req.Type != "" && req.Type != "all" {
		query = query.Where("t.type = ?", req.Type)
	}

	// 按時間排序
	query = query.Order("t.created_at ASC")

	// 執行查詢
	type TransactionWithDetails struct {
		entity.Transaction
		Username string `gorm:"column:username"`
		GameName string `gorm:"column:game_name"`
	}

	var transactions []TransactionWithDetails
	if err := query.Find(&transactions).Error; err != nil {
		return nil, "", err
	}

	// 寫入數據行
	for _, tx := range transactions {
		gameTitle := ""
		if tx.GameID != nil {
			gameTitle = tx.GameName
		}

		referenceID := ""
		if tx.ReferenceID != nil {
			referenceID = *tx.ReferenceID
		}

		description := ""
		if tx.Description != nil {
			description = *tx.Description
		}

		// 準備行數據
		row := []string{
			tx.ID,
			tx.UserID,
			tx.Username,
			string(tx.Type),
			fmt.Sprintf("%.2f", tx.Amount),
			string(tx.Status),
			gameTitle,
			referenceID,
			description,
			fmt.Sprintf("%.2f", tx.BalanceBefore),
			fmt.Sprintf("%.2f", tx.BalanceAfter),
			tx.CreatedAt.Format("2006-01-02 15:04:05"),
		}

		if err := writer.Write(row); err != nil {
			return nil, "", err
		}
	}

	// 獲取統計數據
	stats, err := s.GetTransactionStats(ctx, req.StartDate.Format("2006-01-02"), req.EndDate.Format("2006-01-02"))
	if err != nil {
		return nil, "", err
	}

	// 寫入空行
	writer.Write([]string{})
	writer.Write([]string{})

	// 寫入統計信息
	writer.Write([]string{"統計報表", fmt.Sprintf("%s 至 %s", stats.StartDate, stats.EndDate)})
	writer.Write([]string{})
	writer.Write([]string{"交易類型", "金額", "筆數"})
	writer.Write([]string{"總存款", fmt.Sprintf("%.2f", stats.TotalDeposit), fmt.Sprintf("%d", stats.DepositCount)})
	writer.Write([]string{"總提款", fmt.Sprintf("%.2f", stats.TotalWithdraw), fmt.Sprintf("%d", stats.WithdrawCount)})
	writer.Write([]string{"總下注", fmt.Sprintf("%.2f", stats.TotalBet), fmt.Sprintf("%d", stats.BetCount)})
	writer.Write([]string{"總獲勝", fmt.Sprintf("%.2f", stats.TotalWin), fmt.Sprintf("%d", stats.WinCount)})
	writer.Write([]string{})
	writer.Write([]string{"統計指標", "金額"})
	writer.Write([]string{"淨收入", fmt.Sprintf("%.2f", stats.NetIncome)})
	writer.Write([]string{"博彩毛利", fmt.Sprintf("%.2f", stats.GrossGamingRevenue)})
	writer.Write([]string{"交易總筆數", fmt.Sprintf("%d", stats.TransactionCount)})

	// 確保所有資料都寫入緩衝區
	writer.Flush()

	// 檢查寫入過程是否有錯誤
	if err := writer.Error(); err != nil {
		return nil, "", err
	}

	// 生成檔案名稱
	fileName := fmt.Sprintf("交易報表_%s_%s.csv", req.StartDate.Format("20060102"), req.EndDate.Format("20060102"))

	return buffer.Bytes(), fileName, nil
}

// applyFilters 應用過濾條件
func (s *TransactionServiceImpl) applyFilters(query *gorm.DB, req models.AdminTransactionListRequest) *gorm.DB {
	// 按交易ID或用戶名搜索
	if req.Search != "" {
		search := "%" + req.Search + "%"
		query = query.Where("t.transaction_id LIKE ? OR u.name LIKE ?", search, search)
	}

	// 按交易類型過濾
	if req.Type != "" && req.Type != "all" {
		query = query.Where("t.type = ?", req.Type)
	}

	// 按交易狀態過濾
	if req.Status != "" && req.Status != "all" {
		query = query.Where("t.status = ?", req.Status)
	}

	// 按日期範圍過濾
	if !req.StartDate.IsZero() {
		query = query.Where("t.created_at >= ?", req.StartDate)
	}

	if !req.EndDate.IsZero() {
		// 結束日期增加一天(不含)，確保包含結束日期當天的數據
		endDate := req.EndDate.Add(24 * time.Hour)
		query = query.Where("t.created_at < ?", endDate)
	}

	return query
}
