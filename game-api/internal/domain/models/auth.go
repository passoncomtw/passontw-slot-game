package models

// LoginRequest App用戶登入請求
type AppLoginRequest struct {
	Username string `json:"username" binding:"required" example:"user123"`
	Password string `json:"password" binding:"required" example:"password123"`
}

// AdminLoginRequest 管理員登入請求
type AdminLoginRequest struct {
	Email    string `json:"email" binding:"required,email" example:"admin@example.com"`
	Password string `json:"password" binding:"required" example:"admin123"`
}

// LoginResponse 登入響應
type LoginResponse struct {
	Token     string `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	TokenType string `json:"token_type" example:"Bearer"`
	ExpiresIn int64  `json:"expires_in" example:"3600"`
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
