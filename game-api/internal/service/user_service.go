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
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// userService 用戶服務實現
type userService struct {
	config *config.Config
	db     *gorm.DB
	logger *zap.Logger
}

// NewUserService 創建用戶服務
func NewUserService(cfg *config.Config, db *gorm.DB, logger *zap.Logger) interfaces.UserService {
	return &userService{
		config: cfg,
		db:     db,
		logger: logger,
	}
}

// GetUsers 獲取用戶列表
func (s *userService) GetUsers(ctx context.Context, filter models.UserListFilterRequest) (*models.UserListResponse, error) {
	var users []entity.AppUser
	var total int64

	// 創建查詢
	query := s.db.Model(&entity.AppUser{})

	// 應用過濾條件
	if filter.Status != nil {
		if *filter.Status == "active" {
			query = query.Where("is_active = ?", true)
		} else if *filter.Status == "inactive" {
			query = query.Where("is_active = ?", false)
		} else if *filter.Status == "pending" {
			query = query.Where("is_verified = ?", false)
		}
	}

	if filter.Role != nil {
		query = query.Where("role = ?", *filter.Role)
	}

	if filter.SearchTerm != nil && *filter.SearchTerm != "" {
		searchTerm := "%" + *filter.SearchTerm + "%"
		query = query.Where("username LIKE ? OR email LIKE ?", searchTerm, searchTerm)
	}

	// 查詢總數
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// 分頁查詢
	page := filter.Page
	if page < 1 {
		page = 1
	}

	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

	// 獲取用戶列表
	if err := query.Limit(pageSize).Offset(offset).Find(&users).Error; err != nil {
		return nil, err
	}

	// 構建響應
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	userResponses := make([]models.UserResponse, 0, len(users))

	// 查詢錢包信息
	for _, user := range users {
		// 查詢錢包
		var wallet entity.UserWallet
		if err := s.db.Where("user_id = ?", user.ID).First(&wallet).Error; err != nil {
			// 如果沒有錢包，設置默認值
			if errors.Is(err, gorm.ErrRecordNotFound) {
				wallet.Balance = 0
			} else {
				return nil, err
			}
		}

		userResponse := models.UserResponse{
			ID:          user.ID,
			Username:    user.Username,
			Email:       user.Email,
			Role:        string(user.Role),
			VIPLevel:    user.VIPLevel,
			Points:      user.Points,
			Balance:     wallet.Balance,
			AvatarURL:   user.AvatarURL,
			IsVerified:  user.IsVerified,
			IsActive:    user.IsActive,
			CreatedAt:   user.CreatedAt,
			LastLoginAt: user.LastLogin,
		}

		userResponses = append(userResponses, userResponse)
	}

	return &models.UserListResponse{
		PaginationResponse: models.PaginationResponse{
			Total:       total,
			TotalPages:  totalPages,
			CurrentPage: page,
			PageSize:    pageSize,
		},
		Users: userResponses,
	}, nil
}

// GetUserByID 獲取用戶詳情
func (s *userService) GetUserByID(ctx context.Context, userID string) (*models.UserResponse, error) {
	var user entity.AppUser

	// 查詢用戶
	if err := s.db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用戶不存在")
		}
		return nil, err
	}

	// 查詢錢包
	var wallet entity.UserWallet
	if err := s.db.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
		// 如果沒有錢包，設置默認值
		if errors.Is(err, gorm.ErrRecordNotFound) {
			wallet.Balance = 0
		} else {
			return nil, err
		}
	}

	// 構建響應
	return &models.UserResponse{
		ID:          user.ID,
		Username:    user.Username,
		Email:       user.Email,
		Role:        string(user.Role),
		VIPLevel:    user.VIPLevel,
		Points:      user.Points,
		Balance:     wallet.Balance,
		AvatarURL:   user.AvatarURL,
		IsVerified:  user.IsVerified,
		IsActive:    user.IsActive,
		CreatedAt:   user.CreatedAt,
		LastLoginAt: user.LastLogin,
	}, nil
}

// CreateUser 創建用戶
func (s *userService) CreateUser(ctx context.Context, req models.CreateUserRequest) (*models.UserResponse, error) {
	// 開啟事務
	tx := s.db.Begin()

	// 檢查用戶名是否存在
	var count int64
	if err := tx.Model(&entity.AppUser{}).Where("username = ?", req.Username).Count(&count).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if count > 0 {
		tx.Rollback()
		return nil, errors.New("用戶名已存在")
	}

	// 檢查電子郵件是否存在
	if err := tx.Model(&entity.AppUser{}).Where("email = ?", req.Email).Count(&count).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if count > 0 {
		tx.Rollback()
		return nil, errors.New("電子郵件已存在")
	}

	// 生成密碼哈希
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		tx.Rollback()
		return nil, errors.New("密碼哈希失敗")
	}

	// 設置角色
	role := entity.RoleUser
	if req.Role != nil {
		role = entity.UserRole(*req.Role)
	}

	// 創建用戶
	userID := uuid.New().String()
	user := entity.AppUser{
		ID:         userID,
		Username:   req.Username,
		Email:      req.Email,
		Password:   string(passwordHash),
		Role:       role,
		IsVerified: true,
		IsActive:   true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 創建錢包
	wallet := entity.UserWallet{
		ID:     uuid.New().String(),
		UserID: userID,
	}

	if req.Balance != nil && *req.Balance > 0 {
		wallet.Balance = *req.Balance
		wallet.TotalDeposit = *req.Balance
	}

	if err := tx.Create(&wallet).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 如果有初始餘額，創建交易記錄
	if req.Balance != nil && *req.Balance > 0 {
		transaction := entity.Transaction{
			ID:            uuid.New().String(),
			UserID:        userID,
			WalletID:      wallet.ID,
			Amount:        *req.Balance,
			Type:          entity.TransactionDeposit,
			Status:        entity.StatusCompleted,
			Description:   stringPtr("初始儲值"),
			BalanceBefore: 0,
			BalanceAfter:  *req.Balance,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		if err := tx.Create(&transaction).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	// 提交事務
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	// 返回創建的用戶
	return s.GetUserByID(ctx, userID)
}

// DepositToUser 用戶儲值
func (s *userService) DepositToUser(ctx context.Context, req models.DepositRequest) (*models.OperationResponse, error) {
	// 檢查參數
	if req.Amount <= 0 {
		return nil, errors.New("儲值金額必須大於零")
	}

	// 開啟事務
	tx := s.db.Begin()

	// 查詢用戶
	var user entity.AppUser
	if err := tx.Where("user_id = ?", req.UserID).First(&user).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用戶不存在")
		}
		return nil, err
	}

	// 檢查用戶狀態
	if !user.IsActive {
		tx.Rollback()
		return nil, errors.New("用戶已被凍結，無法儲值")
	}

	// 查詢或創建錢包
	var wallet entity.UserWallet
	if err := tx.Where("user_id = ?", req.UserID).First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 創建新錢包
			wallet = entity.UserWallet{
				ID:     uuid.New().String(),
				UserID: req.UserID,
			}
			if err := tx.Create(&wallet).Error; err != nil {
				tx.Rollback()
				return nil, err
			}
		} else {
			tx.Rollback()
			return nil, err
		}
	}

	// 儲存原始餘額
	balanceBefore := wallet.Balance

	// 更新錢包餘額
	if err := wallet.AddBalance(tx, req.Amount); err != nil {
		tx.Rollback()
		return nil, err
	}

	// 創建交易記錄
	description := "用戶儲值"
	if req.Description != nil {
		description = *req.Description
	}

	transaction := entity.Transaction{
		ID:            uuid.New().String(),
		UserID:        req.UserID,
		WalletID:      wallet.ID,
		Amount:        req.Amount,
		Type:          entity.TransactionDeposit,
		Status:        entity.StatusCompleted,
		Description:   &description,
		BalanceBefore: balanceBefore,
		BalanceAfter:  wallet.Balance,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 提交事務
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &models.OperationResponse{
		Success: true,
		Message: "儲值成功",
	}, nil
}

// ChangeUserStatus 凍結/解凍用戶
func (s *userService) ChangeUserStatus(ctx context.Context, req models.ChangeUserStatusRequest) (*models.OperationResponse, error) {
	// 開啟事務
	tx := s.db.Begin()

	// 查詢用戶
	var user entity.AppUser
	if err := tx.Where("user_id = ?", req.UserID).First(&user).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用戶不存在")
		}
		return nil, err
	}

	// 更新用戶狀態
	if user.IsActive == req.Active {
		tx.Rollback()
		status := "已啟用"
		if !req.Active {
			status = "已凍結"
		}
		return nil, errors.New("用戶已經處於" + status + "狀態")
	}

	user.IsActive = req.Active
	user.UpdatedAt = time.Now()

	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 提交事務
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	message := "用戶凍結成功"
	if req.Active {
		message = "用戶解凍成功"
	}

	return &models.OperationResponse{
		Success: true,
		Message: message,
	}, nil
}

// stringPtr 輔助函數：返回字符串指針
func stringPtr(s string) *string {
	return &s
}
