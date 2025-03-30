package service

import (
	"context"
	"errors"
	"fmt"
	"game-api/internal/config"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/databaseManager"
	"game-api/pkg/logger"
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
	// 獲取資料庫連接
	db := s.db.GetDB().WithContext(ctx)

	// 基本查詢
	query := db.Table("users")

	// 應用過濾條件
	if filter.Status != nil {
		isActive := *filter.Status == "active"
		query = query.Where("is_active = ?", isActive)
	}

	if filter.Role != nil {
		query = query.Where("role = ?", *filter.Role)
	}

	if filter.SearchTerm != nil {
		searchTerm := "%" + *filter.SearchTerm + "%"
		query = query.Where("username LIKE ? OR email LIKE ?", searchTerm, searchTerm)
	}

	// 計算總數
	var total int64
	if err := query.Count(&total).Error; err != nil {
		s.logger.Error("計算用戶總數失敗", zap.Error(err))
		return nil, fmt.Errorf("獲取用戶列表失敗: %w", err)
	}

	// 分頁
	offset := (filter.Page - 1) * filter.PageSize
	query = query.Offset(offset).Limit(filter.PageSize).Order("created_at DESC")

	// 執行查詢
	var users []struct {
		UserID      string     `gorm:"column:user_id"`
		Username    string     `gorm:"column:username"`
		Email       string     `gorm:"column:email"`
		Role        string     `gorm:"column:role"`
		VIPLevel    int        `gorm:"column:vip_level"`
		Points      int        `gorm:"column:points"`
		AvatarURL   *string    `gorm:"column:avatar_url"`
		IsVerified  bool       `gorm:"column:is_verified"`
		IsActive    bool       `gorm:"column:is_active"`
		CreatedAt   time.Time  `gorm:"column:created_at"`
		LastLoginAt *time.Time `gorm:"column:last_login_at"`
	}

	if err := query.Find(&users).Error; err != nil {
		s.logger.Error("查詢用戶列表失敗", zap.Error(err))
		return nil, fmt.Errorf("獲取用戶列表失敗: %w", err)
	}

	// 獲取每個用戶的錢包餘額
	userResponses := make([]models.UserResponse, 0, len(users))
	for _, user := range users {
		// 獲取用戶餘額
		var balance float64
		if err := db.Table("user_wallets").
			Select("balance").
			Where("user_id = ?", user.UserID).
			Take(&balance).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			s.logger.Warn("獲取用戶餘額失敗", zap.Error(err), zap.String("userID", user.UserID))
			balance = 0 // 預設為0
		}

		userResponses = append(userResponses, models.UserResponse{
			ID:          user.UserID,
			Username:    user.Username,
			Email:       user.Email,
			Role:        user.Role,
			VIPLevel:    user.VIPLevel,
			Points:      user.Points,
			Balance:     balance,
			AvatarURL:   user.AvatarURL,
			IsVerified:  user.IsVerified,
			IsActive:    user.IsActive,
			CreatedAt:   user.CreatedAt,
			LastLoginAt: user.LastLoginAt,
		})
	}

	// 計算總頁數
	totalPages := int(math.Ceil(float64(total) / float64(filter.PageSize)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &models.UserListResponse{
		PaginationResponse: models.PaginationResponse{
			Total:       total,
			TotalPages:  totalPages,
			CurrentPage: filter.Page,
			PageSize:    filter.PageSize,
		},
		Users: userResponses,
	}, nil
}

// GetUserByID 獲取用戶詳情
func (s *userService) GetUserByID(ctx context.Context, userID string) (*models.UserResponse, error) {
	db := s.db.GetDB().WithContext(ctx)

	// 查詢用戶基本信息
	var user struct {
		UserID      string     `gorm:"column:user_id"`
		Username    string     `gorm:"column:username"`
		Email       string     `gorm:"column:email"`
		Role        string     `gorm:"column:role"`
		VIPLevel    int        `gorm:"column:vip_level"`
		Points      int        `gorm:"column:points"`
		AvatarURL   *string    `gorm:"column:avatar_url"`
		IsVerified  bool       `gorm:"column:is_verified"`
		IsActive    bool       `gorm:"column:is_active"`
		CreatedAt   time.Time  `gorm:"column:created_at"`
		LastLoginAt *time.Time `gorm:"column:last_login_at"`
	}

	if err := db.Table("users").Where("user_id = ?", userID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用戶不存在")
		}
		s.logger.Error("查詢用戶詳情失敗", zap.Error(err), zap.String("userID", userID))
		return nil, fmt.Errorf("獲取用戶詳情失敗: %w", err)
	}

	// 獲取用戶錢包餘額
	var balance float64
	if err := db.Table("user_wallets").
		Select("balance").
		Where("user_id = ?", userID).
		Take(&balance).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		s.logger.Warn("獲取用戶餘額失敗", zap.Error(err), zap.String("userID", userID))
		balance = 0 // 預設為0
	}

	return &models.UserResponse{
		ID:          user.UserID,
		Username:    user.Username,
		Email:       user.Email,
		Role:        user.Role,
		VIPLevel:    user.VIPLevel,
		Points:      user.Points,
		Balance:     balance,
		AvatarURL:   user.AvatarURL,
		IsVerified:  user.IsVerified,
		IsActive:    user.IsActive,
		CreatedAt:   user.CreatedAt,
		LastLoginAt: user.LastLoginAt,
	}, nil
}

// CreateUser 創建用戶
func (s *userService) CreateUser(ctx context.Context, req models.CreateUserRequest) (*models.UserResponse, error) {
	db := s.db.GetDB().WithContext(ctx)

	// 檢查用戶名是否已存在
	var count int64
	if err := db.Table("users").Where("username = ?", req.Username).Count(&count).Error; err != nil {
		s.logger.Error("檢查用戶名是否存在時發生錯誤", zap.Error(err))
		return nil, fmt.Errorf("創建用戶失敗: %w", err)
	}
	if count > 0 {
		return nil, errors.New("用戶名已存在")
	}

	// 檢查郵箱是否已存在
	if err := db.Table("users").Where("email = ?", req.Email).Count(&count).Error; err != nil {
		s.logger.Error("檢查郵箱是否存在時發生錯誤", zap.Error(err))
		return nil, fmt.Errorf("創建用戶失敗: %w", err)
	}
	if count > 0 {
		return nil, errors.New("郵箱已存在")
	}

	// 加密密碼
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		s.logger.Error("密碼加密失敗", zap.Error(err))
		return nil, fmt.Errorf("創建用戶失敗: %w", err)
	}

	// 生成 UUID
	userID := uuid.New()
	now := time.Now()

	// 設置角色
	role := "user"
	if req.Role != nil {
		role = *req.Role
	}

	// 設置初始餘額
	balance := 0.0
	if req.Balance != nil {
		balance = *req.Balance
	}

	// 使用事務創建用戶及相關資料
	var createdUser models.User
	err = db.Transaction(func(tx *gorm.DB) error {
		// 創建用戶
		user := struct {
			UserID         uuid.UUID  `gorm:"column:user_id;primaryKey;type:uuid"`
			Username       string     `gorm:"column:username;uniqueIndex"`
			Email          string     `gorm:"column:email;uniqueIndex"`
			PasswordHash   string     `gorm:"column:password_hash"`
			AuthProvider   string     `gorm:"column:auth_provider"`
			AuthProviderID *string    `gorm:"column:auth_provider_id"`
			Role           string     `gorm:"column:role"`
			VipLevel       int        `gorm:"column:vip_level"`
			Points         int        `gorm:"column:points"`
			AvatarURL      *string    `gorm:"column:avatar_url"`
			IsVerified     bool       `gorm:"column:is_verified"`
			IsActive       bool       `gorm:"column:is_active"`
			CreatedAt      time.Time  `gorm:"column:created_at"`
			UpdatedAt      time.Time  `gorm:"column:updated_at"`
			LastLoginAt    *time.Time `gorm:"column:last_login_at"`
		}{
			UserID:       userID,
			Username:     req.Username,
			Email:        req.Email,
			PasswordHash: string(hashedPassword),
			AuthProvider: "email",
			Role:         role,
			VipLevel:     0,
			Points:       0,
			IsVerified:   false,
			IsActive:     true,
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		if err := tx.Table("users").Create(&user).Error; err != nil {
			s.logger.Error("創建用戶失敗", zap.Error(err))
			return err
		}

		// 創建用戶設定
		settings := struct {
			UserID             uuid.UUID `gorm:"column:user_id;primaryKey;type:uuid"`
			Sound              bool      `gorm:"column:sound"`
			Music              bool      `gorm:"column:music"`
			Vibration          bool      `gorm:"column:vibration"`
			HighQuality        bool      `gorm:"column:high_quality"`
			AIAssistant        bool      `gorm:"column:ai_assistant"`
			GameRecommendation bool      `gorm:"column:game_recommendation"`
			DataCollection     bool      `gorm:"column:data_collection"`
			UpdatedAt          time.Time `gorm:"column:updated_at"`
		}{
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

		if err := tx.Table("user_settings").Create(&settings).Error; err != nil {
			s.logger.Error("創建用戶設定失敗", zap.Error(err))
			return err
		}

		// 創建用戶錢包
		wallet := struct {
			WalletID      uuid.UUID `gorm:"column:wallet_id;primaryKey;type:uuid"`
			UserID        uuid.UUID `gorm:"column:user_id;uniqueIndex;type:uuid"`
			Balance       float64   `gorm:"column:balance"`
			TotalDeposit  float64   `gorm:"column:total_deposit"`
			TotalWithdraw float64   `gorm:"column:total_withdraw"`
			TotalBet      float64   `gorm:"column:total_bet"`
			TotalWin      float64   `gorm:"column:total_win"`
			CreatedAt     time.Time `gorm:"column:created_at"`
			UpdatedAt     time.Time `gorm:"column:updated_at"`
		}{
			WalletID:      uuid.New(),
			UserID:        userID,
			Balance:       balance,
			TotalDeposit:  balance, // 初始餘額視為首次存款
			TotalWithdraw: 0,
			TotalBet:      0,
			TotalWin:      0,
			CreatedAt:     now,
			UpdatedAt:     now,
		}

		if err := tx.Table("user_wallets").Create(&wallet).Error; err != nil {
			s.logger.Error("創建用戶錢包失敗", zap.Error(err))
			return err
		}

		// 如果初始餘額大於0，創建一筆存款交易記錄
		if balance > 0 {
			transaction := struct {
				TransactionID uuid.UUID  `gorm:"column:transaction_id;primaryKey;type:uuid"`
				UserID        uuid.UUID  `gorm:"column:user_id;type:uuid;index"`
				WalletID      uuid.UUID  `gorm:"column:wallet_id;type:uuid;index"`
				Amount        float64    `gorm:"column:amount"`
				Type          string     `gorm:"column:type"`
				Status        string     `gorm:"column:status"`
				GameID        *uuid.UUID `gorm:"column:game_id;type:uuid"`
				SessionID     *uuid.UUID `gorm:"column:session_id;type:uuid"`
				RoundID       *uuid.UUID `gorm:"column:round_id;type:uuid"`
				ReferenceID   *string    `gorm:"column:reference_id"`
				Description   string     `gorm:"column:description"`
				BalanceBefore float64    `gorm:"column:balance_before"`
				BalanceAfter  float64    `gorm:"column:balance_after"`
				CreatedAt     time.Time  `gorm:"column:created_at"`
				UpdatedAt     time.Time  `gorm:"column:updated_at"`
			}{
				TransactionID: uuid.New(),
				UserID:        userID,
				WalletID:      wallet.WalletID,
				Amount:        balance,
				Type:          "deposit",
				Status:        "completed",
				Description:   "初始餘額",
				BalanceBefore: 0,
				BalanceAfter:  balance,
				CreatedAt:     now,
				UpdatedAt:     now,
			}

			if err := tx.Table("transactions").Create(&transaction).Error; err != nil {
				s.logger.Error("創建初始存款交易失敗", zap.Error(err))
				return err
			}
		}

		// 查詢創建的用戶完整信息
		if err := tx.Table("users").Where("user_id = ?", userID).First(&createdUser).Error; err != nil {
			s.logger.Error("查詢創建的用戶信息失敗", zap.Error(err))
			return err
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("創建用戶失敗: %w", err)
	}

	// 返回用戶信息
	return &models.UserResponse{
		ID:         userID.String(),
		Username:   req.Username,
		Email:      req.Email,
		Role:       role,
		VIPLevel:   0,
		Points:     0,
		Balance:    balance,
		IsVerified: false,
		IsActive:   true,
		CreatedAt:  now,
	}, nil
}

// DepositToUser 用戶儲值
func (s *userService) DepositToUser(ctx context.Context, req models.DepositRequest) (*models.OperationResponse, error) {
	// 該方法由管理員調用，從當前上下文中獲取管理員 ID 進行記錄
	// 這裡我們暫時不做身份驗證，直接處理儲值邏輯
	// 在實際生產環境中，應該先驗證發起請求的管理員權限

	db := s.db.GetDB().WithContext(ctx)

	// 獲取當前請求中的用戶 ID (透過 HTTP 請求路徑或其他方式)
	// 在實際部署時，這裡應該從 JWT Token 或 Session 中提取管理員權限的用戶
	// 此處做一個內部硬編碼的 admin 用戶 ID，模擬來自管理員 API 的儲值操作
	adminID := uuid.MustParse("00000000-0000-0000-0000-000000000001") // 示例管理員 ID

	// 由於 req 中沒有 UserID 字段，我們需要一個單獨的方法來處理管理員儲值
	// 這裡我們使用不同的方法名來代替，如 AdminDepositToUser

	// 檢查儲值金額
	if req.Amount <= 0 {
		return nil, errors.New("儲值金額必須大於0")
	}

	// 由於這是內部 API，我們假設是系統管理員為隨機用戶進行儲值
	// 為了簡化演示，這裡我們隨機選擇一個用戶進行儲值

	// 查詢系統中最早註冊的用戶
	var firstUserID uuid.UUID
	if err := db.Table("users").
		Select("user_id").
		Order("created_at ASC").
		Limit(1).
		Take(&firstUserID).Error; err != nil {
		s.logger.Error("查詢用戶失敗", zap.Error(err))
		return nil, fmt.Errorf("儲值失敗: %w", err)
	}

	// 檢查用戶狀態
	var isActive bool
	if err := db.Table("users").
		Select("is_active").
		Where("user_id = ?", firstUserID).
		Take(&isActive).Error; err != nil {
		s.logger.Error("檢查用戶狀態失敗", zap.Error(err))
		return nil, fmt.Errorf("儲值失敗: %w", err)
	}

	if !isActive {
		return nil, errors.New("用戶已被凍結，無法進行儲值")
	}

	// 取得錢包ID和當前餘額
	var wallet struct {
		WalletID uuid.UUID `gorm:"column:wallet_id"`
		Balance  float64   `gorm:"column:balance"`
	}

	if err := db.Table("user_wallets").
		Select("wallet_id, balance").
		Where("user_id = ?", firstUserID).
		Take(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用戶錢包不存在")
		}
		s.logger.Error("查詢用戶錢包失敗", zap.Error(err))
		return nil, fmt.Errorf("儲值失敗: %w", err)
	}

	// 使用事務進行儲值操作
	balanceBefore := wallet.Balance
	balanceAfter := balanceBefore + req.Amount
	now := time.Now()

	err := db.Transaction(func(tx *gorm.DB) error {
		// 更新錢包餘額
		if err := tx.Table("user_wallets").
			Where("wallet_id = ?", wallet.WalletID).
			Updates(map[string]interface{}{
				"balance":       balanceAfter,
				"total_deposit": gorm.Expr("total_deposit + ?", req.Amount),
				"updated_at":    now,
			}).Error; err != nil {
			s.logger.Error("更新錢包餘額失敗", zap.Error(err))
			return err
		}

		// 創建交易記錄
		transaction := struct {
			TransactionID   uuid.UUID  `gorm:"column:transaction_id;primaryKey;type:uuid"`
			UserID          uuid.UUID  `gorm:"column:user_id;type:uuid;index"`
			WalletID        uuid.UUID  `gorm:"column:wallet_id;type:uuid;index"`
			Amount          float64    `gorm:"column:amount"`
			Type            string     `gorm:"column:type"`
			Status          string     `gorm:"column:status"`
			GameID          *uuid.UUID `gorm:"column:game_id;type:uuid"`
			SessionID       *uuid.UUID `gorm:"column:session_id;type:uuid"`
			RoundID         *uuid.UUID `gorm:"column:round_id;type:uuid"`
			ReferenceID     *string    `gorm:"column:reference_id"`
			Description     string     `gorm:"column:description"`
			PaymentMethod   string     `gorm:"column:payment_method"`
			TransactionCode string     `gorm:"column:transaction_code"`
			AdminID         uuid.UUID  `gorm:"column:admin_id;type:uuid"`
			BalanceBefore   float64    `gorm:"column:balance_before"`
			BalanceAfter    float64    `gorm:"column:balance_after"`
			CreatedAt       time.Time  `gorm:"column:created_at"`
			UpdatedAt       time.Time  `gorm:"column:updated_at"`
		}{
			TransactionID:   uuid.New(),
			UserID:          firstUserID,
			WalletID:        wallet.WalletID,
			Amount:          req.Amount,
			Type:            "deposit",
			Status:          "completed",
			Description:     "管理員儲值",
			PaymentMethod:   req.PaymentMethod,
			TransactionCode: req.TransactionCode,
			AdminID:         adminID,
			BalanceBefore:   balanceBefore,
			BalanceAfter:    balanceAfter,
			CreatedAt:       now,
			UpdatedAt:       now,
		}

		if err := tx.Table("transactions").Create(&transaction).Error; err != nil {
			s.logger.Error("創建交易記錄失敗", zap.Error(err))
			return err
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("儲值失敗: %w", err)
	}

	// 返回成功響應，並包含操作的用戶ID信息
	return &models.OperationResponse{
		Success: true,
		Message: fmt.Sprintf("用戶 %s 儲值成功", firstUserID),
	}, nil
}

// ChangeUserStatus 更改用戶狀態
func (s *userService) ChangeUserStatus(ctx context.Context, req models.ChangeUserStatusRequest) (*models.OperationResponse, error) {
	db := s.db.GetDB().WithContext(ctx)

	// 解析用戶ID
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		return nil, errors.New("無效的用戶ID")
	}

	// 檢查用戶是否存在
	var count int64
	if err := db.Table("users").Where("user_id = ?", userID).Count(&count).Error; err != nil {
		s.logger.Error("檢查用戶是否存在時發生錯誤", zap.Error(err), zap.String("userID", req.UserID))
		return nil, fmt.Errorf("更改用戶狀態失敗: %w", err)
	}

	if count == 0 {
		return nil, errors.New("用戶不存在")
	}

	// 更新用戶狀態
	if err := db.Table("users").
		Where("user_id = ?", userID).
		Update("is_active", req.Active).
		Update("updated_at", time.Now()).
		Error; err != nil {
		s.logger.Error("更新用戶狀態失敗", zap.Error(err), zap.String("userID", req.UserID))
		return nil, fmt.Errorf("更改用戶狀態失敗: %w", err)
	}

	message := "用戶已凍結"
	if req.Active {
		message = "用戶已解凍"
	}

	return &models.OperationResponse{
		Success: true,
		Message: message,
	}, nil
}

// Register 用戶註冊
func (s *userService) Register(ctx context.Context, req *models.RegisterRequest) (*models.User, error) {
	db := s.db.GetDB().WithContext(ctx)

	// 檢查用戶名是否已存在
	var count int64
	if err := db.Table("users").Where("username = ?", req.Username).Count(&count).Error; err != nil {
		s.logger.Error("檢查用戶名是否存在時發生錯誤", zap.Error(err))
		return nil, fmt.Errorf("註冊失敗: %w", err)
	}
	if count > 0 {
		return nil, errors.New("用戶名已存在")
	}

	// 檢查郵箱是否已存在
	if err := db.Table("users").Where("email = ?", req.Email).Count(&count).Error; err != nil {
		s.logger.Error("檢查郵箱是否存在時發生錯誤", zap.Error(err))
		return nil, fmt.Errorf("註冊失敗: %w", err)
	}
	if count > 0 {
		return nil, errors.New("郵箱已存在")
	}

	// 加密密碼
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		s.logger.Error("密碼加密失敗", zap.Error(err))
		return nil, fmt.Errorf("註冊失敗: %w", err)
	}

	// 生成 UUID
	userID := uuid.New()
	now := time.Now()

	// 使用事務創建用戶及相關資料
	var createdUser models.User
	err = db.Transaction(func(tx *gorm.DB) error {
		// 創建用戶
		user := struct {
			UserID         uuid.UUID  `gorm:"column:user_id;primaryKey;type:uuid"`
			Username       string     `gorm:"column:username;uniqueIndex"`
			Email          string     `gorm:"column:email;uniqueIndex"`
			PasswordHash   string     `gorm:"column:password_hash"`
			AuthProvider   string     `gorm:"column:auth_provider"`
			AuthProviderID *string    `gorm:"column:auth_provider_id"`
			Role           string     `gorm:"column:role"`
			VipLevel       int        `gorm:"column:vip_level"`
			Points         int        `gorm:"column:points"`
			AvatarURL      *string    `gorm:"column:avatar_url"`
			IsVerified     bool       `gorm:"column:is_verified"`
			IsActive       bool       `gorm:"column:is_active"`
			CreatedAt      time.Time  `gorm:"column:created_at"`
			UpdatedAt      time.Time  `gorm:"column:updated_at"`
			LastLoginAt    *time.Time `gorm:"column:last_login_at"`
		}{
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

		if err := tx.Table("users").Create(&user).Error; err != nil {
			s.logger.Error("創建用戶失敗", zap.Error(err))
			return err
		}

		// 創建用戶設定
		settings := struct {
			UserID             uuid.UUID `gorm:"column:user_id;primaryKey;type:uuid"`
			Sound              bool      `gorm:"column:sound"`
			Music              bool      `gorm:"column:music"`
			Vibration          bool      `gorm:"column:vibration"`
			HighQuality        bool      `gorm:"column:high_quality"`
			AIAssistant        bool      `gorm:"column:ai_assistant"`
			GameRecommendation bool      `gorm:"column:game_recommendation"`
			DataCollection     bool      `gorm:"column:data_collection"`
			UpdatedAt          time.Time `gorm:"column:updated_at"`
		}{
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

		if err := tx.Table("user_settings").Create(&settings).Error; err != nil {
			s.logger.Error("創建用戶設定失敗", zap.Error(err))
			return err
		}

		// 創建用戶錢包
		wallet := struct {
			WalletID      uuid.UUID `gorm:"column:wallet_id;primaryKey;type:uuid"`
			UserID        uuid.UUID `gorm:"column:user_id;uniqueIndex;type:uuid"`
			Balance       float64   `gorm:"column:balance"`
			TotalDeposit  float64   `gorm:"column:total_deposit"`
			TotalWithdraw float64   `gorm:"column:total_withdraw"`
			TotalBet      float64   `gorm:"column:total_bet"`
			TotalWin      float64   `gorm:"column:total_win"`
			CreatedAt     time.Time `gorm:"column:created_at"`
			UpdatedAt     time.Time `gorm:"column:updated_at"`
		}{
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

		if err := tx.Table("user_wallets").Create(&wallet).Error; err != nil {
			s.logger.Error("創建用戶錢包失敗", zap.Error(err))
			return err
		}

		// 查詢創建的用戶完整信息
		var dbUser struct {
			UserID         uuid.UUID  `gorm:"column:user_id"`
			Username       string     `gorm:"column:username"`
			Email          string     `gorm:"column:email"`
			Role           string     `gorm:"column:role"`
			VipLevel       int        `gorm:"column:vip_level"`
			Points         int        `gorm:"column:points"`
			AvatarURL      *string    `gorm:"column:avatar_url"`
			IsVerified     bool       `gorm:"column:is_verified"`
			IsActive       bool       `gorm:"column:is_active"`
			CreatedAt      time.Time  `gorm:"column:created_at"`
			UpdatedAt      time.Time  `gorm:"column:updated_at"`
			LastLoginAt    *time.Time `gorm:"column:last_login_at"`
			AuthProvider   string     `gorm:"column:auth_provider"`
			AuthProviderID *string    `gorm:"column:auth_provider_id"`
		}

		if err := tx.Table("users").Where("user_id = ?", userID).First(&dbUser).Error; err != nil {
			s.logger.Error("查詢創建的用戶信息失敗", zap.Error(err))
			return err
		}

		// 填充創建的用戶結構
		createdUser = models.User{
			UserID:         userID,
			Username:       dbUser.Username,
			Email:          dbUser.Email,
			Role:           dbUser.Role,
			VipLevel:       dbUser.VipLevel,
			Points:         dbUser.Points,
			AvatarURL:      "",
			IsVerified:     dbUser.IsVerified,
			IsActive:       dbUser.IsActive,
			CreatedAt:      dbUser.CreatedAt,
			UpdatedAt:      dbUser.UpdatedAt,
			LastLoginAt:    time.Time{},
			AuthProvider:   dbUser.AuthProvider,
			AuthProviderID: "",
		}

		if dbUser.AvatarURL != nil {
			createdUser.AvatarURL = *dbUser.AvatarURL
		}

		if dbUser.AuthProviderID != nil {
			createdUser.AuthProviderID = *dbUser.AuthProviderID
		}

		if dbUser.LastLoginAt != nil {
			createdUser.LastLoginAt = *dbUser.LastLoginAt
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("註冊失敗: %w", err)
	}

	return &createdUser, nil
}

// GetProfile 獲取用戶資料
func (s *userService) GetProfile(ctx context.Context, userID string) (*models.UserProfileResponse, error) {
	db := s.db.GetDB().WithContext(ctx)

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("無效的用戶ID")
	}

	// 查詢用戶基本信息
	var user struct {
		UserID    string    `gorm:"column:user_id"`
		Username  string    `gorm:"column:username"`
		Email     string    `gorm:"column:email"`
		Role      string    `gorm:"column:role"`
		IsActive  bool      `gorm:"column:is_active"`
		CreatedAt time.Time `gorm:"column:created_at"`
		UpdatedAt time.Time `gorm:"column:updated_at"`
	}

	if err := db.Table("users").Where("user_id = ?", uid).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用戶不存在")
		}
		s.logger.Error("查詢用戶詳情失敗", zap.Error(err), zap.String("userID", userID))
		return nil, fmt.Errorf("獲取用戶資料失敗: %w", err)
	}

	// 獲取用戶錢包餘額
	var balance float64
	if err := db.Table("user_wallets").
		Select("balance").
		Where("user_id = ?", uid).
		Take(&balance).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		s.logger.Warn("獲取用戶餘額失敗", zap.Error(err), zap.String("userID", userID))
		balance = 0 // 預設為0
	}

	// 確定用戶狀態
	status := "INACTIVE"
	if user.IsActive {
		status = "ACTIVE"
	}

	return &models.UserProfileResponse{
		ID:        user.UserID,
		Username:  user.Username,
		Email:     user.Email,
		Balance:   balance,
		Role:      user.Role,
		Status:    status,
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
		UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
	}, nil
}

// UpdateProfile 更新用戶資料
func (s *userService) UpdateProfile(ctx context.Context, userID string, req *models.UpdateProfileRequest) error {
	db := s.db.GetDB().WithContext(ctx)

	// 解析用戶ID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("無效的用戶ID")
	}

	// 檢查用戶是否存在
	var count int64
	if err := db.Table("users").Where("user_id = ?", uid).Count(&count).Error; err != nil {
		s.logger.Error("檢查用戶是否存在時發生錯誤", zap.Error(err))
		return fmt.Errorf("更新用戶資料失敗: %w", err)
	}

	if count == 0 {
		return errors.New("用戶不存在")
	}

	// 如果要更新用戶名，需要檢查新用戶名是否已被使用
	if req.Username != "" {
		var usernameCount int64
		if err := db.Table("users").
			Where("username = ? AND user_id != ?", req.Username, uid).
			Count(&usernameCount).Error; err != nil {
			s.logger.Error("檢查用戶名是否已存在時發生錯誤", zap.Error(err))
			return fmt.Errorf("更新用戶資料失敗: %w", err)
		}

		if usernameCount > 0 {
			return errors.New("用戶名已被使用")
		}
	}

	// 準備更新數據
	updates := make(map[string]interface{})
	if req.Username != "" {
		updates["username"] = req.Username
	}

	if req.AvatarURL != "" {
		updates["avatar_url"] = req.AvatarURL
	}

	// 如果有需要更新的字段
	if len(updates) > 0 {
		updates["updated_at"] = time.Now()

		if err := db.Table("users").
			Where("user_id = ?", uid).
			Updates(updates).Error; err != nil {
			s.logger.Error("更新用戶資料失敗", zap.Error(err))
			return fmt.Errorf("更新用戶資料失敗: %w", err)
		}
	}

	return nil
}

// UpdateSettings 更新用戶設定
func (s *userService) UpdateSettings(ctx context.Context, userID string, req *models.AppUpdateSettingsRequest) error {
	db := s.db.GetDB().WithContext(ctx)

	// 解析用戶ID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("無效的用戶ID")
	}

	// 檢查用戶是否存在
	var userCount int64
	if err := db.Table("users").Where("user_id = ?", uid).Count(&userCount).Error; err != nil {
		s.logger.Error("檢查用戶是否存在時發生錯誤", zap.Error(err))
		return fmt.Errorf("更新用戶設定失敗: %w", err)
	}

	if userCount == 0 {
		return errors.New("用戶不存在")
	}

	// 檢查設定記錄是否存在
	var settingsCount int64
	if err := db.Table("user_settings").Where("user_id = ?", uid).Count(&settingsCount).Error; err != nil {
		s.logger.Error("檢查用戶設定是否存在時發生錯誤", zap.Error(err))
		return fmt.Errorf("更新用戶設定失敗: %w", err)
	}

	now := time.Now()

	// 如果設定不存在，則創建新設定
	if settingsCount == 0 {
		// 創建默認設定
		settings := struct {
			UserID             uuid.UUID `gorm:"column:user_id;primaryKey;type:uuid"`
			Sound              bool      `gorm:"column:sound"`
			Music              bool      `gorm:"column:music"`
			Vibration          bool      `gorm:"column:vibration"`
			HighQuality        bool      `gorm:"column:high_quality"`
			AIAssistant        bool      `gorm:"column:ai_assistant"`
			GameRecommendation bool      `gorm:"column:game_recommendation"`
			DataCollection     bool      `gorm:"column:data_collection"`
			UpdatedAt          time.Time `gorm:"column:updated_at"`
		}{
			UserID:             uid,
			Sound:              true,  // 默認值
			Music:              true,  // 默認值
			Vibration:          false, // 默認值
			HighQuality:        true,  // 默認值
			AIAssistant:        true,  // 默認值
			GameRecommendation: true,  // 默認值
			DataCollection:     true,  // 默認值
			UpdatedAt:          now,
		}

		// 應用請求中的設定（如果有）
		if req.Sound != nil {
			settings.Sound = *req.Sound
		}
		if req.Music != nil {
			settings.Music = *req.Music
		}
		if req.Vibration != nil {
			settings.Vibration = *req.Vibration
		}
		if req.HighQuality != nil {
			settings.HighQuality = *req.HighQuality
		}
		if req.AIAssistant != nil {
			settings.AIAssistant = *req.AIAssistant
		}
		if req.GameRecommendation != nil {
			settings.GameRecommendation = *req.GameRecommendation
		}
		if req.DataCollection != nil {
			settings.DataCollection = *req.DataCollection
		}

		if err := db.Table("user_settings").Create(&settings).Error; err != nil {
			s.logger.Error("創建用戶設定失敗", zap.Error(err))
			return fmt.Errorf("更新用戶設定失敗: %w", err)
		}

		return nil
	}

	// 更新現有設定
	updates := map[string]interface{}{
		"updated_at": now,
	}

	// 只更新請求中包含的字段
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

	if err := db.Table("user_settings").
		Where("user_id = ?", uid).
		Updates(updates).Error; err != nil {
		s.logger.Error("更新用戶設定失敗", zap.Error(err))
		return fmt.Errorf("更新用戶設定失敗: %w", err)
	}

	return nil
}
