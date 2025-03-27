package entity

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

// UserWallet 用戶錢包模型
type UserWallet struct {
	ID            string    `gorm:"primaryKey;column:wallet_id;type:uuid" json:"wallet_id"`
	UserID        string    `gorm:"column:user_id;type:uuid;not null;uniqueIndex" json:"user_id"`
	Balance       float64   `gorm:"column:balance;type:decimal(15,2);not null;default:0.00" json:"balance"`
	TotalDeposit  float64   `gorm:"column:total_deposit;type:decimal(15,2);not null;default:0.00" json:"total_deposit"`
	TotalWithdraw float64   `gorm:"column:total_withdraw;type:decimal(15,2);not null;default:0.00" json:"total_withdraw"`
	TotalBet      float64   `gorm:"column:total_bet;type:decimal(15,2);not null;default:0.00" json:"total_bet"`
	TotalWin      float64   `gorm:"column:total_win;type:decimal(15,2);not null;default:0.00" json:"total_win"`
	CreatedAt     time.Time `gorm:"column:created_at;not null;default:now()" json:"created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at;not null;default:now()" json:"updated_at"`
}

// TableName 指定資料表名稱
func (UserWallet) TableName() string {
	return "user_wallets"
}

// BeforeCreate 在創建前執行
func (w *UserWallet) BeforeCreate(tx *gorm.DB) error {
	if w.Balance < 0 {
		return errors.New("餘額不能為負數")
	}

	now := time.Now()
	w.CreatedAt = now
	w.UpdatedAt = now
	return nil
}

// BeforeUpdate 在更新前執行
func (w *UserWallet) BeforeUpdate(tx *gorm.DB) error {
	if w.Balance < 0 {
		return errors.New("餘額不能為負數")
	}

	w.UpdatedAt = time.Now()
	return nil
}

// AddBalance 增加錢包餘額
func (w *UserWallet) AddBalance(tx *gorm.DB, amount float64) error {
	if amount <= 0 {
		return errors.New("儲值金額必須大於零")
	}

	w.Balance += amount
	w.TotalDeposit += amount

	return tx.Save(w).Error
}

// DeductBalance 減少錢包餘額
func (w *UserWallet) DeductBalance(tx *gorm.DB, amount float64, isBet bool) error {
	if amount <= 0 {
		return errors.New("金額必須大於零")
	}

	if w.Balance < amount {
		return errors.New("餘額不足")
	}

	w.Balance -= amount

	if isBet {
		w.TotalBet += amount
	}

	return tx.Save(w).Error
}

// AddWinAmount 增加贏得金額
func (w *UserWallet) AddWinAmount(tx *gorm.DB, amount float64) error {
	if amount <= 0 {
		return errors.New("贏得金額必須大於零")
	}

	w.Balance += amount
	w.TotalWin += amount

	return tx.Save(w).Error
}
