package handler

import (
	"context"
	"encoding/json"
	"errors"
	"game-api/internal/domain/models"
	"game-api/pkg/logger"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// 模擬 TransactionService 介面
type MockTransactionService struct {
	getTransactionListFunc  func(ctx context.Context, req models.AdminTransactionListRequest) (*models.AdminTransactionListResponse, error)
	getTransactionStatsFunc func(ctx context.Context, startDate, endDate string) (*models.AdminTransactionStatsResponse, error)
	exportTransactionsFunc  func(ctx context.Context, req models.TransactionExportRequest) ([]byte, string, error)
}

// GetTransactionList 模擬獲取交易列表
func (m *MockTransactionService) GetTransactionList(ctx context.Context, req models.AdminTransactionListRequest) (*models.AdminTransactionListResponse, error) {
	if m.getTransactionListFunc != nil {
		return m.getTransactionListFunc(ctx, req)
	}
	return nil, errors.New("未實現 GetTransactionList")
}

// GetTransactionStats 模擬獲取交易統計
func (m *MockTransactionService) GetTransactionStats(ctx context.Context, startDate, endDate string) (*models.AdminTransactionStatsResponse, error) {
	if m.getTransactionStatsFunc != nil {
		return m.getTransactionStatsFunc(ctx, startDate, endDate)
	}
	return nil, errors.New("未實現 GetTransactionStats")
}

// ExportTransactions 模擬匯出交易報表
func (m *MockTransactionService) ExportTransactions(ctx context.Context, req models.TransactionExportRequest) ([]byte, string, error) {
	if m.exportTransactionsFunc != nil {
		return m.exportTransactionsFunc(ctx, req)
	}
	return nil, "", errors.New("未實現 ExportTransactions")
}

// 初始化測試環境
func setupTestTransactionHandler(t *testing.T) (*gin.Engine, *MockTransactionService, *TransactionHandler) {
	// 設置 Gin 為測試模式
	gin.SetMode(gin.TestMode)

	// 創建 Gin 引擎
	router := gin.New()

	// 創建模擬交易服務
	mockTransactionService := &MockTransactionService{}

	// 創建模擬日誌工具
	mockLogger := &logger.NoOpLogger{}

	// 創建處理程序
	handler := &TransactionHandler{
		transactionService: mockTransactionService,
		log:                mockLogger,
	}

	return router, mockTransactionService, handler
}

// 測試獲取交易列表成功
func TestGetTransactionList_Success(t *testing.T) {
	// 設置測試環境
	router, mockTransactionService, handler := setupTestTransactionHandler(t)

	// 設置模擬回應
	expectedResponse := &models.AdminTransactionListResponse{
		CurrentPage: 1,
		PageSize:    10,
		TotalPages:  2,
		Total:       15,
		Transactions: []models.AdminTransactionSummary{
			{
				ID:            "T2024061500001",
				UserID:        "u-123456",
				Username:      "王小明",
				Type:          "deposit",
				Amount:        200.00,
				Status:        "completed",
				BalanceBefore: 300.00,
				BalanceAfter:  500.00,
				CreatedAt:     time.Now(),
			},
			{
				ID:            "T2024061500002",
				UserID:        "u-123456",
				Username:      "王小明",
				Type:          "bet",
				Amount:        50.00,
				Status:        "completed",
				GameName:      "幸運七",
				BalanceBefore: 500.00,
				BalanceAfter:  450.00,
				CreatedAt:     time.Now(),
			},
		},
	}

	mockTransactionService.getTransactionListFunc = func(ctx context.Context, req models.AdminTransactionListRequest) (*models.AdminTransactionListResponse, error) {
		// 檢查請求參數
		assert.Equal(t, 1, req.Page)
		assert.Equal(t, 10, req.PageSize)
		assert.Equal(t, "deposit", req.Type)

		return expectedResponse, nil
	}

	// 創建請求
	req, _ := http.NewRequest("GET", "/api/admin/transactions/list?page=1&page_size=10&type=deposit", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/transactions/list", handler.GetTransactionList)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.AdminTransactionListResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedResponse.CurrentPage, response.CurrentPage)
	assert.Equal(t, expectedResponse.PageSize, response.PageSize)
	assert.Equal(t, expectedResponse.Total, response.Total)
	assert.Equal(t, expectedResponse.TotalPages, response.TotalPages)
	assert.Len(t, response.Transactions, 2)
	assert.Equal(t, "T2024061500001", response.Transactions[0].ID)
	assert.Equal(t, "deposit", response.Transactions[0].Type)
	assert.Equal(t, "bet", response.Transactions[1].Type)
}

// 測試獲取交易列表失敗
func TestGetTransactionList_Error(t *testing.T) {
	// 設置測試環境
	router, mockTransactionService, handler := setupTestTransactionHandler(t)

	// 設置模擬錯誤
	expectedError := errors.New("資料庫錯誤")
	mockTransactionService.getTransactionListFunc = func(ctx context.Context, req models.AdminTransactionListRequest) (*models.AdminTransactionListResponse, error) {
		return nil, expectedError
	}

	// 創建請求
	req, _ := http.NewRequest("GET", "/api/admin/transactions/list", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/transactions/list", handler.GetTransactionList)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	// 解析回應
	var response gin.H
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedError.Error(), response["error"])
}

// 測試獲取交易統計成功
func TestGetTransactionStats_Success(t *testing.T) {
	// 設置測試環境
	router, mockTransactionService, handler := setupTestTransactionHandler(t)

	// 設置模擬回應
	expectedResponse := &models.AdminTransactionStatsResponse{
		TotalDeposit:       13520.00,
		TotalWithdraw:      5230.00,
		TotalBet:           8750.00,
		TotalWin:           7100.00,
		NetIncome:          8290.00, // 13520 - 5230
		GrossGamingRevenue: 1650.00, // 8750 - 7100
		DepositCount:       45,
		WithdrawCount:      20,
		BetCount:           320,
		WinCount:           150,
		TransactionCount:   535,
		StartDate:          "2024-06-10",
		EndDate:            "2024-06-15",
	}

	mockTransactionService.getTransactionStatsFunc = func(ctx context.Context, startDate, endDate string) (*models.AdminTransactionStatsResponse, error) {
		// 檢查請求參數
		assert.Equal(t, "2024-06-10", startDate)
		assert.Equal(t, "2024-06-15", endDate)

		return expectedResponse, nil
	}

	// 創建請求
	req, _ := http.NewRequest("GET", "/api/admin/transactions/stats?start_date=2024-06-10&end_date=2024-06-15", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/transactions/stats", handler.GetTransactionStats)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.AdminTransactionStatsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedResponse.TotalDeposit, response.TotalDeposit)
	assert.Equal(t, expectedResponse.TotalWithdraw, response.TotalWithdraw)
	assert.Equal(t, expectedResponse.TotalBet, response.TotalBet)
	assert.Equal(t, expectedResponse.TotalWin, response.TotalWin)
	assert.Equal(t, expectedResponse.NetIncome, response.NetIncome)
	assert.Equal(t, expectedResponse.GrossGamingRevenue, response.GrossGamingRevenue)
	assert.Equal(t, expectedResponse.DepositCount, response.DepositCount)
	assert.Equal(t, expectedResponse.TransactionCount, response.TransactionCount)
	assert.Equal(t, expectedResponse.StartDate, response.StartDate)
	assert.Equal(t, expectedResponse.EndDate, response.EndDate)
}

// 測試獲取交易統計失敗
func TestGetTransactionStats_Error(t *testing.T) {
	// 設置測試環境
	router, mockTransactionService, handler := setupTestTransactionHandler(t)

	// 設置模擬錯誤
	expectedError := errors.New("無效的日期範圍")
	mockTransactionService.getTransactionStatsFunc = func(ctx context.Context, startDate, endDate string) (*models.AdminTransactionStatsResponse, error) {
		return nil, expectedError
	}

	// 創建請求
	req, _ := http.NewRequest("GET", "/api/admin/transactions/stats?start_date=2024-06-20&end_date=2024-06-15", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/transactions/stats", handler.GetTransactionStats)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response gin.H
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedError.Error(), response["error"])
}

// 測試獲取交易統計使用默認日期（今天）
func TestGetTransactionStats_DefaultDate(t *testing.T) {
	// 設置測試環境
	router, mockTransactionService, handler := setupTestTransactionHandler(t)

	// 今天的日期
	today := time.Now().Format("2006-01-02")

	// 設置模擬回應
	expectedResponse := &models.AdminTransactionStatsResponse{
		TotalDeposit:       1000.00,
		TotalWithdraw:      500.00,
		TotalBet:           2000.00,
		TotalWin:           1800.00,
		NetIncome:          500.00,
		GrossGamingRevenue: 200.00,
		DepositCount:       5,
		WithdrawCount:      2,
		BetCount:           30,
		WinCount:           25,
		TransactionCount:   62,
		StartDate:          today,
		EndDate:            today,
	}

	mockTransactionService.getTransactionStatsFunc = func(ctx context.Context, startDate, endDate string) (*models.AdminTransactionStatsResponse, error) {
		// 檢查請求參數（應該是今天的日期）
		assert.Equal(t, today, startDate)
		assert.Equal(t, today, endDate)

		return expectedResponse, nil
	}

	// 創建請求（不帶日期參數）
	req, _ := http.NewRequest("GET", "/api/admin/transactions/stats", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/transactions/stats", handler.GetTransactionStats)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.AdminTransactionStatsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedResponse.TotalDeposit, response.TotalDeposit)
	assert.Equal(t, expectedResponse.StartDate, response.StartDate)
	assert.Equal(t, expectedResponse.EndDate, response.EndDate)
}

// 測試匯出交易成功
func TestExportTransactions_Success(t *testing.T) {
	// 設置測試環境
	router, mockTransactionService, handler := setupTestTransactionHandler(t)

	// 設置模擬回應
	csvData := []byte("交易ID,用戶ID,用戶名,類型,金額,狀態,遊戲名稱,餘額變化前,餘額變化後,創建時間\nT2024061500001,u-123456,王小明,deposit,200.00,completed,,300.00,500.00,2024-06-15 10:25:18")
	fileName := "transactions_2024-06-15_2024-06-15.csv"

	mockTransactionService.exportTransactionsFunc = func(ctx context.Context, req models.TransactionExportRequest) ([]byte, string, error) {
		// 檢查請求參數
		assert.Equal(t, "2024-06-15", req.StartDate.Format("2006-01-02"))
		assert.Equal(t, "2024-06-15", req.EndDate.Format("2006-01-02"))
		assert.Equal(t, "deposit", req.Type)

		return csvData, fileName, nil
	}

	// 創建請求
	req, _ := http.NewRequest("GET", "/api/admin/transactions/export?start_date=2024-06-15&end_date=2024-06-15&type=deposit", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/transactions/export", handler.ExportTransactions)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "File Transfer", w.Header().Get("Content-Description"))
	assert.Equal(t, "attachment; filename=\"transactions_2024-06-15_2024-06-15.csv\"", w.Header().Get("Content-Disposition"))
	assert.Equal(t, "text/csv; charset=utf-8", w.Header().Get("Content-Type"))
	assert.Equal(t, string(csvData), w.Body.String())
}

// 測試匯出交易失敗 - 缺少必要的參數
func TestExportTransactions_MissingParams(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestTransactionHandler(t)

	// 請求1：缺少開始日期
	req1, _ := http.NewRequest("GET", "/api/admin/transactions/export?end_date=2024-06-15", nil)
	w1 := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/transactions/export", handler.ExportTransactions)

	// 執行請求
	router.ServeHTTP(w1, req1)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w1.Code)

	// 解析回應
	var response1 gin.H
	json.Unmarshal(w1.Body.Bytes(), &response1)
	assert.Equal(t, "必須提供開始日期和結束日期", response1["error"])

	// 請求2：缺少結束日期
	req2, _ := http.NewRequest("GET", "/api/admin/transactions/export?start_date=2024-06-15", nil)
	w2 := httptest.NewRecorder()

	// 執行請求
	router.ServeHTTP(w2, req2)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w2.Code)

	// 解析回應
	var response2 gin.H
	json.Unmarshal(w2.Body.Bytes(), &response2)
	assert.Equal(t, "必須提供開始日期和結束日期", response2["error"])
}

// 測試匯出交易失敗 - 無效的日期格式
func TestExportTransactions_InvalidDateFormat(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestTransactionHandler(t)

	// 創建請求（無效的開始日期格式）
	req, _ := http.NewRequest("GET", "/api/admin/transactions/export?start_date=15-06-2024&end_date=2024-06-20", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/transactions/export", handler.ExportTransactions)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response gin.H
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "無效的開始日期格式，應為yyyy-mm-dd", response["error"])

	// 創建請求（無效的結束日期格式）
	req2, _ := http.NewRequest("GET", "/api/admin/transactions/export?start_date=2024-06-15&end_date=20-06-2024", nil)
	w2 := httptest.NewRecorder()

	// 執行請求
	router.ServeHTTP(w2, req2)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w2.Code)

	// 解析回應
	var response2 gin.H
	json.Unmarshal(w2.Body.Bytes(), &response2)
	assert.Equal(t, "無效的結束日期格式，應為yyyy-mm-dd", response2["error"])
}

// 測試匯出交易失敗 - 日期範圍錯誤
func TestExportTransactions_InvalidDateRange(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestTransactionHandler(t)

	// 創建請求（結束日期早於開始日期）
	req, _ := http.NewRequest("GET", "/api/admin/transactions/export?start_date=2024-06-20&end_date=2024-06-15", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/transactions/export", handler.ExportTransactions)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response gin.H
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "結束日期不能早於開始日期", response["error"])
}

// 測試匯出交易失敗 - 服務錯誤
func TestExportTransactions_ServiceError(t *testing.T) {
	// 設置測試環境
	router, mockTransactionService, handler := setupTestTransactionHandler(t)

	// 設置模擬錯誤
	expectedError := errors.New("匯出交易失敗")
	mockTransactionService.exportTransactionsFunc = func(ctx context.Context, req models.TransactionExportRequest) ([]byte, string, error) {
		return nil, "", expectedError
	}

	// 創建請求
	req, _ := http.NewRequest("GET", "/api/admin/transactions/export?start_date=2024-06-15&end_date=2024-06-15", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/transactions/export", handler.ExportTransactions)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	// 解析回應
	var response gin.H
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, expectedError.Error(), response["error"])
}
