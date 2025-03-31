package handler

import (
	"errors"
	"net/http"

	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// GameHandler 處理遊戲管理相關請求
type GameHandler struct {
	gameService interfaces.GameService
	log         logger.Logger
}

// NewGameHandler 創建一個新的 GameHandler 實例
func NewGameHandler(gameService interfaces.GameService, log logger.Logger) *GameHandler {
	return &GameHandler{
		gameService: gameService,
		log:         log,
	}
}

// RegisterRoutes 註冊遊戲管理路由
func (h *GameHandler) RegisterRoutes(router *gin.RouterGroup, adminAuth gin.HandlerFunc) {
	games := router.Group("/admin/games")
	games.Use(adminAuth)
	{
		games.GET("/list", h.GetGameList)
		games.POST("/create", h.CreateGame)
		games.POST("/status", h.ChangeGameStatus)
		games.GET("/detail/:id", h.GetGameDetail)
	}
}

// GetGameList godoc
// @Summary 獲取遊戲列表
// @Description 獲取遊戲列表，支持名稱模糊搜索
// @Tags 遊戲管理
// @Accept json
// @Produce json
// @Param search query string false "搜索關鍵字"
// @Success 200 {object} models.GameListResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/admin/games/list [get]
// @Security Bearer
func (h *GameHandler) GetGameList(ctx *gin.Context) {
	var req models.GameListRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.gameService.GetGameList(ctx, req)
	if err != nil {
		h.log.Error("獲取遊戲列表失敗", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// CreateGame godoc
// @Summary 創建新遊戲
// @Description 創建新的遊戲
// @Tags 遊戲管理
// @Accept json
// @Produce json
// @Param game body models.CreateGameRequest true "遊戲信息"
// @Success 200 {object} models.GameOperationResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/admin/games/create [post]
// @Security Bearer
func (h *GameHandler) CreateGame(ctx *gin.Context) {
	var req models.CreateGameRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.gameService.CreateGame(ctx, req)
	if err != nil {
		h.log.Error("創建遊戲失敗", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// ChangeGameStatus godoc
// @Summary 變更遊戲狀態
// @Description 上架或下架遊戲
// @Tags 遊戲管理
// @Accept json
// @Produce json
// @Param status body models.GameStatusChangeRequest true "狀態變更請求"
// @Success 200 {object} models.GameOperationResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 404 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/admin/games/status [post]
// @Security Bearer
func (h *GameHandler) ChangeGameStatus(ctx *gin.Context) {
	var req models.GameStatusChangeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.gameService.ChangeGameStatus(ctx, req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if errors.Is(err, errors.New("遊戲不存在")) {
			statusCode = http.StatusNotFound
		}
		h.log.Error("變更遊戲狀態失敗", zap.Error(err))
		ctx.JSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// GetGameDetail godoc
// @Summary 獲取遊戲詳情
// @Description 根據ID獲取遊戲詳細信息
// @Tags 遊戲管理
// @Accept json
// @Produce json
// @Param id path string true "遊戲ID"
// @Success 200 {object} models.GameResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 404 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/admin/games/detail/{id} [get]
// @Security Bearer
func (h *GameHandler) GetGameDetail(ctx *gin.Context) {
	idStr := ctx.Param("id")
	gameID, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "無效的遊戲ID"})
		return
	}

	game, err := h.gameService.GetGameByID(ctx, gameID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if errors.Is(err, errors.New("遊戲不存在")) {
			statusCode = http.StatusNotFound
		}
		h.log.Error("獲取遊戲詳情失敗", zap.Error(err))
		ctx.JSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, game)
}
