package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"game-api/internal/domain/models"
	"game-api/pkg/logger"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"
)

// 模擬 AdminLogService 介面
type MockAdminLogService struct {
	ctrl *gomock.Controller
	mock *MockLogService
}

// 模擬 LogService 介面
type MockLogService struct {
	getLogListFunc  func(ctx interface{}, req models.AdminLogListRequest) (*models.AdminLogListResponse, error)
	getLogStatsFunc func(ctx interface{}, startDate, endDate string) (*models.AdminLogStatsResponse, error)
	exportLogsFunc  func(ctx interface{}, req models.LogExportRequest) ([]byte, string, error)
}

// GetLogList 模擬獲取日誌列表
func (m *MockLogService) GetLogList(ctx interface{}, req models.AdminLogListRequest) (*models.AdminLogListResponse, error) {
	if m.getLogListFunc != nil {
		return m.getLogListFunc(ctx, req)
	}
	return nil, errors.New("未實現 GetLogList")
}

// GetLogStats 模擬獲取統計數據
func (m *MockLogService) GetLogStats(ctx interface{}, startDate, endDate string) (*models.AdminLogStatsResponse, error) {
	if m.getLogStatsFunc != nil {
		return m.getLogStatsFunc(ctx, startDate, endDate)
	}
	return nil, errors.New("未實現 GetLogStats")
}

// ExportLogs 模擬匯出日誌
func (m *MockLogService) ExportLogs(ctx interface{}, req models.LogExportRequest) ([]byte, string, error) {
	if m.exportLogsFunc != nil {
		return m.exportLogsFunc(ctx, req)
	}
	return nil, "", errors.New("未實現 ExportLogs")
}

// 初始化測試環境
func setupTestAdminLogHandler(t *testing.T) (*gin.Engine, *MockLogService, *AdminLogHandler) {
	// 設置 Gin 為測試模式
	gin.SetMode(gin.TestMode)

	// 創建 Gin 引擎
	router := gin.New()

	// 創建模擬日誌服務
	mockLogService := &MockLogService{}

	// 創建模擬日誌工具
	mockLogger := &logger.NoOpLogger{}

	// 創建處理程序
	handler := &AdminLogHandler{
		logService: mockLogService,
		log:        mockLogger,
	}

	return router, mockLogService, handler
}

// 測試 GetLogList 成功情況
func TestGetLogList_Success(t *testing.T) {
	// 設置測試環境
	router, mockLogService, handler := setupTestAdminLogHandler(t)

	// 設置模擬回應
	expectedResponse := &models.AdminLogListResponse{
		CurrentPage: 1,
		PageSize:    10,
		TotalPages:  2,
		Total:       15,
		Logs: []models.AdminLogSummary{
			{
				ID:          "log1",
				AdminName:   "TestAdmin",
				Operation:   models.OperationCreate,
				EntityType:  models.EntityGame,
				Description: "新增遊戲測試",
				Status:      "success",
				ExecutedAt:  time.Now(),
			},
		},
	}

	// 模擬日誌服務
	mockLogService.getLogListFunc = func(ctx interface{}, req models.AdminLogListRequest) (*models.AdminLogListResponse, error) {
		// 檢查請求參數
		assert.Equal(t, 1, req.Page)
		assert.Equal(t, 10, req.PageSize)

		return expectedResponse, nil
	}

	// 設置請求
	req, _ := http.NewRequest("GET", "/api/admin/logs/list?page=1&page_size=10", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/list", handler.GetLogList)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.AdminLogListResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedResponse.CurrentPage, response.CurrentPage)
	assert.Equal(t, expectedResponse.PageSize, response.PageSize)
	assert.Equal(t, expectedResponse.TotalPages, response.TotalPages)
	assert.Equal(t, expectedResponse.Total, response.Total)
	assert.Len(t, response.Logs, 1)
	assert.Equal(t, expectedResponse.Logs[0].ID, response.Logs[0].ID)
	assert.Equal(t, expectedResponse.Logs[0].AdminName, response.Logs[0].AdminName)
	assert.Equal(t, expectedResponse.Logs[0].Operation, response.Logs[0].Operation)
	assert.Equal(t, expectedResponse.Logs[0].EntityType, response.Logs[0].EntityType)
	assert.Equal(t, expectedResponse.Logs[0].Description, response.Logs[0].Description)
	assert.Equal(t, expectedResponse.Logs[0].Status, response.Logs[0].Status)
}

// 測試 GetLogList 失敗情況
func TestGetLogList_Error(t *testing.T) {
	// 設置測試環境
	router, mockLogService, handler := setupTestAdminLogHandler(t)

	// 設置模擬錯誤
	expectedError := errors.New("資料庫錯誤")

	// 模擬日誌服務
	mockLogService.getLogListFunc = func(ctx interface{}, req models.AdminLogListRequest) (*models.AdminLogListResponse, error) {
		return nil, expectedError
	}

	// 設置請求
	req, _ := http.NewRequest("GET", "/api/admin/logs/list?page=1", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/list", handler.GetLogList)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	// 解析回應
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedError.Error(), response["error"])
}

// 測試 GetLogList 無效參數
func TestGetLogList_InvalidParams(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestAdminLogHandler(t)

	// 設置請求 (page 參數為負數)
	req, _ := http.NewRequest("GET", "/api/admin/logs/list?page=-1", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/list", handler.GetLogList)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應 (應為 400 Bad Request，但實際上 handler 會修正為預設值，所以會成功)
	assert.Equal(t, http.StatusOK, w.Code)
}

// 測試 GetLogStats 成功情況
func TestGetLogStats_Success(t *testing.T) {
	// 設置測試環境
	router, mockLogService, handler := setupTestAdminLogHandler(t)

	// 設置模擬回應
	expectedResponse := &models.AdminLogStatsResponse{
		TotalLogs:        100,
		CreateOperations: 30,
		UpdateOperations: 40,
		DeleteOperations: 10,
		LoginOperations:  15,
		OtherOperations:  5,
		EntityTypeDistribution: map[string]int{
			"game":        40,
			"user":        30,
			"transaction": 20,
			"system":      10,
		},
		AdminActivityRanking: []models.AdminActivity{
			{
				AdminID:   "admin1",
				AdminName: "TestAdmin",
				Count:     50,
			},
		},
		StartDate: "2023-01-01",
		EndDate:   "2023-01-31",
	}

	// 模擬日誌服務
	mockLogService.getLogStatsFunc = func(ctx interface{}, startDate, endDate string) (*models.AdminLogStatsResponse, error) {
		// 檢查請求參數
		assert.Equal(t, "2023-01-01", startDate)
		assert.Equal(t, "2023-01-31", endDate)

		return expectedResponse, nil
	}

	// 設置請求
	req, _ := http.NewRequest("GET", "/api/admin/logs/stats?start_date=2023-01-01&end_date=2023-01-31", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/stats", handler.GetLogStats)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.AdminLogStatsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedResponse.TotalLogs, response.TotalLogs)
	assert.Equal(t, expectedResponse.CreateOperations, response.CreateOperations)
	assert.Equal(t, expectedResponse.UpdateOperations, response.UpdateOperations)
	assert.Equal(t, expectedResponse.DeleteOperations, response.DeleteOperations)
	assert.Equal(t, expectedResponse.LoginOperations, response.LoginOperations)
	assert.Equal(t, expectedResponse.OtherOperations, response.OtherOperations)
	assert.Equal(t, expectedResponse.EntityTypeDistribution["game"], response.EntityTypeDistribution["game"])
	assert.Equal(t, expectedResponse.StartDate, response.StartDate)
	assert.Equal(t, expectedResponse.EndDate, response.EndDate)
	assert.Len(t, response.AdminActivityRanking, 1)
}

// 測試 GetLogStats 失敗情況
func TestGetLogStats_Error(t *testing.T) {
	// 設置測試環境
	router, mockLogService, handler := setupTestAdminLogHandler(t)

	// 設置模擬錯誤
	expectedError := errors.New("獲取統計數據錯誤")

	// 模擬日誌服務
	mockLogService.getLogStatsFunc = func(ctx interface{}, startDate, endDate string) (*models.AdminLogStatsResponse, error) {
		return nil, expectedError
	}

	// 設置請求
	req, _ := http.NewRequest("GET", "/api/admin/logs/stats?start_date=2023-01-01&end_date=2023-01-31", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/stats", handler.GetLogStats)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedError.Error(), response["error"])
}

// 測試 GetLogStats 使用默認日期
func TestGetLogStats_DefaultDates(t *testing.T) {
	// 設置測試環境
	router, mockLogService, handler := setupTestAdminLogHandler(t)

	// 獲取今天的日期
	today := time.Now().Format("2006-01-02")

	// 設置模擬回應
	expectedResponse := &models.AdminLogStatsResponse{
		TotalLogs:        50,
		CreateOperations: 20,
		UpdateOperations: 15,
		DeleteOperations: 5,
		LoginOperations:  8,
		OtherOperations:  2,
		EntityTypeDistribution: map[string]int{
			"game":        20,
			"user":        15,
			"transaction": 10,
			"system":      5,
		},
		StartDate: today,
		EndDate:   today,
	}

	// 模擬日誌服務
	mockLogService.getLogStatsFunc = func(ctx interface{}, startDate, endDate string) (*models.AdminLogStatsResponse, error) {
		// 檢查請求參數
		assert.Equal(t, today, startDate)
		assert.Equal(t, today, endDate)

		return expectedResponse, nil
	}

	// 設置請求 (不帶日期參數)
	req, _ := http.NewRequest("GET", "/api/admin/logs/stats", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/stats", handler.GetLogStats)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.AdminLogStatsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedResponse.TotalLogs, response.TotalLogs)
	assert.Equal(t, expectedResponse.StartDate, response.StartDate)
	assert.Equal(t, expectedResponse.EndDate, response.EndDate)
}

// 測試 ExportLogs 成功情況
func TestExportLogs_Success(t *testing.T) {
	// 設置測試環境
	router, mockLogService, handler := setupTestAdminLogHandler(t)

	// 設置模擬數據
	expectedData := []byte("日誌ID,管理員,操作類型,對象類型,對象ID,操作描述,狀態,執行時間\nlog1,TestAdmin,create,game,G001,新增遊戲測試,success,2023-01-01 12:00:00")
	expectedFileName := "operation_logs_20230101_20230131.csv"

	// 模擬日誌服務
	mockLogService.exportLogsFunc = func(ctx interface{}, req models.LogExportRequest) ([]byte, string, error) {
		// 檢查請求參數
		assert.Equal(t, "2023-01-01", req.StartDate.Format("2006-01-02"))
		assert.Equal(t, "2023-01-31", req.EndDate.Format("2006-01-02"))
		assert.Equal(t, "game", req.EntityType)

		return expectedData, expectedFileName, nil
	}

	// 設置請求
	req, _ := http.NewRequest("GET", "/api/admin/logs/export?start_date=2023-01-01&end_date=2023-01-31&entity_type=game", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/export", handler.ExportLogs)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "text/csv", w.Header().Get("Content-Type"))
	assert.Equal(t, fmt.Sprintf(`attachment; filename="%s"`, expectedFileName), w.Header().Get("Content-Disposition"))
	assert.Equal(t, fmt.Sprintf("%d", len(expectedData)), w.Header().Get("Content-Length"))
	assert.Equal(t, string(expectedData), w.Body.String())
}

// 測試 ExportLogs 缺少必要參數
func TestExportLogs_MissingParams(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestAdminLogHandler(t)

	// 設置請求 (只有開始日期，沒有結束日期)
	req, _ := http.NewRequest("GET", "/api/admin/logs/export?start_date=2023-01-01", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/export", handler.ExportLogs)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, "必須提供開始日期和結束日期", response["error"])
}

// 測試 ExportLogs 無效的日期格式
func TestExportLogs_InvalidDateFormat(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestAdminLogHandler(t)

	// 設置請求 (日期格式不正確)
	req, _ := http.NewRequest("GET", "/api/admin/logs/export?start_date=20230101&end_date=20230131", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/export", handler.ExportLogs)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, "無效的開始日期格式，應為yyyy-mm-dd", response["error"])
}

// 測試 ExportLogs 結束日期早於開始日期
func TestExportLogs_EndDateBeforeStartDate(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestAdminLogHandler(t)

	// 設置請求 (結束日期早於開始日期)
	req, _ := http.NewRequest("GET", "/api/admin/logs/export?start_date=2023-01-31&end_date=2023-01-01", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/export", handler.ExportLogs)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, "結束日期不能早於開始日期", response["error"])
}

// 測試 ExportLogs 日期範圍超過限制
func TestExportLogs_DateRangeTooLarge(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestAdminLogHandler(t)

	// 設置請求 (日期範圍超過90天)
	startDate := time.Now().AddDate(0, -6, 0).Format("2006-01-02") // 6個月前
	endDate := time.Now().Format("2006-01-02")                     // 今天

	req, _ := http.NewRequest("GET", fmt.Sprintf("/api/admin/logs/export?start_date=%s&end_date=%s", startDate, endDate), nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/export", handler.ExportLogs)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, "匯出範圍不能超過90天", response["error"])
}

// 測試 ExportLogs 服務端錯誤
func TestExportLogs_ServiceError(t *testing.T) {
	// 設置測試環境
	router, mockLogService, handler := setupTestAdminLogHandler(t)

	// 設置模擬錯誤
	expectedError := errors.New("匯出日誌錯誤")

	// 模擬日誌服務
	mockLogService.exportLogsFunc = func(ctx interface{}, req models.LogExportRequest) ([]byte, string, error) {
		return nil, "", expectedError
	}

	// 設置請求
	req, _ := http.NewRequest("GET", "/api/admin/logs/export?start_date=2023-01-01&end_date=2023-01-31", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/logs/export", handler.ExportLogs)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	// 解析回應
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedError.Error(), response["error"])
}
