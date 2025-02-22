package handler

import (
	"fmt"
	"net/http"
	"passontw-slot-game/internal/service"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	gameService service.GameService
	checker     *service.Checker
}

func NewOrderHandler(gameService service.GameService, checker *service.Checker) *OrderHandler {
	return &OrderHandler{
		gameService: gameService,
		checker:     checker,
	}
}

// CreateOrder godoc
// @Summary      取得遊戲結果並且下注
// @Description  取得遊戲結果並且建立注單與派彩
// @Tags         bet
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        request body SpinRequest true "Spin request with bet amount"
// @Success      200  {object}  SpinResponse
// @Failure      400  {object}  ErrorResponse
// @Router       /api/v1/orders [post]
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req SpinRequest
	userId, _ := c.Get("userId")
	fmt.Printf("UserId: %v", userId)
	board := h.gameService.GenerateBoard()
	winResult := h.checker.CheckWin(board)
	boardInt := convertBoardToInt(board)
	totalWinAmount := winResult.Payout * req.BetAmount

	winningLines := make([]WinningLineInfo, 0)
	for _, line := range winResult.Lines {
		winningLines = append(winningLines, WinningLineInfo{
			Type:     line.Type,
			Position: line.Position,
			Symbols:  convertSymbolsToInt(line.Symbol, 3),
			Payout:   line.Payout * req.BetAmount,
		})
	}

	response := SpinResponse{
		Success:      true,
		Board:        boardInt,
		WinAmount:    totalWinAmount,
		TotalLines:   len(winResult.Lines),
		WinningLines: winningLines,
	}
	c.JSON(http.StatusOK, response)
}
