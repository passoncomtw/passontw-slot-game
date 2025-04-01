package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"game-api/internal/domain/models"
	"game-api/pkg/logger"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// 模擬 AuthService 介面
type MockAuthService struct {
	appLoginFunc       func(ctx interface{}, req models.AppLoginRequest) (*models.TokenResponse, error)
	registerFunc       func(ctx interface{}, req *models.RegisterRequest) (*models.User, error)
	getUserProfileFunc func(ctx interface{}, userID string) (*models.UserProfileResponse, error)
	validateTokenFunc  func(token string) (string, error)
	generateTokenFunc  func(data models.TokenData) (string, int64, error)
}

// AppLogin 模擬用戶登入
func (m *MockAuthService) AppLogin(ctx interface{}, req models.AppLoginRequest) (*models.TokenResponse, error) {
	if m.appLoginFunc != nil {
		return m.appLoginFunc(ctx, req)
	}
	return nil, errors.New("未實現 AppLogin")
}

// Register 模擬用戶註冊
func (m *MockAuthService) Register(ctx interface{}, req *models.RegisterRequest) (*models.User, error) {
	if m.registerFunc != nil {
		return m.registerFunc(ctx, req)
	}
	return nil, errors.New("未實現 Register")
}

// GetUserProfile 模擬獲取用戶資料
func (m *MockAuthService) GetUserProfile(ctx interface{}, userID string) (*models.UserProfileResponse, error) {
	if m.getUserProfileFunc != nil {
		return m.getUserProfileFunc(ctx, userID)
	}
	return nil, errors.New("未實現 GetUserProfile")
}

// ValidateToken 模擬驗證令牌
func (m *MockAuthService) ValidateToken(token string) (string, error) {
	if m.validateTokenFunc != nil {
		return m.validateTokenFunc(token)
	}
	return "", errors.New("未實現 ValidateToken")
}

// GenerateToken 模擬生成令牌
func (m *MockAuthService) GenerateToken(data models.TokenData) (string, int64, error) {
	if m.generateTokenFunc != nil {
		return m.generateTokenFunc(data)
	}
	return "", 0, errors.New("未實現 GenerateToken")
}

// AdminLogin 模擬管理員登入
func (m *MockAuthService) AdminLogin(ctx interface{}, req models.AdminLoginRequest) (*models.TokenResponse, error) {
	return nil, errors.New("未實現 AdminLogin")
}

// 初始化測試環境
func setupTestAuthHandler(t *testing.T) (*gin.Engine, *MockAuthService, *AuthHandler) {
	// 設置 Gin 為測試模式
	gin.SetMode(gin.TestMode)

	// 創建 Gin 引擎
	router := gin.New()

	// 創建模擬認證服務
	mockAuthService := &MockAuthService{}

	// 創建模擬日誌工具
	mockLogger := &logger.NoOpLogger{}

	// 創建處理程序
	handler := &AuthHandler{
		authService: mockAuthService,
		log:         mockLogger,
	}

	return router, mockAuthService, handler
}

// 測試用戶登入成功
func TestLogin_Success(t *testing.T) {
	// 設置測試環境
	router, mockAuthService, handler := setupTestAuthHandler(t)

	// 設置模擬回應
	expectedToken := "jwt-token-123"
	mockAuthService.appLoginFunc = func(ctx interface{}, req models.AppLoginRequest) (*models.TokenResponse, error) {
		// 檢查請求參數
		assert.Equal(t, "test@example.com", req.Email)
		assert.Equal(t, "password123", req.Password)

		return &models.TokenResponse{Token: expectedToken}, nil
	}

	// 創建請求
	loginRequest := models.AppLoginRequest{
		Email:    "test@example.com",
		Password: "password123",
	}
	jsonData, _ := json.Marshal(loginRequest)
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 設置路由
	router.POST("/api/v1/auth/login", handler.Login)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.TokenResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedToken, response.Token)
}

// 測試用戶登入失敗
func TestLogin_Failure(t *testing.T) {
	// 設置測試環境
	router, mockAuthService, handler := setupTestAuthHandler(t)

	// 設置模擬錯誤
	expectedError := errors.New("無效的憑證")
	mockAuthService.appLoginFunc = func(ctx interface{}, req models.AppLoginRequest) (*models.TokenResponse, error) {
		return nil, expectedError
	}

	// 創建請求
	loginRequest := models.AppLoginRequest{
		Email:    "test@example.com",
		Password: "wrong-password",
	}
	jsonData, _ := json.Marshal(loginRequest)
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 設置路由
	router.POST("/api/v1/auth/login", handler.Login)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// 解析回應
	var response ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Contains(t, response.Error, expectedError.Error())
}

// 測試用戶登入無效的請求
func TestLogin_InvalidRequest(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestAuthHandler(t)

	// 創建無效請求 (缺少密碼)
	loginRequest := map[string]string{
		"email": "test@example.com",
		// 缺少 password
	}
	jsonData, _ := json.Marshal(loginRequest)
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 設置路由
	router.POST("/api/v1/auth/login", handler.Login)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Contains(t, response.Error, "無效的請求參數")
}

// 測試用戶註冊成功
func TestRegister_Success(t *testing.T) {
	// 設置測試環境
	router, mockAuthService, handler := setupTestAuthHandler(t)

	// 設置模擬註冊回應
	userID := "user-123"
	mockAuthService.registerFunc = func(ctx interface{}, req *models.RegisterRequest) (*models.User, error) {
		// 檢查請求參數
		assert.Equal(t, "testuser", req.Username)
		assert.Equal(t, "test@example.com", req.Email)
		assert.Equal(t, "password123", req.Password)

		return &models.User{
			UserID: models.UUID(userID),
			Role:   "user",
		}, nil
	}

	// 設置模擬令牌生成
	expectedToken := "jwt-token-123"
	mockAuthService.generateTokenFunc = func(data models.TokenData) (string, int64, error) {
		assert.Equal(t, userID, data.UserID)
		assert.Equal(t, "user", data.Role)

		return expectedToken, 3600, nil
	}

	// 創建請求
	registerRequest := models.RegisterRequest{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}
	jsonData, _ := json.Marshal(registerRequest)
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 設置路由
	router.POST("/api/v1/auth/register", handler.Register)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.TokenResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedToken, response.Token)
}

// 測試用戶註冊失敗
func TestRegister_Failure(t *testing.T) {
	// 設置測試環境
	router, mockAuthService, handler := setupTestAuthHandler(t)

	// 設置模擬錯誤
	expectedError := errors.New("電子郵件已被使用")
	mockAuthService.registerFunc = func(ctx interface{}, req *models.RegisterRequest) (*models.User, error) {
		return nil, expectedError
	}

	// 創建請求
	registerRequest := models.RegisterRequest{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}
	jsonData, _ := json.Marshal(registerRequest)
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 設置路由
	router.POST("/api/v1/auth/register", handler.Register)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Contains(t, response.Error, expectedError.Error())
}

// 測試獲取用戶資料成功
func TestGetUserProfile_Success(t *testing.T) {
	// 設置測試環境
	router, mockAuthService, handler := setupTestAuthHandler(t)

	// 設置模擬獲取用戶資料回應
	userID := "user-123"
	expectedProfile := &models.UserProfileResponse{
		UserID:    userID,
		Username:  "testuser",
		Email:     "test@example.com",
		CreatedAt: "2023-01-01T00:00:00Z",
	}

	mockAuthService.getUserProfileFunc = func(ctx interface{}, uid string) (*models.UserProfileResponse, error) {
		assert.Equal(t, userID, uid)
		return expectedProfile, nil
	}

	// 設置測試上下文
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Set("userID", userID)

	w := httptest.NewRecorder()
	c.Request, _ = http.NewRequest("GET", "/api/v1/auth/profile", nil)
	c.Writer = w

	// 執行處理程序
	handler.GetUserProfile(c)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.UserProfileResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedProfile.UserID, response.UserID)
	assert.Equal(t, expectedProfile.Username, response.Username)
	assert.Equal(t, expectedProfile.Email, response.Email)
	assert.Equal(t, expectedProfile.CreatedAt, response.CreatedAt)
}

// 測試獲取用戶資料未認證
func TestGetUserProfile_Unauthorized(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestAuthHandler(t)

	// 設置測試上下文 (不設置 userID)
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())

	w := httptest.NewRecorder()
	c.Request, _ = http.NewRequest("GET", "/api/v1/auth/profile", nil)
	c.Writer = w

	// 執行處理程序
	handler.GetUserProfile(c)

	// 檢查回應
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// 解析回應
	var response ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, "未授權訪問", response.Error)
}

// 測試 AuthMiddleware 成功
func TestAuthMiddleware_Success(t *testing.T) {
	// 設置測試環境
	router, mockAuthService, handler := setupTestAuthHandler(t)

	// 設置模擬回應
	tokenString := "valid-token"
	userID := "user-123"
	mockAuthService.validateTokenFunc = func(token string) (string, error) {
		assert.Equal(t, tokenString, token)
		return userID, nil
	}

	// 設置路由 (包含中間件)
	router.GET("/protected", handler.AuthMiddleware(), func(c *gin.Context) {
		// 檢查是否設置了 userID
		uid, exists := c.Get("userID")
		assert.True(t, exists)
		assert.Equal(t, userID, uid)

		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	// 創建請求
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)
	w := httptest.NewRecorder()

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)
}

// 測試 AuthMiddleware 缺少令牌
func TestAuthMiddleware_MissingToken(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestAuthHandler(t)

	// 設置路由 (包含中間件)
	router.GET("/protected", handler.AuthMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	// 創建請求 (沒有 Authorization 頭)
	req, _ := http.NewRequest("GET", "/protected", nil)
	w := httptest.NewRecorder()

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// 解析回應
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, "未授權", response["error"])
}

// 測試 AuthMiddleware 無效的令牌
func TestAuthMiddleware_InvalidToken(t *testing.T) {
	// 設置測試環境
	router, mockAuthService, handler := setupTestAuthHandler(t)

	// 設置模擬錯誤
	tokenString := "invalid-token"
	expectedError := errors.New("無效或過期的令牌")
	mockAuthService.validateTokenFunc = func(token string) (string, error) {
		assert.Equal(t, tokenString, token)
		return "", expectedError
	}

	// 設置路由 (包含中間件)
	router.GET("/protected", handler.AuthMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	// 創建請求
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)
	w := httptest.NewRecorder()

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// 解析回應
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, "未授權", response["error"])
}
