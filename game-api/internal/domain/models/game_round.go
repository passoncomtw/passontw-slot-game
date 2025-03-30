package models

import (
	"time"

	"github.com/google/uuid"
)

// GameRound 遊戲回合模型，記錄每次的遊戲結果
type GameRound struct {
	RoundID         uuid.UUID `json:"round_id" gorm:"column:round_id;type:uuid;primaryKey"`
	SessionID       uuid.UUID `json:"session_id" gorm:"column:session_id;type:uuid;not null;index"`
	UserID          uuid.UUID `json:"user_id" gorm:"column:user_id;type:uuid;not null;index"`
	GameID          uuid.UUID `json:"game_id" gorm:"column:game_id;type:uuid;not null;index"`
	BetAmount       float64   `json:"bet_amount" gorm:"column:bet_amount;type:decimal(15,2);not null"`
	WinAmount       float64   `json:"win_amount" gorm:"column:win_amount;type:decimal(15,2);not null"`
	Multiplier      float64   `json:"multiplier" gorm:"column:multiplier;type:decimal(10,2);not null"`
	Symbols         string    `json:"symbols" gorm:"column:symbols;type:jsonb;not null"`
	PayLines        string    `json:"paylines" gorm:"column:paylines;type:jsonb"`
	FeaturesTrigger string    `json:"features_triggered" gorm:"column:features_triggered;type:jsonb"`
	BalanceBefore   float64   `json:"balance_before" gorm:"column:balance_before;type:decimal(15,2);not null"`
	BalanceAfter    float64   `json:"balance_after" gorm:"column:balance_after;type:decimal(15,2);not null"`
	TransactionID   string    `json:"transaction_id" gorm:"column:transaction_id;type:uuid"`
	IsWin           bool      `json:"is_win" gorm:"column:is_win;not null"`
	CreatedAt       time.Time `json:"created_at" gorm:"column:created_at;not null;default:now()"`
}

// TableName 指定資料表名稱
func (GameRound) TableName() string {
	return "game_rounds"
}
