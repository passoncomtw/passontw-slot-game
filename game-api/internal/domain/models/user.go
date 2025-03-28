package models

import (
	"time"

	"github.com/google/uuid"
)

// 分頁請求
type PaginationRequest struct {
	Page     int `form:"page" binding:"min=1" example:"1"`
	PageSize int `form:"page_size" binding:"min=1,max=100" example:"10"`
}

// 分頁響應
type PaginationResponse struct {
	Total       int64 `json:"total" example:"100"`
	TotalPages  int   `json:"total_pages" example:"10"`
	CurrentPage int   `json:"current_page" example:"1"`
	PageSize    int   `json:"page_size" example:"10"`
}

// 創建用戶請求
type CreateUserRequest struct {
	Username string   `json:"username" binding:"required,min=3,max=50" example:"newuser123"`
	Email    string   `json:"email" binding:"required,email" example:"user@example.com"`
	Password string   `json:"password" binding:"required,min=6" example:"password123"`
	Role     *string  `json:"role" example:"user"`
	Balance  *float64 `json:"initial_balance" example:"1000.00"`
}

// 用戶儲值請求
type DepositRequest struct {
	UserID        string  `json:"user_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	Amount        float64 `json:"amount" binding:"required,gt=0" example:"500.00"`
	PaymentMethod string  `json:"payment_method" example:"信用卡"`
	Description   *string `json:"description" example:"VIP用戶充值優惠"`
}

// 用戶狀態變更請求
type ChangeUserStatusRequest struct {
	UserID string `json:"user_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	Active bool   `json:"active" example:"true"`
}

// 用戶列表過濾請求
type UserListFilterRequest struct {
	PaginationRequest
	Status     *string `form:"status" example:"active"` // active, inactive, pending
	Role       *string `form:"role" example:"vip"`
	SearchTerm *string `form:"search" example:"user"`
}

// 用戶列表響應
type UserListResponse struct {
	PaginationResponse
	Users []UserResponse `json:"users"`
}

// 用戶響應
type UserResponse struct {
	ID          string     `json:"user_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Username    string     `json:"username" example:"johndoe"`
	Email       string     `json:"email" example:"john@example.com"`
	Role        string     `json:"role" example:"user"`
	VIPLevel    int        `json:"vip_level" example:"0"`
	Points      int        `json:"points" example:"100"`
	Balance     float64    `json:"balance" example:"1500.50"`
	AvatarURL   *string    `json:"avatar_url,omitempty" example:"https://example.com/avatar.jpg"`
	IsVerified  bool       `json:"is_verified" example:"true"`
	IsActive    bool       `json:"is_active" example:"true"`
	CreatedAt   time.Time  `json:"created_at" example:"2023-01-01T12:00:00Z"`
	LastLoginAt *time.Time `json:"last_login_at,omitempty" example:"2023-01-02T15:30:00Z"`
}

// 操作響應
type OperationResponse struct {
	Success bool   `json:"success" example:"true"`
	Message string `json:"message" example:"操作成功"`
}

type User struct {
	UserID         uuid.UUID `json:"user_id"`
	Username       string    `json:"username"`
	Email          string    `json:"email"`
	PasswordHash   string    `json:"-"`
	AuthProvider   string    `json:"auth_provider"`
	AuthProviderID string    `json:"auth_provider_id"`
	Role           string    `json:"role"`
	VipLevel       int       `json:"vip_level"`
	Points         int       `json:"points"`
	AvatarURL      string    `json:"avatar_url"`
	IsVerified     bool      `json:"is_verified"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	LastLoginAt    time.Time `json:"last_login_at"`
}

type UserSettings struct {
	UserID             uuid.UUID `json:"user_id"`
	Sound              bool      `json:"sound"`
	Music              bool      `json:"music"`
	Vibration          bool      `json:"vibration"`
	HighQuality        bool      `json:"high_quality"`
	AIAssistant        bool      `json:"ai_assistant"`
	GameRecommendation bool      `json:"game_recommendation"`
	DataCollection     bool      `json:"data_collection"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type UserWallet struct {
	WalletID      uuid.UUID `json:"wallet_id"`
	UserID        uuid.UUID `json:"user_id"`
	Balance       float64   `json:"balance"`
	TotalDeposit  float64   `json:"total_deposit"`
	TotalWithdraw float64   `json:"total_withdraw"`
	TotalBet      float64   `json:"total_bet"`
	TotalWin      float64   `json:"total_win"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// API 請求/響應結構
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type UserProfileResponse struct {
	User     User         `json:"user"`
	Settings UserSettings `json:"settings"`
	Wallet   UserWallet   `json:"wallet"`
}

type UpdateProfileRequest struct {
	Username  string `json:"username" binding:"omitempty,min=3,max=50"`
	AvatarURL string `json:"avatar_url" binding:"omitempty,url"`
}

type UpdateSettingsRequest struct {
	Sound              *bool `json:"sound"`
	Music              *bool `json:"music"`
	Vibration          *bool `json:"vibration"`
	HighQuality        *bool `json:"high_quality"`
	AIAssistant        *bool `json:"ai_assistant"`
	GameRecommendation *bool `json:"game_recommendation"`
	DataCollection     *bool `json:"data_collection"`
}
