package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"game-api/internal/domain/models"
	"game-api/internal/mocks"
	"game-api/pkg/logger"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

// 創建一個模擬的 Logger 實現
type mockLogger struct{}

func (m *mockLogger) Debug(msg string, fields ...zap.Field) {}
func (m *mockLogger) Info(msg string, fields ...zap.Field)  {}
func (m *mockLogger) Warn(msg string, fields ...zap.Field)  {}
func (m *mockLogger) Error(msg string, fields ...zap.Field) {}
func (m *mockLogger) Fatal(msg string, fields ...zap.Field) {}
func (m *mockLogger) With(fields ...zap.Field) logger.Logger {
	return m
}
func (m *mockLogger) GetZapLogger() *zap.Logger {
	return nil
}

func setupAdminHandlerTest(t *testing.T) (*gin.Engine, *mocks.MockAdminService, *AdminHandler) {
	// 設置 Gin 為測試模式
	gin.SetMode(gin.TestMode)

	// 創建 Gin 引擎
	router := gin.New()

	// 創建控制器
	ctrl := gomock.NewController(t)

	// 創建模擬服務
	mockAdminService := mocks.NewMockAdminService(ctrl)

	// 創建模擬日誌工具
	mockLogger := &mockLogger{}

	// 創建處理程序
	handler := &AdminHandler{
		adminService: mockAdminService,
		log:          mockLogger,
	}

	return router, mockAdminService, handler
}

// 測試管理員登錄成功
func TestAdminLogin_Success(t *testing.T) {
	// 設置測試環境
	router, mockAdminService, handler := setupAdminHandlerTest(t)

	// 設置要登錄的管理員資料
	loginReq := models.AdminLoginRequest{
		Email:    "admin@example.com",
		Password: "password123",
	}

	// 設置模擬回應資料
	loginResp := &models.LoginResponse{
		Token: "admin-jwt-token-123",
	}

	// 設置模擬行為
	mockAdminService.EXPECT().
		AdminLogin(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ interface{}, req models.AdminLoginRequest) (*models.LoginResponse, error) {
			assert.Equal(t, loginReq.Email, req.Email)
			assert.Equal(t, loginReq.Password, req.Password)
			return loginResp, nil
		})

	// 設置路由
	router.POST("/api/admin/login", handler.AdminLogin)

	// 創建請求
	jsonData, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/api/admin/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.LoginResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, loginResp.Token, response.Token)
}

// 測試管理員登錄失敗
func TestAdminLogin_Failure(t *testing.T) {
	// 設置測試環境
	router, mockAdminService, handler := setupAdminHandlerTest(t)

	// 設置要登錄的管理員資料
	loginReq := models.AdminLoginRequest{
		Email:    "admin@example.com",
		Password: "wrong-password",
	}

	// 設置模擬錯誤
	expectedError := errors.New("無效的用戶名或密碼")
	mockAdminService.EXPECT().
		AdminLogin(gomock.Any(), gomock.Any()).
		Return(nil, expectedError)

	// 設置路由
	router.POST("/api/admin/login", handler.AdminLogin)

	// 創建請求
	jsonData, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/api/admin/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// 解析回應
	var response gin.H
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedError.Error(), response["error"])
}

// 測試獲取用戶列表成功
func TestGetUserList_Success(t *testing.T) {
	// 設置測試環境
	router, mockAdminService, handler := setupAdminHandlerTest(t)

	// 設置請求參數
	req := models.AdminUserListRequest{
		Page:     1,
		PageSize: 10,
		Status:   "active",
		Search:   "user",
	}

	// 模擬回應資料
	userList := []models.AdminUserSummary{
		{
			ID:       1,
			Username: "user1",
			Email:    "user1@example.com",
			Status:   "active",
		},
		{
			ID:       2,
			Username: "user2",
			Email:    "user2@example.com",
			Status:   "active",
		},
	}

	respData := &models.AdminUserListResponse{
		CurrentPage: 1,
		PageSize:    10,
		TotalPages:  1,
		Total:       2,
		Users:       userList,
	}

	// 設置模擬行為
	mockAdminService.EXPECT().
		GetUserList(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ interface{}, request models.AdminUserListRequest) (*models.AdminUserListResponse, error) {
			assert.Equal(t, req.Page, request.Page)
			assert.Equal(t, req.PageSize, request.PageSize)
			assert.Equal(t, req.Status, request.Status)
			assert.Equal(t, req.Search, request.Search)
			return respData, nil
		})

	// 設置路由
	router.GET("/api/admin/users", handler.GetUserList)

	// 創建請求
	req2, _ := http.NewRequest("GET", "/api/admin/users?page=1&page_size=10&status=active&search=user", nil)
	w := httptest.NewRecorder()

	// 執行請求
	router.ServeHTTP(w, req2)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.AdminUserListResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Len(t, response.Users, 2)
	assert.Equal(t, int64(2), response.Total)
	assert.Equal(t, 1, response.CurrentPage)
	assert.Equal(t, 10, response.PageSize)
	assert.Equal(t, "user1", response.Users[0].Username)
	assert.Equal(t, "user2", response.Users[1].Username)
}
