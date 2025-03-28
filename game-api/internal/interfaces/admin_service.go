package interfaces

import (
	"context"
	"game-api/internal/domain/models"
)

// AdminService 後台管理服務接口
type AdminService interface {
	// 管理員登入
	AdminLogin(ctx context.Context, req models.AdminLoginRequest) (*models.LoginResponse, error)

	// 獲取用戶列表
	GetUserList(ctx context.Context, req models.AdminUserListRequest) (*models.AdminUserListResponse, error)

	// 變更用戶狀態
	ChangeUserStatus(ctx context.Context, req models.AdminChangeUserStatusRequest) (*models.OperationResponse, error)

	// 為用戶儲值
	DepositForUser(ctx context.Context, req models.AdminDepositRequest) (*models.OperationResponse, error)
}
