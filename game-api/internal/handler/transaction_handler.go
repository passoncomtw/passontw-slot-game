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

// TransactionHandler 處理交易管理相關請求
type TransactionHandler struct {
	transactionService interfaces.TransactionService
	log                logger.Logger
}

// NewTransactionHandler 創建一個新的交易處理器
func NewTransactionHandler(transactionService interfaces.TransactionService, log logger.Logger) *TransactionHandler {
	return &TransactionHandler{
		transactionService: transactionService,
		log:                log,
	}
}

// RegisterRoutes 註冊交易管理路由
func (h *TransactionHandler) RegisterRoutes(router *gin.RouterGroup, adminAuth gin.HandlerFunc) {
	transactions := router.Group("/admin/transactions")
	transactions.Use(adminAuth)
	{
		transactions.GET("/list", h.GetTransactionList)
		transactions.GET("/stats", h.GetTransactionStats)
		transactions.GET("/export", h.ExportTransactions)
	}
}

// GetTransactionList godoc
// @Summary 獲取交易列表
// @Description 獲取交易列表，支持分頁、過濾和搜索
// @Tags 交易管理
// @Accept json
// @Produce json
// @Param page query int false "頁碼，默認為1" default(1)
// @Param page_size query int false "每頁記錄數，默認為10" default(10)
// @Param search query string false "搜索關鍵字（交易ID或用戶名）"
// @Param type query string false "交易類型 (deposit, withdraw, bet, win, bonus, refund)"
// @Param status query string false "交易狀態 (pending, completed, failed, cancelled)"
// @Param start_date query string false "開始日期 (格式: yyyy-mm-dd)"
// @Param end_date query string false "結束日期 (格式: yyyy-mm-dd)"
// @Param sort_by query string false "排序字段" default(created_at)
// @Param sort_order query string false "排序方向 (asc, desc)" default(desc)
// @Success 200 {object} models.AdminTransactionListResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/admin/transactions/list [get]
// @Security Bearer
func (h *TransactionHandler) GetTransactionList(ctx *gin.Context) {
	var req models.AdminTransactionListRequest
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

	response, err := h.transactionService.GetTransactionList(ctx, req)
	if err != nil {
		h.log.Error(fmt.Sprintf("獲取交易列表失敗: %s", err.Error()))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// GetTransactionStats godoc
// @Summary 獲取交易統計
// @Description 獲取指定日期範圍內的交易統計數據
// @Tags 交易管理
// @Accept json
// @Produce json
// @Param start_date query string false "開始日期 (格式: yyyy-mm-dd，默認為今天)"
// @Param end_date query string false "結束日期 (格式: yyyy-mm-dd，默認為今天)"
// @Success 200 {object} models.AdminTransactionStatsResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/admin/transactions/stats [get]
// @Security Bearer
func (h *TransactionHandler) GetTransactionStats(ctx *gin.Context) {
	startDate := ctx.Query("start_date")
	endDate := ctx.Query("end_date")

	// 如果沒有提供日期，默認為今天
	if startDate == "" && endDate == "" {
		today := time.Now().Format("2006-01-02")
		startDate = today
		endDate = today
	}

	response, err := h.transactionService.GetTransactionStats(ctx, startDate, endDate)
	if err != nil {
		h.log.Error(fmt.Sprintf("獲取交易統計失敗: %s", err.Error()))
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// ExportTransactions godoc
// @Summary 匯出交易報表
// @Description 匯出指定日期範圍內的交易數據為CSV文件
// @Tags 交易管理
// @Accept json
// @Produce text/csv
// @Param start_date query string true "開始日期 (格式: yyyy-mm-dd)"
// @Param end_date query string true "結束日期 (格式: yyyy-mm-dd)"
// @Param type query string false "交易類型 (all, deposit, withdraw, bet, win)" default(all)
// @Success 200 {file} file "交易報表CSV文件"
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/admin/transactions/export [get]
// @Security Bearer
func (h *TransactionHandler) ExportTransactions(ctx *gin.Context) {
	var req models.TransactionExportRequest

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

	// 獲取交易類型
	req.Type = ctx.DefaultQuery("type", "all")

	// 生成CSV文件
	data, fileName, err := h.transactionService.ExportTransactions(ctx, req)
	if err != nil {
		h.log.Error(fmt.Sprintf("匯出交易報表失敗: %s", err.Error()))
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
