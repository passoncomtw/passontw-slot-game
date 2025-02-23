package service

import (
	"errors"
	"fmt"
	"passontw-slot-game/internal/domain/entity"
	"time"

	"gorm.io/gorm"
)

type BalanceService interface {
	GetUserBalance(userID int) (float64, error)
	AddBalance(tx *gorm.DB, userID int, amount float64, description string) (*entity.BalanceRecord, error)
	DeductBalance(tx *gorm.DB, userID int, amount float64, description string) (*entity.BalanceRecord, error)
	GetBalanceRecords(userID int, page, pageSize int) ([]entity.BalanceRecord, int64, error)
}

type balanceService struct {
	db *gorm.DB
}

func NewBalanceService(db *gorm.DB) BalanceService {
	return &balanceService{
		db: db,
	}
}

// GetUserBalance 獲取用戶當前餘額
func (s *balanceService) GetUserBalance(userID int) (float64, error) {
	var user entity.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, fmt.Errorf("user not found")
		}
		return 0, err
	}
	return user.AvailableBalance, nil
}

// AddBalance 增加餘額
func (s *balanceService) AddBalance(tx *gorm.DB, userID int, amount float64, description string) (*entity.BalanceRecord, error) {
	if amount <= 0 {
		return nil, fmt.Errorf("amount must be positive")
	}

	var user entity.User
	if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, err
	}

	// 創建餘額記錄
	record := &entity.BalanceRecord{
		UserID:        userID,
		Type:          "ADD",
		Amount:        amount,
		BeforeBalance: user.AvailableBalance,
		AfterBalance:  user.AvailableBalance + amount,
		BeforeFrozen:  user.FrozenBalance,
		AfterFrozen:   user.FrozenBalance,
		Description:   description,
		Operator:      "SYSTEM",
		ReferenceID:   fmt.Sprintf("ADD_%d_%s", userID, time.Now().Format("20060102150405")),
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// 更新用戶餘額
	if err := tx.Model(&user).Update("available_balance", user.AvailableBalance+amount).Error; err != nil {
		return nil, err
	}

	// 保存餘額記錄
	if err := tx.Create(record).Error; err != nil {
		return nil, err
	}

	return record, nil
}

// DeductBalance 扣除餘額
func (s *balanceService) DeductBalance(tx *gorm.DB, userID int, amount float64, description string) (*entity.BalanceRecord, error) {
	if amount <= 0 {
		return nil, fmt.Errorf("amount must be positive")
	}

	var user entity.User
	if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, err
	}

	// 檢查餘額
	if user.AvailableBalance < amount {
		return nil, fmt.Errorf("insufficient balance")
	}

	// 創建餘額記錄
	record := &entity.BalanceRecord{
		UserID:        userID,
		Type:          "DEDUCT",
		Amount:        amount,
		BeforeBalance: user.AvailableBalance,
		AfterBalance:  user.AvailableBalance - amount,
		BeforeFrozen:  user.FrozenBalance,
		AfterFrozen:   user.FrozenBalance,
		Description:   description,
		Operator:      "SYSTEM",
		ReferenceID:   fmt.Sprintf("DEDUCT_%d_%s", userID, time.Now().Format("20060102150405")),
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// 更新用戶餘額
	if err := tx.Model(&user).Update("available_balance", user.AvailableBalance-amount).Error; err != nil {
		return nil, err
	}

	// 保存餘額記錄
	if err := tx.Create(record).Error; err != nil {
		return nil, err
	}

	return record, nil
}

// GetBalanceRecords 獲取餘額變動記錄
func (s *balanceService) GetBalanceRecords(userID int, page, pageSize int) ([]entity.BalanceRecord, int64, error) {
	var records []entity.BalanceRecord
	var total int64

	// 計算總數
	if err := s.db.Model(&entity.BalanceRecord{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 計算偏移量
	offset := (page - 1) * pageSize

	// 查詢記錄
	if err := s.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}

	return records, total, nil
}

// ValidateBalance 驗證餘額操作
func (s *balanceService) ValidateBalance(userID int, amount float64) error {
	var user entity.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return err
	}

	if user.AvailableBalance < amount {
		return fmt.Errorf("insufficient balance: available %.2f, required %.2f",
			user.AvailableBalance, amount)
	}

	return nil
}

// 交易相關的常量
const (
	TransactionTypeAdd    = "ADD"
	TransactionTypeDeduct = "DEDUCT"
	TransactionTypeFreeze = "FREEZE"
	OperatorSystem        = "SYSTEM"
)

// GenerateReferenceID 生成參考ID
func GenerateReferenceID(transType string, userID int) string {
	return fmt.Sprintf("%s_%d_%s",
		transType,
		userID,
		time.Now().Format("20060102150405"))
}
