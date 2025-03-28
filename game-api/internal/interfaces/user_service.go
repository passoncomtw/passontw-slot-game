package interfaces

import (
	"context"
	"game-api/internal/domain/models"
)

type BetService interface {
	// 獲取投注歷史
	GetBetHistory(ctx context.Context, userID string, req *models.BetHistoryRequest) (*models.BetHistoryResponse, error)

	// 獲取投注詳情
	GetBetDetail(ctx context.Context, sessionID string) ([]*models.GameRound, error)
}

// UserService 用戶服務接口
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
	// 獲取用戶列表
	GetUsers(ctx context.Context, filter models.UserListFilterRequest) (*models.UserListResponse, error)

	// 獲取用戶詳情
	GetUserByID(ctx context.Context, userID string) (*models.UserResponse, error)

	// 創建用戶
	CreateUser(ctx context.Context, req models.CreateUserRequest) (*models.UserResponse, error)

	// 用戶儲值
	DepositToUser(ctx context.Context, req models.DepositRequest) (*models.OperationResponse, error)

	// 凍結/解凍用戶
	ChangeUserStatus(ctx context.Context, req models.ChangeUserStatusRequest) (*models.OperationResponse, error)
}
