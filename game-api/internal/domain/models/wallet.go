package models

import "time"

// DepositRequest 存款請求
type DepositRequest struct {
	Amount          float64 `json:"amount" binding:"required,gt=0" example:"100.00"`         // 存款金額
	PaymentMethod   string  `json:"payment_method" binding:"required" example:"credit_card"` // 支付方式
	TransactionCode string  `json:"transaction_code,omitempty" example:"TXN123456"`          // 交易代碼 (可選)
}

// WalletWithdrawRequest 提現請求 (避免與 app_models.go 中的 WithdrawRequest 衝突)
type WalletWithdrawRequest struct {
	Amount      float64 `json:"amount" binding:"required,gt=0" example:"50.00"`       // 提現金額
	BankAccount string  `json:"bank_account" binding:"required" example:"1234567890"` // 銀行帳號
	BankCode    string  `json:"bank_code" binding:"required" example:"012"`           // 銀行代碼
	AccountName string  `json:"account_name" binding:"required" example:"王小明"`        // 帳戶名稱
}

// WalletTransactionResponse 交易響應 (避免與 app_models.go 中的 TransactionResponse 衝突)
type WalletTransactionResponse struct {
	TransactionID   string    `json:"transaction_id" example:"550e8400-e29b-41d4-a716-446655440000"` // 交易ID
	UserID          string    `json:"user_id" example:"550e8400-e29b-41d4-a716-446655440001"`        // 用戶ID
	Type            string    `json:"type" example:"deposit"`                                        // 交易類型 (deposit, withdraw, bet, win)
	Amount          float64   `json:"amount" example:"100.00"`                                       // 交易金額
	BalanceBefore   float64   `json:"balance_before" example:"900.00"`                               // 交易前餘額
	BalanceAfter    float64   `json:"balance_after" example:"1000.00"`                               // 交易後餘額
	Status          string    `json:"status" example:"success"`                                      // 交易狀態 (pending, success, failed)
	PaymentMethod   string    `json:"payment_method,omitempty" example:"credit_card"`                // 支付方式 (僅當交易類型為 deposit 或 withdraw 時存在)
	BankAccount     string    `json:"bank_account,omitempty" example:"1234567890"`                   // 銀行帳號 (僅當交易類型為 withdraw 時存在)
	TransactionCode string    `json:"transaction_code,omitempty" example:"TXN123456"`                // 交易代碼
	CreatedAt       time.Time `json:"created_at"`                                                    // 創建時間
	UpdatedAt       time.Time `json:"updated_at"`                                                    // 更新時間
}

// TransactionListResponse 交易列表響應
type TransactionListResponse struct {
	Transactions []WalletTransactionResponse `json:"transactions"`             // 交易列表
	Total        int64                       `json:"total" example:"100"`      // 總交易數
	Page         int                         `json:"page" example:"1"`         // 當前頁碼
	PageSize     int                         `json:"page_size" example:"10"`   // 每頁大小
	TotalPages   int                         `json:"total_pages" example:"10"` // 總頁數
}
