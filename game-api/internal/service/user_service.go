package service

import (
	"context"
	"errors"
	"game-api/internal/config"
	"game-api/internal/domain/entity"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"math"
	"time"

	"github.com/google/uuid"
)

// userService 用戶服務實現
type userService struct {
	config *config.Config
}

// NewUserService 創建用戶服務
func NewUserService(cfg *config.Config) interfaces.UserService {
	return &userService{
		config: cfg,
	}
}

// GetUsers 獲取用戶列表
func (s *userService) GetUsers(ctx context.Context, filter models.UserListFilterRequest) (*models.UserListResponse, error) {
	// 簡化實現，僅作為測試
	// 在正式環境中，應該從數據庫查詢用戶列表

	// 模擬一些用戶數據
	users := []entity.AppUser{
		{
			ID:       "1",
			Username: "user1",
			Email:    "user1@example.com",
			Role:     entity.RoleUser,
			IsActive: true,
		},
		{
			ID:       "2",
			Username: "admin1",
			Email:    "admin1@example.com",
			Role:     entity.RoleAdmin,
			IsActive: true,
		},
	}

	// 構建響應
	userResponses := make([]models.UserResponse, 0, len(users))
	for _, user := range users {
		userResponses = append(userResponses, models.UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			Role:      string(user.Role),
			IsActive:  user.IsActive,
			Balance:   1000,
			CreatedAt: time.Now(),
		})
	}

	return &models.UserListResponse{
		PaginationResponse: models.PaginationResponse{
			Total:       int64(len(users)),
			TotalPages:  int(math.Ceil(float64(len(users)) / float64(filter.PageSize))),
			CurrentPage: filter.Page,
			PageSize:    filter.PageSize,
		},
		Users: userResponses,
	}, nil
}

// GetUserByID 獲取用戶詳情
func (s *userService) GetUserByID(ctx context.Context, userID string) (*models.UserResponse, error) {
	// 簡化實現，僅作為測試
	// 在正式環境中，應該從數據庫查詢用戶

	// 模擬用戶數據
	if userID == "1" {
		return &models.UserResponse{
			ID:        "1",
			Username:  "user1",
			Email:     "user1@example.com",
			Role:      "user",
			IsActive:  true,
			Balance:   1000,
			CreatedAt: time.Now(),
		}, nil
	}

	return nil, errors.New("用戶不存在")
}

// CreateUser 創建用戶
func (s *userService) CreateUser(ctx context.Context, req models.CreateUserRequest) (*models.UserResponse, error) {
	// 簡化實現，僅作為測試
	// 在正式環境中，應該將用戶保存到數據庫

	// 生成唯一ID
	userID := uuid.New().String()

	// 設置角色
	role := entity.RoleUser
	if req.Role != nil {
		role = entity.UserRole(*req.Role)
	}

	// 設置初始餘額
	balance := 0.0
	if req.Balance != nil {
		balance = *req.Balance
	}

	// 返回創建的用戶
	return &models.UserResponse{
		ID:        userID,
		Username:  req.Username,
		Email:     req.Email,
		Role:      string(role),
		IsActive:  true,
		Balance:   balance,
		CreatedAt: time.Now(),
	}, nil
}

// DepositToUser 用戶儲值
func (s *userService) DepositToUser(ctx context.Context, req models.DepositRequest) (*models.OperationResponse, error) {
	// 簡化實現，僅作為測試
	// 在正式環境中，應該更新數據庫中的用戶錢包

	// 返回模擬的結果
	return &models.OperationResponse{
		Success: true,
		Message: "儲值成功",
	}, nil
}

// ChangeUserStatus 更改用戶狀態
func (s *userService) ChangeUserStatus(ctx context.Context, req models.ChangeUserStatusRequest) (*models.OperationResponse, error) {
	// 簡化實現，僅作為測試
	// 在正式環境中，應該更新數據庫中的用戶狀態

	message := "用戶凍結成功"
	if req.Active {
		message = "用戶解凍成功"
	}

	// 模擬成功
	return &models.OperationResponse{
		Success: true,
		Message: message,
	}, nil
}
