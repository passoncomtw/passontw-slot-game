package interfaces

import (
	"passontw-slot-game/internal/interfaces/types"
)

type SpinRequest struct {
	BetAmount float64 `json:"betAmount" binding:"required,gt=0" example:"1.0"`
}

type SpinResponse struct {
	Success      bool                    `json:"success" example:"true"`
	Board        [][]int                 `json:"board" swaggertype:"array,array,integer"`
	WinAmount    float64                 `json:"winAmount" example:"10.5"`
	TotalLines   int                     `json:"totalLines" example:"2"`
	WinningLines []types.WinningLineInfo `json:"winningLines"`
}

type GameResponse struct {
	Success bool           `json:"success" example:"true"`
	Data    *BoardResponse `json:"data,omitempty"`
	Error   string         `json:"error,omitempty" example:""`
}

type BoardResponse struct {
	Board [][]int `json:"board" extensions:"x-nullable=true" swaggertype:"array,array,integer"`
}
