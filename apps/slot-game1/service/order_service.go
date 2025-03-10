package service

import (
	"encoding/json"
	"fmt"
	"passontw-slot-game/apps/slot-game1/domain/entity"
	"passontw-slot-game/pkg/utils"
	"strconv"
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

type OrderService interface {
	CreateOrderWithBalance(params CreateOrderParams) (*entity.Order, []entity.BalanceRecord, error)
	GetOrder(orderID string) (*entity.Order, error)
}

type orderService struct {
	db             *gorm.DB
	balanceService BalanceService
}

type CreateOrderParams struct {
	UserID     int              `json:"user_id"`
	Type       entity.OrderType `json:"type"`
	BetAmount  float64          `json:"bet_amount"`
	WinAmount  float64          `json:"win_amount"`
	GameResult json.RawMessage  `json:"game_result"`
}

func NewOrderService(db *gorm.DB, balanceService BalanceService) OrderService {
	return &orderService{
		db:             db,
		balanceService: balanceService,
	}
}

func (s *orderService) CreateOrderWithBalance(params CreateOrderParams) (*entity.Order, []entity.BalanceRecord, error) {
	var order *entity.Order
	var balanceRecords []entity.BalanceRecord

	err := s.db.Transaction(func(tx *gorm.DB) error {
		deductRecord, err := s.balanceService.DeductBalance(tx, params.UserID, params.BetAmount, "Slot game bet")
		if err != nil {
			return fmt.Errorf("failed to deduct bet amount: %v", err)
		}
		balanceRecords = append(balanceRecords, *deductRecord)
		fmt.Printf("len(balanceRecords): %v", len(balanceRecords))
		recordIDs := make([]int64, len(balanceRecords))
		for i, record := range balanceRecords {
			recordIDs[i] = int64(record.ID)
		}
		snowflakeID, getNextIDErr := utils.GetNextID()
		if getNextIDErr != nil {
			return fmt.Errorf("failed to get snowflakeID: %v", getNextIDErr)
		}

		order = &entity.Order{
			OrderID:          strconv.FormatInt(snowflakeID, 10),
			Type:             params.Type,
			UserID:           params.UserID,
			Status:           entity.OrderStatusPending,
			BetAmount:        params.BetAmount,
			WinAmount:        params.WinAmount,
			GameResult:       params.GameResult,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
			BalanceRecordIDs: pq.Int64Array(recordIDs),
		}

		fmt.Printf("order: %v", order)

		if err := tx.Create(order).Error; err != nil {
			return fmt.Errorf("failed to create order: %v", err)
		}

		if params.WinAmount > 0 {
			winRecord, err := s.balanceService.AddBalance(tx, params.UserID, params.WinAmount, "Slot game win")
			if err != nil {
				return fmt.Errorf("failed to add win amount: %v", err)
			}
			balanceRecords = append(balanceRecords, *winRecord)
		}

		now := time.Now()
		order.Status = entity.OrderStatusCompleted
		order.CompletedAt = &now

		if err := tx.Save(order).Error; err != nil {
			return fmt.Errorf("failed to update order: %v", err)
		}

		return nil
	})

	if err != nil {
		return nil, nil, err
	}

	return order, balanceRecords, nil
}

func (s *orderService) GetOrder(orderID string) (*entity.Order, error) {
	var order entity.Order
	err := s.db.Where("order_id = ?", orderID).First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}
