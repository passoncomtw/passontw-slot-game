package entity

import (
	"time"

	"gorm.io/gorm"
)

// TransactionType 交易類型
type TransactionType string

const (
	TransactionDeposit  TransactionType = "deposit"
	TransactionWithdraw TransactionType = "withdraw"
	TransactionBet      TransactionType = "bet"
	TransactionWin      TransactionType = "win"
	TransactionBonus    TransactionType = "bonus"
	TransactionRefund   TransactionType = "refund"
)

// TransactionStatus 交易狀態
type TransactionStatus string

const (
	StatusPending   TransactionStatus = "pending"
	StatusCompleted TransactionStatus = "completed"
	StatusFailed    TransactionStatus = "failed"
	StatusCancelled TransactionStatus = "cancelled"
)

// Transaction 交易實體
type Transaction struct {
	ID            string            `gorm:"primaryKey;column:transaction_id;type:uuid" json:"transaction_id"`
	UserID        string            `gorm:"column:user_id;type:uuid;not null" json:"user_id"`
	WalletID      string            `gorm:"column:wallet_id;type:uuid;not null" json:"wallet_id"`
	Amount        float64           `gorm:"column:amount;type:decimal(15,2);not null" json:"amount"`
	Type          TransactionType   `gorm:"column:type;type:transaction_type;not null" json:"type"`
	Status        TransactionStatus `gorm:"column:status;type:varchar(20);not null;default:'completed'" json:"status"`
	GameID        *string           `gorm:"column:game_id;type:uuid" json:"game_id,omitempty"`
	SessionID     *string           `gorm:"column:session_id;type:uuid" json:"session_id,omitempty"`
	RoundID       *string           `gorm:"column:round_id;type:uuid" json:"round_id,omitempty"`
	ReferenceID   *string           `gorm:"column:reference_id;type:varchar(255)" json:"reference_id,omitempty"`
	Description   *string           `gorm:"column:description;type:text" json:"description,omitempty"`
	BalanceBefore float64           `gorm:"column:balance_before;type:decimal(15,2);not null" json:"balance_before"`
	BalanceAfter  float64           `gorm:"column:balance_after;type:decimal(15,2);not null" json:"balance_after"`
	CreatedAt     time.Time         `gorm:"column:created_at;not null;default:now()" json:"created_at"`
	UpdatedAt     time.Time         `gorm:"column:updated_at;not null;default:now()" json:"updated_at"`
}

// TableName 指定資料表名稱
func (Transaction) TableName() string {
	return "transactions"
}

// BeforeCreate 在創建前執行
func (t *Transaction) BeforeCreate(tx *gorm.DB) error {
	now := time.Now()
	t.CreatedAt = now
	t.UpdatedAt = now
	return nil
}

// BeforeUpdate 在更新前執行
func (t *Transaction) BeforeUpdate(tx *gorm.DB) error {
	t.UpdatedAt = time.Now()
	return nil
}
