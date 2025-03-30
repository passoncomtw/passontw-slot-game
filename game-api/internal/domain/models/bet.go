package models

import (
	"time"

	"github.com/google/uuid"
)

type GameSession struct {
	SessionID      uuid.UUID `json:"session_id"`
	UserID         uuid.UUID `json:"user_id"`
	GameID         uuid.UUID `json:"game_id"`
	StartTime      time.Time `json:"start_time"`
	EndTime        time.Time `json:"end_time"`
	InitialBalance float64   `json:"initial_balance"`
	FinalBalance   float64   `json:"final_balance"`
	TotalBets      float64   `json:"total_bets"`
	TotalWins      float64   `json:"total_wins"`
	SpinCount      int       `json:"spin_count"`
	WinCount       int       `json:"win_count"`
	DeviceInfo     string    `json:"device_info"`
	IPAddress      string    `json:"ip_address"`
}

type BetHistoryResponse struct {
	TotalCount int64         `json:"total_count"`
	Items      []GameSession `json:"items"`
}

type BetHistoryRequest struct {
	Page      int       `form:"page" binding:"required,min=1"`
	PageSize  int       `form:"page_size" binding:"required,min=1,max=100"`
	StartDate time.Time `form:"start_date" time_format:"2006-01-02"`
	EndDate   time.Time `form:"end_date" time_format:"2006-01-02"`
	GameID    uuid.UUID `form:"game_id"`
}
