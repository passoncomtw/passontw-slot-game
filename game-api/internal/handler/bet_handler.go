package handler

import (
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// BetHandler 處理投注相關的HTTP請求
type BetHandler struct {
	betService interfaces.BetService
	logger     *zap.Logger
}

// NewBetHandler 創建投注處理器
func NewBetHandler(betService interfaces.BetService, logger *zap.Logger) *BetHandler {
	return &BetHandler{
		betService: betService,
		logger:     logger,
	}
}

// GetBetHistory godoc
// @Summary 獲取投注歷史
// @Description 獲取當前用戶的投注歷史記錄
// @Tags bets
// @Accept json
// @Produce json
// @Security Bearer
// @Param page query int false "頁碼" default(1)
// @Param page_size query int false "每頁數量" default(10)
// @Param start_date query string false "開始日期" format(date)
// @Param end_date query string false "結束日期" format(date)
// @Param game_id query string false "遊戲ID" format(uuid)
// @Success 200 {object} models.BetHistoryResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/bets/history [get]
func (h *BetHandler) GetBetHistory(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未授權訪問"})
		return
	}

	var req models.BetHistoryRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// 設置默認值
	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = 10
	}

	response, err := h.betService.GetBetHistory(c.Request.Context(), userID.(string), &req)
	if err != nil {
		h.logger.Error("獲取投注歷史失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetBetDetail godoc
// @Summary 獲取投注詳情
// @Description 獲取指定遊戲session的投注詳細信息
// @Tags bets
// @Accept json
// @Produce json
// @Security Bearer
// @Param session_id path string true "遊戲Session ID" format(uuid)
// @Success 200 {array} models.GameRound
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/bets/{session_id} [get]
func (h *BetHandler) GetBetDetail(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未授權訪問"})
		return
	}

	sessionID := c.Param("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "缺少Session ID"})
		return
	}

	rounds, err := h.betService.GetBetDetail(c.Request.Context(), sessionID)
	if err != nil {
		h.logger.Error("獲取投注詳情失敗", zap.Error(err), zap.String("session_id", sessionID))
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, rounds)
}
