package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"game-api/internal/domain/models"
	"game-api/pkg/logger"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// 模擬 GameService 介面
type MockGameService struct {
	getGameListFunc      func(ctx context.Context, req models.GameListRequest) (*models.GameListResponse, error)
	createGameFunc       func(ctx context.Context, req models.CreateGameRequest) (*models.GameOperationResponse, error)
	changeGameStatusFunc func(ctx context.Context, req models.GameStatusChangeRequest) (*models.GameOperationResponse, error)
	getGameByIDFunc      func(ctx context.Context, gameID uuid.UUID) (*models.GameResponse, error)
}

// GetGameList 模擬獲取遊戲列表
func (m *MockGameService) GetGameList(ctx context.Context, req models.GameListRequest) (*models.GameListResponse, error) {
	if m.getGameListFunc != nil {
		return m.getGameListFunc(ctx, req)
	}
	return nil, errors.New("未實現 GetGameList")
}

// CreateGame 模擬創建遊戲
func (m *MockGameService) CreateGame(ctx context.Context, req models.CreateGameRequest) (*models.GameOperationResponse, error) {
	if m.createGameFunc != nil {
		return m.createGameFunc(ctx, req)
	}
	return nil, errors.New("未實現 CreateGame")
}

// ChangeGameStatus 模擬修改遊戲狀態
func (m *MockGameService) ChangeGameStatus(ctx context.Context, req models.GameStatusChangeRequest) (*models.GameOperationResponse, error) {
	if m.changeGameStatusFunc != nil {
		return m.changeGameStatusFunc(ctx, req)
	}
	return nil, errors.New("未實現 ChangeGameStatus")
}

// GetGameByID 模擬獲取遊戲詳情
func (m *MockGameService) GetGameByID(ctx context.Context, gameID uuid.UUID) (*models.GameResponse, error) {
	if m.getGameByIDFunc != nil {
		return m.getGameByIDFunc(ctx, gameID)
	}
	return nil, errors.New("未實現 GetGameByID")
}

// 初始化測試環境
func setupTestGameHandler(t *testing.T) (*gin.Engine, *MockGameService, *GameHandler) {
	// 設置 Gin 為測試模式
	gin.SetMode(gin.TestMode)

	// 創建 Gin 引擎
	router := gin.New()

	// 創建模擬遊戲服務
	mockGameService := &MockGameService{}

	// 創建模擬日誌工具
	mockLogger := &logger.NoOpLogger{}

	// 創建處理程序
	handler := &GameHandler{
		gameService: mockGameService,
		log:         mockLogger,
	}

	return router, mockGameService, handler
}

// 測試獲取遊戲列表成功
func TestGetGameList_Success(t *testing.T) {
	// 設置測試環境
	router, mockGameService, handler := setupTestGameHandler(t)

	// 設置模擬回應
	mockGameService.getGameListFunc = func(ctx context.Context, req models.GameListRequest) (*models.GameListResponse, error) {
		// 檢查請求參數
		assert.Equal(t, "幸運七", req.Search)

		return &models.GameListResponse{
			Total: 1,
			Games: []models.GameResponse{
				{
					ID:          uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
					Title:       "幸運七",
					Description: "經典老虎機遊戲",
					RTP:         96.5,
					IsActive:    true,
				},
			},
		}, nil
	}

	// 創建請求
	req, _ := http.NewRequest("GET", "/api/admin/games/list?search=幸運七", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/games/list", handler.GetGameList)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.GameListResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, int64(1), response.Total)
	assert.Len(t, response.Games, 1)
	assert.Equal(t, "幸運七", response.Games[0].Title)
}

// 測試獲取遊戲列表失敗
func TestGetGameList_Error(t *testing.T) {
	// 設置測試環境
	router, mockGameService, handler := setupTestGameHandler(t)

	// 設置模擬錯誤
	expectedError := errors.New("資料庫錯誤")
	mockGameService.getGameListFunc = func(ctx context.Context, req models.GameListRequest) (*models.GameListResponse, error) {
		return nil, expectedError
	}

	// 創建請求
	req, _ := http.NewRequest("GET", "/api/admin/games/list", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/games/list", handler.GetGameList)

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

// 測試創建遊戲成功
func TestCreateGame_Success(t *testing.T) {
	// 設置測試環境
	router, mockGameService, handler := setupTestGameHandler(t)

	// 設置模擬回應
	mockGameService.createGameFunc = func(ctx context.Context, req models.CreateGameRequest) (*models.GameOperationResponse, error) {
		// 檢查請求參數
		assert.Equal(t, "寶藏樂園", req.Title)
		assert.Equal(t, "slot", string(req.GameType))

		return &models.GameOperationResponse{
			Success: true,
			Message: "遊戲 寶藏樂園 已成功創建",
		}, nil
	}

	// 創建請求
	createRequest := models.CreateGameRequest{
		Title:           "寶藏樂園",
		Description:     "一款充滿寶藏的刺激老虎機遊戲",
		GameType:        "slot",
		Icon:            "treasure",
		BackgroundColor: "#FF9800",
		RTP:             95.8,
		Volatility:      "high",
		MinBet:          2.0,
		MaxBet:          1000.0,
		Features:        "{\"free_spins\":true,\"bonus_rounds\":true,\"multipliers\":true}",
		IsFeatured:      false,
		IsNew:           true,
		IsActive:        true,
	}
	jsonData, _ := json.Marshal(createRequest)
	req, _ := http.NewRequest("POST", "/api/admin/games/create", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 設置路由
	router.POST("/api/admin/games/create", handler.CreateGame)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.GameOperationResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Contains(t, response.Message, "寶藏樂園")
}

// 測試創建遊戲失敗
func TestCreateGame_Error(t *testing.T) {
	// 設置測試環境
	router, mockGameService, handler := setupTestGameHandler(t)

	// 設置模擬錯誤
	expectedError := errors.New("遊戲標題已存在")
	mockGameService.createGameFunc = func(ctx context.Context, req models.CreateGameRequest) (*models.GameOperationResponse, error) {
		return nil, expectedError
	}

	// 創建請求
	createRequest := models.CreateGameRequest{
		Title:           "寶藏樂園",
		Description:     "一款充滿寶藏的刺激老虎機遊戲",
		GameType:        "slot",
		Icon:            "treasure",
		BackgroundColor: "#FF9800",
		RTP:             95.8,
		Volatility:      "high",
		MinBet:          2.0,
		MaxBet:          1000.0,
	}
	jsonData, _ := json.Marshal(createRequest)
	req, _ := http.NewRequest("POST", "/api/admin/games/create", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 設置路由
	router.POST("/api/admin/games/create", handler.CreateGame)

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

// 測試創建遊戲參數無效
func TestCreateGame_InvalidRequest(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestGameHandler(t)

	// 創建無效請求 (缺少必要的參數)
	createRequest := map[string]string{
		"title": "寶藏樂園",
		// 缺少其他必要的參數
	}
	jsonData, _ := json.Marshal(createRequest)
	req, _ := http.NewRequest("POST", "/api/admin/games/create", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 設置路由
	router.POST("/api/admin/games/create", handler.CreateGame)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// 測試修改遊戲狀態成功
func TestChangeGameStatus_Success(t *testing.T) {
	// 設置測試環境
	router, mockGameService, handler := setupTestGameHandler(t)

	// 初始化遊戲 ID
	gameID := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")

	// 設置模擬回應
	mockGameService.changeGameStatusFunc = func(ctx context.Context, req models.GameStatusChangeRequest) (*models.GameOperationResponse, error) {
		// 檢查請求參數
		assert.Equal(t, gameID, req.GameID)
		assert.True(t, req.Status)

		return &models.GameOperationResponse{
			Success: true,
			Message: "遊戲狀態已更新",
		}, nil
	}

	// 創建請求
	statusRequest := models.GameStatusChangeRequest{
		GameID: gameID,
		Status: true,
	}
	jsonData, _ := json.Marshal(statusRequest)
	req, _ := http.NewRequest("POST", "/api/admin/games/status", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 設置路由
	router.POST("/api/admin/games/status", handler.ChangeGameStatus)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.GameOperationResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "遊戲狀態已更新", response.Message)
}

// 測試修改遊戲狀態失敗 - 遊戲不存在
func TestChangeGameStatus_NotFound(t *testing.T) {
	// 設置測試環境
	router, mockGameService, handler := setupTestGameHandler(t)

	// 初始化遊戲 ID
	gameID := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")

	// 設置模擬錯誤
	expectedError := errors.New("遊戲不存在")
	mockGameService.changeGameStatusFunc = func(ctx context.Context, req models.GameStatusChangeRequest) (*models.GameOperationResponse, error) {
		return nil, expectedError
	}

	// 創建請求
	statusRequest := models.GameStatusChangeRequest{
		GameID: gameID,
		Status: true,
	}
	jsonData, _ := json.Marshal(statusRequest)
	req, _ := http.NewRequest("POST", "/api/admin/games/status", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// 設置路由
	router.POST("/api/admin/games/status", handler.ChangeGameStatus)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusNotFound, w.Code)

	// 解析回應
	var response gin.H
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedError.Error(), response["error"])
}

// 測試獲取遊戲詳情成功
func TestGetGameDetail_Success(t *testing.T) {
	// 設置測試環境
	router, mockGameService, handler := setupTestGameHandler(t)

	// 初始化遊戲 ID
	gameID := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")

	// 設置模擬回應
	mockGameService.getGameByIDFunc = func(ctx context.Context, id uuid.UUID) (*models.GameResponse, error) {
		// 檢查請求參數
		assert.Equal(t, gameID, id)

		return &models.GameResponse{
			ID:          gameID,
			Title:       "幸運七",
			Description: "經典老虎機遊戲",
			RTP:         96.5,
			IsActive:    true,
		}, nil
	}

	// 創建請求
	req, _ := http.NewRequest("GET", "/api/admin/games/detail/550e8400-e29b-41d4-a716-446655440000", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/games/detail/:id", handler.GetGameDetail)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusOK, w.Code)

	// 解析回應
	var response models.GameResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, gameID, response.ID)
	assert.Equal(t, "幸運七", response.Title)
}

// 測試獲取遊戲詳情失敗 - 無效的遊戲 ID
func TestGetGameDetail_InvalidID(t *testing.T) {
	// 設置測試環境
	router, _, handler := setupTestGameHandler(t)

	// 創建請求 (使用無效的 UUID)
	req, _ := http.NewRequest("GET", "/api/admin/games/detail/invalid-uuid", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/games/detail/:id", handler.GetGameDetail)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 解析回應
	var response gin.H
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, "無效的遊戲ID", response["error"])
}

// 測試獲取遊戲詳情失敗 - 遊戲不存在
func TestGetGameDetail_NotFound(t *testing.T) {
	// 設置測試環境
	router, mockGameService, handler := setupTestGameHandler(t)

	// 初始化遊戲 ID
	gameID := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")

	// 設置模擬錯誤
	expectedError := errors.New("遊戲不存在")
	mockGameService.getGameByIDFunc = func(ctx context.Context, id uuid.UUID) (*models.GameResponse, error) {
		return nil, expectedError
	}

	// 創建請求
	req, _ := http.NewRequest("GET", "/api/admin/games/detail/550e8400-e29b-41d4-a716-446655440000", nil)
	w := httptest.NewRecorder()

	// 設置路由
	router.GET("/api/admin/games/detail/:id", handler.GetGameDetail)

	// 執行請求
	router.ServeHTTP(w, req)

	// 檢查回應
	assert.Equal(t, http.StatusNotFound, w.Code)

	// 解析回應
	var response gin.H
	err := json.Unmarshal(w.Body.Bytes(), &response)

	// 驗證回應
	assert.NoError(t, err)
	assert.Equal(t, expectedError.Error(), response["error"])
}
