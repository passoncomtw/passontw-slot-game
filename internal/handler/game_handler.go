package handler

import (
	"net/http"
	"passontw-slot-game/internal/service"

	"github.com/gin-gonic/gin"
)

// Response models for swagger documentation
type GameResponse struct {
	Success bool           `json:"success" example:"true"`
	Data    *BoardResponse `json:"data,omitempty"`
	Error   string         `json:"error,omitempty" example:""`
}

// BoardResponse represents the game board
type BoardResponse struct {
	// Board represents the 3x3 game board matrix
	// Example: [[3,1,2],[2,2,3],[7,5,5]]
	Board [][]int `json:"board" extensions:"x-nullable=true" swaggertype:"array,array,integer"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error" example:"Invalid request"`
	Code  int    `json:"code" example:"400"`
}
type GameHandler struct {
	gameService service.GameService
}

func NewGameHandler(gameService service.GameService) *GameHandler {
	return &GameHandler{
		gameService: gameService,
	}
}

// Game godoc
// @Summary      Get Game Spin
// @Description  Get Game Spin
// @Tags         game
// @Accept       json
// @Produce      json
// @Success 200 {object} BoardResponse
// @Router       /game/spin [get]
func (h *GameHandler) GetGameSpin(c *gin.Context) {
	board := h.gameService.GenerateBoard()
	c.JSON(http.StatusOK, gin.H{
		"board": board,
	})
}
