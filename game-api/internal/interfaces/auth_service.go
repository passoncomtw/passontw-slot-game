package interfaces

import (
	"context"
	"game-api/internal/domain/models"
)

// AuthService 認證服務接口
type AuthService interface {
	// App用戶登入
	AppLogin(ctx context.Context, req models.AppLoginRequest) (*models.LoginResponse, error)

	// 用戶簡易登入
	Login(username string, password string) (string, error)

	// 用戶註冊
	Register(ctx context.Context, req *models.RegisterRequest) (*models.User, error)

	// 獲取用戶個人資料
	GetUserProfile(ctx context.Context, userID string) (*models.UserProfileResponse, error)

	// 管理員登入
	AdminLogin(ctx context.Context, req models.AdminLoginRequest) (*models.LoginResponse, error)

	// 生成JWT令牌
	GenerateToken(data models.TokenData) (string, int64, error)

	// 驗證JWT令牌
	ValidateToken(token string) (string, error)

	// 驗證管理員JWT令牌
	ValidateAdminToken(token string) (string, error)

	// 解析JWT令牌數據
	ParseToken(token string) (*models.TokenData, error)

	// 解析管理員JWT令牌數據
	ParseAdminToken(token string) (*models.TokenData, error)

	// 撤銷令牌
	RevokeToken(token string) error
}
