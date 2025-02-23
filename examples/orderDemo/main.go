package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// 訂單類型與狀態的定義
type OrderType string
type OrderStatus string

const (
	OrderTypeSlotGame OrderType = "SLOT_GAME"
	OrderTypeDeposit  OrderType = "DEPOSIT"
	OrderTypeWithdraw OrderType = "WITHDRAW"
	OrderTypeBonus    OrderType = "BONUS"

	OrderStatusPending   OrderStatus = "PENDING"
	OrderStatusCompleted OrderStatus = "COMPLETED"
	OrderStatusCancelled OrderStatus = "CANCELLED"
	OrderStatusFailed    OrderStatus = "FAILED"
)

// 訂單結構
type Order struct {
	ID               int64           `gorm:"primaryKey;column:id" json:"id"`
	OrderID          string          `gorm:"column:order_id;uniqueIndex" json:"order_id"`
	UserID           int             `gorm:"column:user_id;not null" json:"user_id"`
	Type             OrderType       `gorm:"column:type;not null" json:"type"`
	Status           OrderStatus     `gorm:"column:status;not null" json:"status"`
	BetAmount        float64         `gorm:"column:bet_amount;not null" json:"bet_amount"`
	WinAmount        float64         `gorm:"column:win_amount;not null" json:"win_amount"`
	GameResult       json.RawMessage `gorm:"column:game_result;type:jsonb;not null" json:"game_result"`
	BalanceRecordIDs pq.Int64Array   `gorm:"column:balance_record_ids;type:integer[]" json:"balance_record_ids,omitempty"`
	CreatedAt        time.Time       `gorm:"column:created_at;not null" json:"created_at"`
	UpdatedAt        time.Time       `gorm:"column:updated_at;not null" json:"updated_at"`
	CompletedAt      *time.Time      `gorm:"column:completed_at" json:"completed_at,omitempty"`
	Remark           json.RawMessage `gorm:"column:remark;type:jsonb" json:"remark,omitempty"`
}

func main() {
	// 設置 PostgreSQL 連接參數
	dsn := "host=172.237.27.51 user=postgres password=1qaz@WSX3edc dbname=games port=15432 sslmode=disable" // 請根據實際情況設置

	// 連接資料庫
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	// 自動建立資料表 (若未存在)
	// err = db.AutoMigrate(&Order{})
	// if err != nil {
	// 	log.Fatalf("failed to migrate database: %v", err)
	// }

	// 創建一個新的訂單
	gameResult := json.RawMessage(`{"result": "win", "details": {}}`)
	balanceRecordIDs := []int64{1, 2, 3} // 假設的餘額記錄ID

	order := Order{
		OrderID:          "SLOT202502230001",
		UserID:           3,
		Type:             OrderTypeSlotGame,
		Status:           OrderStatusPending,
		BetAmount:        100.00,
		WinAmount:        50.00,
		GameResult:       gameResult,
		BalanceRecordIDs: pq.Int64Array(balanceRecordIDs), // 將 []int64 轉為 pq.Int64Array
	}

	// 寫入訂單
	err = db.Create(&order).Error
	if err != nil {
		log.Fatalf("failed to create order: %v", err)
	}

	// 成功輸出
	fmt.Printf("Order created successfully: %+v\n", order)
}
