package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"passontw-slot-game/internal/service"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	orderService   service.OrderService
	balanceService service.BalanceService
	gameService    service.GameService
	checker        *service.Checker
}

func NewOrderHandler(
	gameService service.GameService,
	orderService service.OrderService,
	balanceService service.BalanceService,
	checker *service.Checker,
) *OrderHandler {
	return &OrderHandler{
		orderService:   orderService,
		balanceService: balanceService,
		gameService:    gameService,
		checker:        checker,
	}
}

type CreateOrderResponse struct {
	OrderID    string       `json:"order_id"`
	GameResult SpinResponse `json:"game_result"`
	BetAmount  float64      `json:"bet_amount"`
	WinAmount  float64      `json:"win_amount"`
	Balance    float64      `json:"balance"`
}

// CreateOrder godoc
// @Summary      取得遊戲結果並且下注
// @Description  取得遊戲結果並且建立注單與派彩
// @Tags         bet
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        request body SpinRequest true "Spin request with bet amount"
// @Success      200  {object}  CreateOrderResponse
// @Failure      400  {object}  ErrorResponse
// @Router       /api/v1/orders [post]
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req SpinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Invalid request format",
			Code:  http.StatusBadRequest,
		})
		return
	}

	// 獲取用戶ID
	userID, ok := c.Get("userId")
	if !ok {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "User not authenticated",
			Code:  http.StatusUnauthorized,
		})
		return
	}

	// 生成遊戲結果
	board := h.gameService.GenerateBoard()
	winResult := h.checker.CheckWin(board)
	boardInt := convertBoardToInt(board)
	totalWinAmount := winResult.Payout * req.BetAmount

	// 構建遊戲結果
	gameResult := SpinResponse{
		Success:      true,
		Board:        boardInt,
		WinAmount:    totalWinAmount,
		TotalLines:   len(winResult.Lines),
		WinningLines: make([]WinningLineInfo, 0),
	}

	// 添加獲勝線信息
	for _, line := range winResult.Lines {
		gameResult.WinningLines = append(gameResult.WinningLines, WinningLineInfo{
			Type:     line.Type,
			Position: line.Position,
			Symbols:  convertSymbolsToInt(line.Symbol, 3),
			Payout:   line.Payout * req.BetAmount,
		})
	}

	// 將遊戲結果轉換為JSON
	gameResultJSON, err := json.Marshal(gameResult)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Failed to process game result",
			Code:  http.StatusInternalServerError,
		})
		return
	}

	// 創建訂單並處理餘額
	order, balanceRecords, err := h.orderService.CreateOrderWithBalance(service.CreateOrderParams{
		UserID:     userID.(int),
		Type:       "SLOT_GAME",
		BetAmount:  req.BetAmount,
		WinAmount:  totalWinAmount,
		GameResult: gameResultJSON,
	})
	fmt.Printf("balanceRecords: %v", balanceRecords)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: fmt.Sprintf("Failed to create order: %v", err),
			Code:  http.StatusInternalServerError,
		})
		return
	}

	// 獲取最新餘額
	currentBalance, err := h.balanceService.GetUserBalance(userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Failed to get current balance",
			Code:  http.StatusInternalServerError,
		})
		return
	}

	// 構建回應
	response := CreateOrderResponse{
		OrderID:    order.OrderID,
		GameResult: gameResult,
		BetAmount:  req.BetAmount,
		WinAmount:  totalWinAmount,
		Balance:    currentBalance,
	}

	c.JSON(http.StatusOK, response)
}
