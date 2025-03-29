package service

import (
	"context"
	"errors"
	"game-api/internal/config"
	"game-api/internal/domain/entity"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/databaseManager"
	"game-api/pkg/logger"
	"math"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// userService 用戶服務實現
type userService struct {
	config *config.Config
	db     databaseManager.DatabaseManager
	logger logger.Logger
}

// NewUserService 創建用戶服務
func NewUserService(cfg *config.Config, db databaseManager.DatabaseManager, logger logger.Logger) interfaces.UserService {
	return &userService{
		config: cfg,
		db:     db,
		logger: logger,
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

func (s *userService) Register(ctx context.Context, req *models.RegisterRequest) (*models.User, error) {
	// 獲取原始的 GORM DB 對象
	db := s.db.GetDB().WithContext(ctx)

	// 檢查用戶名是否已存在
	var count int64
	if err := db.Model(&models.User{}).Where("username = ?", req.Username).Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("用戶名已存在")
	}

	// 檢查郵箱是否已存在
	if err := db.Model(&models.User{}).Where("email = ?", req.Email).Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("郵箱已存在")
	}

	// 密碼加密
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 創建用戶
	userID := uuid.New()
	now := time.Now()

	user := &models.User{
		UserID:       userID,
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		AuthProvider: "email",
		Role:         "user",
		VipLevel:     0,
		Points:       0,
		IsVerified:   false,
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// 使用事務創建用戶及其相關資料
	err = db.Transaction(func(tx *gorm.DB) error {
		// 創建用戶
		if err := tx.Create(user).Error; err != nil {
			return err
		}

		// 創建用戶設定
		settings := &models.UserSettings{
			UserID:             userID,
			Sound:              true,
			Music:              true,
			Vibration:          false,
			HighQuality:        true,
			AIAssistant:        true,
			GameRecommendation: true,
			DataCollection:     true,
			UpdatedAt:          now,
		}
		if err := tx.Create(settings).Error; err != nil {
			return err
		}

		// 創建用戶錢包
		wallet := &models.UserWallet{
			WalletID:      uuid.New(),
			UserID:        userID,
			Balance:       0,
			TotalDeposit:  0,
			TotalWithdraw: 0,
			TotalBet:      0,
			TotalWin:      0,
			CreatedAt:     now,
			UpdatedAt:     now,
		}
		if err := tx.Create(wallet).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// 獲取完整用戶信息以返回
	var result models.User
	if err := db.Where("user_id = ?", userID).First(&result).Error; err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *userService) Login(ctx context.Context, req *models.LoginRequest) (string, error) {
	// 獲取原始的 GORM DB 對象
	db := s.db.GetDB().WithContext(ctx)

	var user models.User
	if err := db.Where("email = ? AND is_active = ?", req.Email, true).First(&user).Error; err != nil {
		return "", errors.New("用戶不存在或已被禁用")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return "", errors.New("密碼錯誤")
	}

	// TODO: 生成 JWT token
	return "token", nil
}

func (s *userService) GetProfile(ctx context.Context, userID string) (*models.UserProfileResponse, error) {
	// 獲取原始的 GORM DB 對象
	db := s.db.GetDB().WithContext(ctx)

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	var user models.User
	if err := db.Where("user_id = ?", uid).First(&user).Error; err != nil {
		return nil, err
	}

	var settings models.UserSettings
	if err := db.Where("user_id = ?", uid).First(&settings).Error; err != nil {
		return nil, err
	}

	var wallet models.UserWallet
	if err := db.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
		return nil, err
	}

	return &models.UserProfileResponse{
		User:     user,
		Settings: settings,
		Wallet:   wallet,
	}, nil
}

func (s *userService) UpdateProfile(ctx context.Context, userID string, req *models.UpdateProfileRequest) error {
	// 獲取原始的 GORM DB 對象
	db := s.db.GetDB().WithContext(ctx)

	uid, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if req.Username != "" {
		updates["username"] = req.Username
	}
	if req.AvatarURL != "" {
		updates["avatar_url"] = req.AvatarURL
	}

	return db.Model(&models.User{}).Where("user_id = ?", uid).Updates(updates).Error
}

func (s *userService) UpdateSettings(ctx context.Context, userID string, req *models.AppUpdateSettingsRequest) error {
	// 獲取原始的 GORM DB 對象
	db := s.db.GetDB().WithContext(ctx)

	uid, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if req.Sound != nil {
		updates["sound"] = *req.Sound
	}
	if req.Music != nil {
		updates["music"] = *req.Music
	}
	if req.Vibration != nil {
		updates["vibration"] = *req.Vibration
	}
	if req.HighQuality != nil {
		updates["high_quality"] = *req.HighQuality
	}
	if req.AIAssistant != nil {
		updates["ai_assistant"] = *req.AIAssistant
	}
	if req.GameRecommendation != nil {
		updates["game_recommendation"] = *req.GameRecommendation
	}
	if req.DataCollection != nil {
		updates["data_collection"] = *req.DataCollection
	}

	return db.Model(&models.UserSettings{}).Where("user_id = ?", uid).Updates(updates).Error
}
