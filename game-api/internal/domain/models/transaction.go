package models

import "time"

// AdminTransactionListRequest 交易列表請求參數
type AdminTransactionListRequest struct {
	Page          int       `form:"page" json:"page" binding:"min=1" example:"1"`
	PageSize      int       `form:"page_size" json:"page_size" binding:"min=1,max=100" example:"10"`
	Search        string    `form:"search" json:"search" example:"T2024061500001"` // 交易ID或用戶名模糊搜尋
	Type          string    `form:"type" json:"type" example:"deposit"`            // deposit, withdraw, bet, win, bonus, refund
	Status        string    `form:"status" json:"status" example:"completed"`      // pending, completed, failed, cancelled
	StartDate     time.Time `form:"start_date" json:"start_date" time_format:"2006-01-02"`
	EndDate       time.Time `form:"end_date" json:"end_date" time_format:"2006-01-02"`
	SortBy        string    `form:"sort_by" json:"sort_by" example:"created_at"`
	SortOrder     string    `form:"sort_order" json:"sort_order" example:"desc"` // asc, desc
	ExportToExcel bool      `form:"export" json:"export" example:"false"`
}

// AdminTransactionListResponse 交易列表回應
type AdminTransactionListResponse struct {
	CurrentPage  int                       `json:"current_page" example:"1"`
	PageSize     int                       `json:"page_size" example:"10"`
	TotalPages   int                       `json:"total_pages" example:"10"`
	Total        int64                     `json:"total" example:"100"`
	Transactions []AdminTransactionSummary `json:"transactions"`
}

// AdminTransactionSummary 交易摘要信息
type AdminTransactionSummary struct {
	ID            string    `json:"transaction_id" example:"T2024061500001"`
	UserID        string    `json:"user_id" example:"u-123456"`
	Username      string    `json:"username" example:"王小明"`
	Type          string    `json:"type" example:"deposit"` // deposit, withdraw, bet, win, bonus, refund
	Amount        float64   `json:"amount" example:"200.00"`
	Status        string    `json:"status" example:"completed"` // pending, completed, failed, cancelled
	GameName      string    `json:"game_name,omitempty" example:"幸運七"`
	ReferenceID   string    `json:"reference_id,omitempty" example:"P123456789"`
	Description   string    `json:"description,omitempty" example:"信用卡儲值"`
	BalanceBefore float64   `json:"balance_before" example:"500.00"`
	BalanceAfter  float64   `json:"balance_after" example:"700.00"`
	CreatedAt     time.Time `json:"created_at" example:"2024-06-15T10:25:18Z"`
}

// AdminTransactionStatsResponse 交易統計回應
type AdminTransactionStatsResponse struct {
	TotalDeposit       float64 `json:"total_deposit" example:"13520.00"`
	TotalWithdraw      float64 `json:"total_withdraw" example:"5230.00"`
	TotalBet           float64 `json:"total_bet" example:"8750.00"`
	TotalWin           float64 `json:"total_win" example:"7100.00"`
	NetIncome          float64 `json:"net_income" example:"6370.00"`           // 淨收入 = 總存款 - 總提款
	GrossGamingRevenue float64 `json:"gross_gaming_revenue" example:"1650.00"` // 博彩毛利 = 總下注 - 總獲勝
	DepositCount       int     `json:"deposit_count" example:"45"`
	WithdrawCount      int     `json:"withdraw_count" example:"20"`
	BetCount           int     `json:"bet_count" example:"320"`
	WinCount           int     `json:"win_count" example:"150"`
	TransactionCount   int     `json:"transaction_count" example:"535"`
	StartDate          string  `json:"start_date" example:"2024-06-15"`
	EndDate            string  `json:"end_date" example:"2024-06-15"`
}

// TransactionExportRequest 交易匯出請求
type TransactionExportRequest struct {
	StartDate time.Time `form:"start_date" json:"start_date" time_format:"2006-01-02"`
	EndDate   time.Time `form:"end_date" json:"end_date" time_format:"2006-01-02"`
	Type      string    `form:"type" json:"type" example:"all"` // all, deposit, withdraw, bet, win
}
