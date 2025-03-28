package interfaces

import (
	"context"

	"game-api/internal/domain/models"
)

type UserService interface {
	// 用戶註冊
	Register(ctx context.Context, req *models.RegisterRequest) (*models.User, error)

	// 用戶登入
	Login(ctx context.Context, req *models.LoginRequest) (string, error)

	// 獲取用戶資料
	GetProfile(ctx context.Context, userID string) (*models.UserProfileResponse, error)

	// 更新用戶資料
	UpdateProfile(ctx context.Context, userID string, req *models.UpdateProfileRequest) error

	// 更新用戶設定
	UpdateSettings(ctx context.Context, userID string, req *models.UpdateSettingsRequest) error
}

type BetService interface {
	// 獲取投注歷史
	GetBetHistory(ctx context.Context, userID string, req *models.BetHistoryRequest) (*models.BetHistoryResponse, error)

	// 獲取投注詳情
	GetBetDetail(ctx context.Context, sessionID string) ([]*models.GameRound, error)
}
