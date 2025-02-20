package handler

import (
	"net/http"
	"passontw-slot-game/internal/domain"
	"passontw-slot-game/internal/domain/models"
	"passontw-slot-game/internal/service"

	"github.com/gin-gonic/gin"
)

type SpinRequest struct {
	BetAmount float64 `json:"betAmount" binding:"required,gt=0" example:"1.0"`
}

type SpinResponse struct {
	Success      bool              `json:"success" example:"true"`
	Board        [][]int           `json:"board" swaggertype:"array,array,integer"`
	WinAmount    float64           `json:"winAmount" example:"10.5"`
	TotalLines   int               `json:"totalLines" example:"2"`
	WinningLines []WinningLineInfo `json:"winningLines"`
}

type WinningLineInfo struct {
	Type     string  `json:"type" example:"Horizontal"`
	Position int     `json:"position" example:"1"`
	Symbols  []int   `json:"symbols" swaggertype:"array,integer"`
	Payout   float64 `json:"payout" example:"5.0"`
}

type GameResponse struct {
	Success bool           `json:"success" example:"true"`
	Data    *BoardResponse `json:"data,omitempty"`
	Error   string         `json:"error,omitempty" example:""`
}

type BoardResponse struct {
	Board [][]int `json:"board" extensions:"x-nullable=true" swaggertype:"array,array,integer"`
}

type ErrorResponse struct {
	Error string `json:"error" example:"Invalid request"`
	Code  int    `json:"code" example:"400"`
}
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
// @Param        request body SpinRequest true "Spin request with bet amount"
// @Success      200  {object}  SpinResponse
// @Failure      400  {object}  ErrorResponse
// @Router       /api/v1/game/spin [post]
func (h *GameHandler) GetGameSpin(c *gin.Context) {
	var req SpinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Invalid request parameters",
			Code:  http.StatusBadRequest,
		})
		return
	}

	board := h.gameService.GenerateBoard()
	winResult := h.checker.CheckWin(board)
	boardInt := convertBoardToInt(board)
	totalWinAmount := winResult.Payout * req.BetAmount

	winningLines := make([]WinningLineInfo, 0)
	for _, line := range winResult.Lines {
		winningLines = append(winningLines, WinningLineInfo{
			Type:     line.Type,
			Position: line.Position,
			Symbols:  convertSymbolsToInt(line.Symbol, 3), // 3 symbols per line
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
