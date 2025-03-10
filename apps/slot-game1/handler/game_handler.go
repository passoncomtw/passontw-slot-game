package handler

import (
	"net/http"
	"passontw-slot-game/apps/slot-game1/domain"
	"passontw-slot-game/apps/slot-game1/domain/models"
	"passontw-slot-game/apps/slot-game1/interfaces"
	"passontw-slot-game/apps/slot-game1/interfaces/types"
	"passontw-slot-game/apps/slot-game1/service"

	"github.com/gin-gonic/gin"
)

type GameHandler struct {
	gameService service.GameService
	checker     *service.Checker
}

func NewGameHandler(gameService service.GameService, checker *service.Checker) *GameHandler {
	return &GameHandler{
		gameService: gameService,
		checker:     checker,
	}
}

// GetGameSpin godoc
// @Summary      Get Game Spin Result
// @Description  Spin the slot game with bet amount and get result
// @Tags         game
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        request body interfaces.SpinRequest true "Spin request with bet amount"
// @Success      200  {object}  interfaces.SpinResponse
// @Failure      400  {object}  types.ErrorResponse
// @Router       /api/v1/game/spin [post]
func (h *GameHandler) GetGameSpin(c *gin.Context) {
	var req interfaces.SpinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error: "Invalid request parameters",
			Code:  http.StatusBadRequest,
		})
		return
	}

	board := h.gameService.GenerateBoard()
	winResult := h.checker.CheckWin(board)
	boardInt := convertBoardToInt(board)
	totalWinAmount := winResult.Payout * req.BetAmount

	winningLines := make([]types.WinningLineInfo, 0)
	for _, line := range winResult.Lines {
		winningLines = append(winningLines, types.WinningLineInfo{
			Type:     line.Type,
			Position: line.Position,
			Symbols:  convertSymbolsToInt(line.Symbol, 3), // 3 symbols per line
			Payout:   line.Payout * req.BetAmount,
		})
	}

	response := interfaces.SpinResponse{
		Success:      true,
		Board:        boardInt,
		WinAmount:    totalWinAmount,
		TotalLines:   len(winResult.Lines),
		WinningLines: winningLines,
	}

	c.JSON(http.StatusOK, response)
}

func convertBoardToInt(board models.Board) [][]int {
	result := make([][]int, 3)
	for i := range result {
		result[i] = make([]int, 3)
		for j := range result[i] {
			result[i][j] = int(board[i][j])
		}
	}
	return result
}

func convertSymbolsToInt(symbol domain.Symbol, count int) []int {
	result := make([]int, count)
	for i := range result {
		result[i] = int(symbol)
	}
	return result
}
