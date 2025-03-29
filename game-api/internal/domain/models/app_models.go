package models

import (
	"time"
)

// AppGameListRequest 遊戲列表請求，專用於 app 服務
type AppGameListRequest struct {
	Type      string `form:"type" json:"type,omitempty" example:"slot"` // game_type: slot, card, table, arcade
	Featured  bool   `form:"featured" json:"featured,omitempty"`        // 是否為推薦遊戲
	New       bool   `form:"new" json:"new,omitempty"`                  // 是否為新遊戲
	Page      int    `form:"page" json:"page,omitempty" example:"1"`
	PageSize  int    `form:"page_size" json:"page_size,omitempty" example:"10"`
	SortBy    string `form:"sort_by" json:"sort_by,omitempty" example:"created_at"` // title, rtp, created_at
	SortOrder string `form:"sort_order" json:"sort_order,omitempty" example:"desc"` // asc, desc
}

// GameDetailRequest 遊戲詳情請求
type GameDetailRequest struct {
	GameID string `uri:"game_id" json:"game_id" binding:"required"`
}

// AppGameResponse 應用遊戲響應，區別於 game.go 中的 GameResponse
type AppGameResponse struct {
	GameID          string                 `json:"game_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Title           string                 `json:"title" example:"幸運七"`
	Description     string                 `json:"description" example:"經典老虎機遊戲，有特殊的七倍符號獎勵和免費旋轉功能。"`
	GameType        string                 `json:"game_type" example:"slot"`
	Icon            string                 `json:"icon" example:"diamond"`
	BackgroundColor string                 `json:"background_color" example:"#6200EA"`
	RTP             float64                `json:"rtp" example:"96.5"`
	Volatility      string                 `json:"volatility" example:"medium"`
	MinBet          float64                `json:"min_bet" example:"1.00"`
	MaxBet          float64                `json:"max_bet" example:"500.00"`
	Features        map[string]interface{} `json:"features,omitempty"`
	IsFeatured      bool                   `json:"is_featured" example:"true"`
	IsNew           bool                   `json:"is_new" example:"false"`
	IsActive        bool                   `json:"is_active" example:"true"`
	Rating          float64                `json:"rating,omitempty" example:"4.5"`
	ReleaseDate     time.Time              `json:"release_date"`
}

// AppGameListResponse 應用遊戲列表響應，區別於 game.go 中的 GameListResponse
type AppGameListResponse struct {
	Games      []AppGameResponse `json:"games"`
	Total      int64             `json:"total" example:"100"`
	Page       int               `json:"page" example:"1"`
	PageSize   int               `json:"page_size" example:"10"`
	TotalPages int               `json:"total_pages" example:"10"`
}

// WalletBalanceResponse 錢包餘額響應
type WalletBalanceResponse struct {
	WalletID      string    `json:"wallet_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Balance       float64   `json:"balance" example:"1000.00"`
	TotalDeposit  float64   `json:"total_deposit" example:"5000.00"`
	TotalWithdraw float64   `json:"total_withdraw" example:"2000.00"`
	TotalBet      float64   `json:"total_bet" example:"8000.00"`
	TotalWin      float64   `json:"total_win" example:"6000.00"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// GameSessionRequest 遊戲會話請求
type GameSessionRequest struct {
	GameID    string  `json:"game_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	BetAmount float64 `json:"bet_amount,omitempty" example:"10.00"`
}

// GameSessionResponse 遊戲會話響應
type GameSessionResponse struct {
	SessionID      string          `json:"session_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	GameID         string          `json:"game_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	StartTime      time.Time       `json:"start_time"`
	InitialBalance float64         `json:"initial_balance" example:"1000.00"`
	GameInfo       AppGameResponse `json:"game_info"`
}

// BetRequest 投注請求
type BetRequest struct {
	SessionID  string                 `json:"session_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	BetAmount  float64                `json:"bet_amount" binding:"required" example:"10.00"`
	BetLines   int                    `json:"bet_lines" example:"5"`
	BetOptions map[string]interface{} `json:"bet_options,omitempty"`
}

// BetResponse 投注響應
type BetResponse struct {
	RoundID       string                   `json:"round_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	SessionID     string                   `json:"session_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	BetAmount     float64                  `json:"bet_amount" example:"10.00"`
	WinAmount     float64                  `json:"win_amount" example:"25.00"`
	Multiplier    float64                  `json:"multiplier" example:"2.5"`
	Symbols       [][]string               `json:"symbols"`
	PayLines      []map[string]interface{} `json:"pay_lines,omitempty"`
	Features      map[string]interface{}   `json:"features,omitempty"`
	BalanceBefore float64                  `json:"balance_before" example:"1000.00"`
	BalanceAfter  float64                  `json:"balance_after" example:"1015.00"`
	TransactionID string                   `json:"transaction_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	CreatedAt     time.Time                `json:"created_at"`
}

// EndSessionRequest 結束會話請求
type EndSessionRequest struct {
	SessionID string `json:"session_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
}

// EndSessionResponse 結束會話響應
type EndSessionResponse struct {
	SessionID    string    `json:"session_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	EndTime      time.Time `json:"end_time"`
	Duration     int       `json:"duration" example:"300"` // 以秒為單位
	TotalBets    float64   `json:"total_bets" example:"100.00"`
	TotalWins    float64   `json:"total_wins" example:"95.00"`
	NetGain      float64   `json:"net_gain" example:"-5.00"`
	SpinCount    int       `json:"spin_count" example:"10"`
	WinCount     int       `json:"win_count" example:"4"`
	FinalBalance float64   `json:"final_balance" example:"995.00"`
}

// TransactionHistoryRequest 交易歷史請求
type TransactionHistoryRequest struct {
	Type      string    `form:"type" json:"type,omitempty" example:"deposit"` // deposit, withdraw, bet, win, bonus, refund
	StartDate time.Time `form:"start_date" json:"start_date,omitempty"`
	EndDate   time.Time `form:"end_date" json:"end_date,omitempty"`
	Page      int       `form:"page" json:"page,omitempty" example:"1"`
	PageSize  int       `form:"page_size" json:"page_size,omitempty" example:"10"`
}

// TransactionResponse 交易響應
type TransactionResponse struct {
	TransactionID string    `json:"transaction_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Type          string    `json:"type" example:"deposit"`
	Amount        float64   `json:"amount" example:"100.00"`
	Status        string    `json:"status" example:"completed"`
	Description   string    `json:"description,omitempty" example:"信用卡充值"`
	GameID        string    `json:"game_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	GameTitle     string    `json:"game_title,omitempty" example:"幸運七"`
	BalanceBefore float64   `json:"balance_before" example:"900.00"`
	BalanceAfter  float64   `json:"balance_after" example:"1000.00"`
	CreatedAt     time.Time `json:"created_at"`
}

// TransactionHistoryResponse 交易歷史響應
type TransactionHistoryResponse struct {
	Transactions []TransactionResponse `json:"transactions"`
	Total        int64                 `json:"total" example:"100"`
	Page         int                   `json:"page" example:"1"`
	PageSize     int                   `json:"page_size" example:"10"`
	TotalPages   int                   `json:"total_pages" example:"10"`
}

// AppDepositRequest 存款請求，區別於其他地方的 DepositRequest
type AppDepositRequest struct {
	Amount      float64 `json:"amount" binding:"required" example:"100.00"`
	PaymentType string  `json:"payment_type" binding:"required" example:"credit_card"` // credit_card, bank_transfer, e-wallet
	ReferenceID string  `json:"reference_id,omitempty" example:"PAY123456789"`         // 支付平台交易ID
}

// WithdrawRequest 提款請求
type WithdrawRequest struct {
	Amount      float64 `json:"amount" binding:"required" example:"100.00"`
	BankAccount string  `json:"bank_account,omitempty" example:"1234567890"`
	BankCode    string  `json:"bank_code,omitempty" example:"007"`
	BankName    string  `json:"bank_name,omitempty" example:"第一銀行"`
}

// AppUserProfileResponse 用戶個人資料響應，區別於其他處的 UserProfileResponse
type AppUserProfileResponse struct {
	UserID     string                 `json:"user_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Username   string                 `json:"username" example:"user123"`
	Email      string                 `json:"email" example:"user@example.com"`
	VIPLevel   int                    `json:"vip_level" example:"2"`
	Points     int                    `json:"points" example:"500"`
	AvatarURL  string                 `json:"avatar_url,omitempty" example:"https://example.com/avatars/user123.jpg"`
	IsVerified bool                   `json:"is_verified" example:"true"`
	CreatedAt  time.Time              `json:"created_at"`
	LastLogin  *time.Time             `json:"last_login,omitempty"`
	Wallet     *WalletBalanceResponse `json:"wallet,omitempty"`
}

// AppUpdateProfileRequest 更新個人資料請求，區別於其他處的 UpdateProfileRequest
type AppUpdateProfileRequest struct {
	Username  string `json:"username,omitempty" example:"newuser123"`
	AvatarURL string `json:"avatar_url,omitempty" example:"https://example.com/avatars/newuser123.jpg"`
}

// UserSettingsResponse 用戶設置響應
type UserSettingsResponse struct {
	UserID             string    `json:"user_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Sound              bool      `json:"sound" example:"true"`
	Music              bool      `json:"music" example:"true"`
	Vibration          bool      `json:"vibration" example:"false"`
	HighQuality        bool      `json:"high_quality" example:"true"`
	AIAssistant        bool      `json:"ai_assistant" example:"true"`
	GameRecommendation bool      `json:"game_recommendation" example:"true"`
	DataCollection     bool      `json:"data_collection" example:"true"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// AppUpdateSettingsRequest 更新設置請求，區別於其他處的 UpdateSettingsRequest
type AppUpdateSettingsRequest struct {
	Sound              *bool `json:"sound,omitempty" example:"true"`
	Music              *bool `json:"music,omitempty" example:"true"`
	Vibration          *bool `json:"vibration,omitempty" example:"false"`
	HighQuality        *bool `json:"high_quality,omitempty" example:"true"`
	AIAssistant        *bool `json:"ai_assistant,omitempty" example:"true"`
	GameRecommendation *bool `json:"game_recommendation,omitempty" example:"true"`
	DataCollection     *bool `json:"data_collection,omitempty" example:"true"`
}
