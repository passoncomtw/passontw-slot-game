package handler

import (
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// AppHandler 處理遊戲相關的HTTP請求
type AppHandler struct {
	appService interfaces.AppService
	logger     *zap.Logger
}

// NewAppHandler 創建遊戲處理器
func NewAppHandler(appService interfaces.AppService, logger *zap.Logger) *AppHandler {
	return &AppHandler{
		appService: appService,
		logger:     logger,
	}
}

// GetGameList godoc
// @Summary 獲取遊戲列表
// @Description 獲取遊戲列表，支持分頁和排序
// @Tags games
// @Accept json
// @Produce json
// @Param type query string false "遊戲類型 (slot, card, table, arcade)"
// @Param featured query bool false "是否為推薦遊戲"
// @Param new query bool false "是否為新遊戲"
// @Param page query int false "頁碼" default(1)
// @Param page_size query int false "每頁數量" default(10)
// @Param sort_by query string false "排序欄位 (title, rtp, created_at)" default(created_at)
// @Param sort_order query string false "排序方式 (asc, desc)" default(desc)
// @Success 200 {object} models.AppGameListResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/games [get]
func (h *AppHandler) GetGameList(c *gin.Context) {
	var req models.AppGameListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	response, err := h.appService.GetGameList(c.Request.Context(), req)
	if err != nil {
		h.logger.Error("獲取遊戲列表失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetGameDetail godoc
// @Summary 獲取遊戲詳情
// @Description 獲取指定遊戲的詳細信息
// @Tags games
// @Accept json
// @Produce json
// @Param game_id path string true "遊戲ID" format(uuid)
// @Success 200 {object} models.AppGameResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/games/{game_id} [get]
func (h *AppHandler) GetGameDetail(c *gin.Context) {
	gameID := c.Param("game_id")
	if gameID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "缺少遊戲ID"})
		return
	}

	response, err := h.appService.GetGameDetail(c.Request.Context(), gameID)
	if err != nil {
		h.logger.Error("獲取遊戲詳情失敗", zap.Error(err), zap.String("game_id", gameID))
		if err.Error() == "找不到該遊戲" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// StartGameSession godoc
// @Summary 開始遊戲會話
// @Description 為當前用戶創建一個新的遊戲會話
// @Tags games
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body models.GameSessionRequest true "會話請求參數"
// @Success 200 {object} models.GameSessionResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/games/sessions [post]
func (h *AppHandler) StartGameSession(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未授權訪問"})
		return
	}

	var req models.GameSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	response, err := h.appService.StartGameSession(c.Request.Context(), userID.(string), req)
	if err != nil {
		h.logger.Error("開始遊戲會話失敗", zap.Error(err))
		if err.Error() == "找不到該遊戲或遊戲已停用" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// PlaceBet godoc
// @Summary 進行遊戲投注
// @Description 在當前遊戲會話中進行投注
// @Tags games
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body models.BetRequest true "投注請求參數"
// @Success 200 {object} models.BetResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/games/bets [post]
func (h *AppHandler) PlaceBet(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未授權訪問"})
		return
	}

	var req models.BetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	response, err := h.appService.PlaceBet(c.Request.Context(), userID.(string), req)
	if err != nil {
		h.logger.Error("投注失敗", zap.Error(err))
		if err.Error() == "找不到該遊戲會話或會話不屬於當前用戶" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: err.Error()})
			return
		}
		if err.Error() == "餘額不足" || err.Error() == "該遊戲會話已結束" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// EndGameSession godoc
// @Summary 結束遊戲會話
// @Description 結束當前用戶的遊戲會話
// @Tags games
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body models.EndSessionRequest true "結束會話請求參數"
// @Success 200 {object} models.EndSessionResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/games/sessions/end [post]
func (h *AppHandler) EndGameSession(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未授權訪問"})
		return
	}

	var req models.EndSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	response, err := h.appService.EndGameSession(c.Request.Context(), userID.(string), req)
	if err != nil {
		h.logger.Error("結束遊戲會話失敗", zap.Error(err))
		if err.Error() == "找不到該遊戲會話或會話不屬於當前用戶" {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: err.Error()})
			return
		}
		if err.Error() == "該遊戲會話已結束" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetWalletBalance godoc
// @Summary 獲取錢包餘額
// @Description 獲取當前用戶的錢包餘額
// @Tags wallet
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} models.WalletBalanceResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/wallet/balance [get]
func (h *AppHandler) GetWalletBalance(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未授權訪問"})
		return
	}

	response, err := h.appService.GetWalletBalance(c.Request.Context(), userID.(string))
	if err != nil {
		h.logger.Error("獲取錢包餘額失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// RequestDeposit godoc
// @Summary 請求存款
// @Description 創建一個新的存款請求
// @Tags wallet
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body models.AppDepositRequest true "存款請求參數"
// @Success 200 {object} models.TransactionResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/wallet/deposit [post]
func (h *AppHandler) RequestDeposit(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未授權訪問"})
		return
	}

	var req models.AppDepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "無效的請求參數: " + err.Error()})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "存款金額必須大於零"})
		return
	}

	response, err := h.appService.RequestDeposit(c.Request.Context(), userID.(string), req)
	if err != nil {
		h.logger.Error("請求存款失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// RequestWithdraw godoc
// @Summary 請求提現
// @Description 創建一個新的提現請求
// @Tags wallet
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body models.WithdrawRequest true "提現請求參數"
// @Success 200 {object} models.TransactionResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/wallet/withdraw [post]
func (h *AppHandler) RequestWithdraw(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未授權訪問"})
		return
	}

	var req models.WithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "無效的請求參數: " + err.Error()})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "提現金額必須大於零"})
		return
	}

	response, err := h.appService.RequestWithdraw(c.Request.Context(), userID.(string), req)
	if err != nil {
		h.logger.Error("請求提現失敗", zap.Error(err))
		if err.Error() == "餘額不足" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetTransactionHistory godoc
// @Summary 獲取交易歷史
// @Description 獲取當前用戶的交易歷史
// @Tags wallet
// @Accept json
// @Produce json
// @Security Bearer
// @Param type query string false "交易類型 (deposit, withdraw, bet, win, all)"
// @Param start_date query string false "開始日期 (YYYY-MM-DD)"
// @Param end_date query string false "結束日期 (YYYY-MM-DD)"
// @Param page query int false "頁碼" default(1)
// @Param page_size query int false "每頁數量" default(10)
// @Success 200 {object} models.TransactionHistoryResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/wallet/transactions [get]
func (h *AppHandler) GetTransactionHistory(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未授權訪問"})
		return
	}

	var req models.TransactionHistoryRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	response, err := h.appService.GetTransactionHistory(c.Request.Context(), userID.(string), req)
	if err != nil {
		h.logger.Error("獲取交易歷史失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// RegisterRoutes 註冊路由
func (h *AppHandler) RegisterRoutes(router *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	// 公開路由
	games := router.Group("/games")
	{
		games.GET("", h.GetGameList)
		games.GET("/:game_id", h.GetGameDetail)
	}

	// 需要認證的路由
	authorizedGames := router.Group("/games")
	authorizedGames.Use(authMiddleware)
	{
		authorizedGames.POST("/sessions", h.StartGameSession)
		authorizedGames.POST("/bets", h.PlaceBet)
		authorizedGames.POST("/sessions/end", h.EndGameSession)
	}

	// 錢包相關路由
	wallet := router.Group("/wallet")
	wallet.Use(authMiddleware)
	{
		wallet.GET("/balance", h.GetWalletBalance)
		wallet.POST("/deposit", h.RequestDeposit)
		wallet.POST("/withdraw", h.RequestWithdraw)
		wallet.GET("/transactions", h.GetTransactionHistory)
	}
}
