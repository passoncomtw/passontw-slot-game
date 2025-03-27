package interfaces

import (
	"context"
	"game-api/internal/domain/models"
)

// UserService 用戶服務接口
type UserService interface {
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
