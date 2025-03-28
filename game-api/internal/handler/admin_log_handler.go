package handler

import (
	"fmt"
	"net/http"
	"time"

	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"

	"github.com/gin-gonic/gin"
)

// AdminLogHandler 處理操作日誌相關請求
type AdminLogHandler struct {
	logService interfaces.AdminLogService
	log        logger.Logger
}

// NewAdminLogHandler 創建一個新的日誌處理器
func NewAdminLogHandler(logService interfaces.AdminLogService, log logger.Logger) *AdminLogHandler {
	return &AdminLogHandler{
		logService: logService,
		log:        log,
	}
}

// RegisterRoutes 註冊操作日誌相關路由
func (h *AdminLogHandler) RegisterRoutes(router *gin.RouterGroup, adminAuth gin.HandlerFunc) {
	logs := router.Group("/admin/logs")
	logs.Use(adminAuth)
	{
		logs.GET("/list", h.GetLogList)
		logs.GET("/stats", h.GetLogStats)
		logs.GET("/export", h.ExportLogs)
	}
}

// GetLogList godoc
// @Summary 獲取操作日誌列表
// @Description 獲取操作日誌列表，支持分頁、過濾和搜索
// @Tags 操作日誌
// @Accept json
// @Produce json
// @Param page query int false "頁碼，默認為1" default(1)
// @Param page_size query int false "每頁記錄數，默認為10" default(10)
// @Param search query string false "搜索關鍵字（操作內容或操作者）"
// @Param operation query string false "操作類型 (create, update, delete, login, logout, export, import)"
// @Param entity_type query string false "操作對象類型 (user, game, transaction, setting, admin, system)"
// @Param start_date query string false "開始日期 (格式: yyyy-mm-dd)"
// @Param end_date query string false "結束日期 (格式: yyyy-mm-dd)"
// @Param sort_by query string false "排序字段" default(executed_at)
// @Param sort_order query string false "排序方向 (asc, desc)" default(desc)
// @Success 200 {object} models.AdminLogListResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/admin/logs/list [get]
// @Security BearerAuth
func (h *AdminLogHandler) GetLogList(ctx *gin.Context) {
	var req models.AdminLogListRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 設置默認值
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}

	response, err := h.logService.GetLogList(ctx, req)
	if err != nil {
		h.log.Error(fmt.Sprintf("獲取操作日誌列表失敗: %s", err.Error()))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// GetLogStats godoc
// @Summary 獲取操作日誌統計
// @Description 獲取指定日期範圍內的操作日誌統計數據
// @Tags 操作日誌
// @Accept json
// @Produce json
// @Param start_date query string false "開始日期 (格式: yyyy-mm-dd，默認為今天)"
// @Param end_date query string false "結束日期 (格式: yyyy-mm-dd，默認為今天)"
// @Success 200 {object} models.AdminLogStatsResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/admin/logs/stats [get]
// @Security BearerAuth
func (h *AdminLogHandler) GetLogStats(ctx *gin.Context) {
	startDate := ctx.Query("start_date")
	endDate := ctx.Query("end_date")

	// 如果沒有提供日期，默認為今天
	if startDate == "" && endDate == "" {
		today := time.Now().Format("2006-01-02")
		startDate = today
		endDate = today
	}

	response, err := h.logService.GetLogStats(ctx, startDate, endDate)
	if err != nil {
		h.log.Error(fmt.Sprintf("獲取操作日誌統計失敗: %s", err.Error()))
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// ExportLogs godoc
// @Summary 匯出操作日誌
// @Description 匯出指定日期範圍內的操作日誌為CSV文件
// @Tags 操作日誌
// @Accept json
// @Produce text/csv
// @Param start_date query string true "開始日期 (格式: yyyy-mm-dd)"
// @Param end_date query string true "結束日期 (格式: yyyy-mm-dd)"
// @Param operation query string false "操作類型 (all, create, update, delete, login, logout)" default(all)
// @Param entity_type query string false "操作對象類型 (all, user, game, transaction, setting, admin, system)" default(all)
// @Success 200 {file} file "操作日誌CSV文件"
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/admin/logs/export [get]
// @Security BearerAuth
func (h *AdminLogHandler) ExportLogs(ctx *gin.Context) {
	var req models.LogExportRequest

	// 解析日期參數
	startDateStr := ctx.Query("start_date")
	endDateStr := ctx.Query("end_date")

	if startDateStr == "" || endDateStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "必須提供開始日期和結束日期"})
		return
	}

	var err error
	req.StartDate, err = time.Parse("2006-01-02", startDateStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "無效的開始日期格式，應為yyyy-mm-dd"})
		return
	}

	req.EndDate, err = time.Parse("2006-01-02", endDateStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "無效的結束日期格式，應為yyyy-mm-dd"})
		return
	}

	// 檢查日期範圍
	if req.EndDate.Before(req.StartDate) {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "結束日期不能早於開始日期"})
		return
	}

	// 檢查日期範圍不超過90天
	maxDuration := 90 * 24 * time.Hour
	if req.EndDate.Sub(req.StartDate) > maxDuration {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "匯出範圍不能超過90天"})
		return
	}

	// 獲取操作類型和實體類型
	req.Operation = ctx.DefaultQuery("operation", "all")
	req.EntityType = ctx.DefaultQuery("entity_type", "all")

	// 生成CSV文件
	data, fileName, err := h.logService.ExportLogs(ctx, req)
	if err != nil {
		h.log.Error(fmt.Sprintf("匯出操作日誌失敗: %s", err.Error()))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 設置響應頭，通知瀏覽器下載文件
	ctx.Header("Content-Description", "File Transfer")
	ctx.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, fileName))
	ctx.Header("Content-Type", "text/csv; charset=utf-8")
	ctx.Header("Content-Transfer-Encoding", "binary")
	ctx.Header("Expires", "0")
	ctx.Header("Cache-Control", "must-revalidate")
	ctx.Header("Pragma", "public")
	ctx.Header("Content-Length", fmt.Sprintf("%d", len(data)))

	// 寫入CSV數據到響應
	ctx.Data(http.StatusOK, "text/csv", data)
}
