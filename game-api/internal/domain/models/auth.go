package models

// LoginRequest App用戶登入請求
type AppLoginRequest struct {
	Username string `json:"username,omitempty" example:"user123"`
	Email    string `json:"email,omitempty" example:"user@example.com"`
	Password string `json:"password" binding:"required" example:"password123"`
}

// LoginResponse 登入響應
type LoginResponse struct {
	Token     string `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	TokenType string `json:"token_type" example:"Bearer"`
	ExpiresIn int64  `json:"expires_in" example:"3600"`
}

// UserProfileResponse 用戶資料響應
type UserProfileResponse struct {
	ID        string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Username  string  `json:"username" example:"user123"`
	Email     string  `json:"email" example:"user@example.com"`
	Balance   float64 `json:"balance" example:"1000.00"`
	Role      string  `json:"role" example:"USER"`
	Status    string  `json:"status" example:"ACTIVE"`
	CreatedAt string  `json:"created_at" example:"2023-01-01T00:00:00Z"`
	UpdatedAt string  `json:"updated_at" example:"2023-01-02T00:00:00Z"`
}

// ErrorResponse 錯誤響應
type ErrorResponse struct {
	Error string `json:"error" example:"無效的憑證"`
}

// TokenData JWT令牌資料
type TokenData struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

// TokenResponse 代表認證 token 的回應
type TokenResponse struct {
	Token string `json:"token"`
}
