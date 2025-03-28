package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"game-api/internal/config"
	"game-api/internal/domain/entity"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/databaseManager"
	"game-api/pkg/logger"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
)

type AdminServiceImpl struct {
	db             *gorm.DB
	jwtSecret      []byte
	adminJwtSecret []byte
	accessTokenExp time.Duration
	logger         logger.Logger
}

// NewAdminService 創建新的AdminService實例
func NewAdminService(
	cfg *config.Config,
	db databaseManager.DatabaseManager,
	logger logger.Logger,
) interfaces.AdminService {
	return &AdminServiceImpl{
		db:             db.GetDB(),
		jwtSecret:      []byte(cfg.JWT.SecretKey),
		adminJwtSecret: []byte(cfg.JWT.AdminSecretKey),
		accessTokenExp: time.Duration(cfg.JWT.TokenExpiration) * time.Second,
		logger:         logger,
	}
}

// AdminLogin 處理管理員登錄
func (s *AdminServiceImpl) AdminLogin(ctx context.Context, req models.AdminLoginRequest) (*models.LoginResponse, error) {
	// 1. 通過Email查找管理員
	var admin models.Admin
	if err := s.db.Where("email = ?", req.Email).First(&admin).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("管理員不存在")
		}
		return nil, err
	}

	// 2. 驗證密碼
	err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("密碼錯誤")
	}

	// 3. 更新最後登錄時間
	now := time.Now()
	// 使用數據庫直接更新，避免結構體類型不匹配問題
	if err := s.db.Model(&admin).Update("last_login_at", now).Error; err != nil {
		return nil, fmt.Errorf("更新登錄時間失敗: %w", err)
	}

	// 4. 生成JWT令牌
	expirationTime := time.Now().Add(s.accessTokenExp)
	expiresAt := expirationTime.Unix()

	// 創建 JWT Claims
	claims := jwt.MapClaims{
		"admin_id": admin.ID,
		"email":    admin.Email,
		"role":     admin.Role,
		"exp":      expiresAt,
		"iat":      time.Now().Unix(),
		"jti":      uuid.New().String(),
	}

	// 創建 token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 簽名生成 token 字符串
	tokenString, err := token.SignedString(s.adminJwtSecret)
	if err != nil {
		return nil, fmt.Errorf("生成JWT令牌失敗: %w", err)
	}

	// 5. 構建響應
	response := &models.LoginResponse{
		Token:     tokenString,
		TokenType: "Bearer",
		ExpiresIn: int64(s.accessTokenExp.Seconds()),
	}

	return response, nil
}

// GetUserList 獲取用戶列表
func (s *AdminServiceImpl) GetUserList(ctx context.Context, req models.AdminUserListRequest) (*models.AdminUserListResponse, error) {
	var (
		users    []entity.User
		total    int64
		pageSize = req.PageSize
		offset   = (req.Page - 1) * pageSize
	)

	// 構建查詢條件
	query := s.db.Model(&entity.User{})

	// 按狀態篩選
	if req.Status != "" && req.Status != "all" {
		isActive := req.Status == "active"
		query = query.Where("deleted_at IS NULL = ?", isActive)
	}

	// 按關鍵詞搜索（用戶名、電話）
	if req.Search != "" {
		searchTerm := "%" + req.Search + "%"
		query = query.Where("name LIKE ? OR phone LIKE ?", searchTerm, searchTerm)
	}

	// 獲取總數
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// 分頁查詢
	if err := query.Limit(pageSize).Offset(offset).Find(&users).Error; err != nil {
		return nil, err
	}

	// 計算總頁數
	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)

	// 構建用戶摘要列表
	userSummaries := make([]models.AdminUserSummary, 0, len(users))
	for _, user := range users {
		status := "active"
		if user.DeletedAt != nil {
			status = "inactive"
		}

		userSummaries = append(userSummaries, models.AdminUserSummary{
			ID:        uint(user.ID),
			Username:  user.Name,
			Email:     user.Phone, // 使用電話作為郵箱（根據實體結構）
			Avatar:    "",         // 該實體沒有頭像URL字段
			Balance:   user.AvailableBalance,
			Status:    status,
			CreatedAt: user.CreatedAt.Format("2006-01-02"),
		})
	}

	// 構建響應
	response := &models.AdminUserListResponse{
		CurrentPage: req.Page,
		PageSize:    pageSize,
		TotalPages:  int(totalPages),
		Total:       total,
		Users:       userSummaries,
	}

	return response, nil
}

// ChangeUserStatus 更改用戶狀態
func (s *AdminServiceImpl) ChangeUserStatus(ctx context.Context, req models.AdminChangeUserStatusRequest) (*models.OperationResponse, error) {
	// 1. 獲取用戶ID
	userID := int(req.UserID)

	// 2. 查找用戶
	var user entity.User
	if err := s.db.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用戶不存在")
		}
		return nil, err
	}

	// 3. 更新用戶狀態
	tx := s.db.Begin()

	if req.Status == "active" {
		// 啟用用戶 - 清除刪除時間
		if err := tx.Model(&user).Update("deleted_at", nil).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	} else {
		// 禁用用戶 - 設置刪除時間
		now := time.Now()
		if err := tx.Model(&user).Update("deleted_at", now).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	// 4. 構建響應
	return &models.OperationResponse{
		Success: true,
		Message: fmt.Sprintf("用戶 %s 狀態已更新為 %s", user.Name, req.Status),
	}, nil
}

// DepositForUser 為用戶充值
func (s *AdminServiceImpl) DepositForUser(ctx context.Context, req models.AdminDepositRequest) (*models.OperationResponse, error) {
	// 1. 獲取用戶ID
	userID := int(req.UserID)

	// 2. 查找用戶
	var user entity.User
	if err := s.db.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用戶不存在")
		}
		return nil, err
	}

	// 3. 開始事務
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 4. 更新用戶餘額
	beforeBalance := user.AvailableBalance
	user.AvailableBalance += req.Amount

	// 保存用戶更新
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 5. 創建交易記錄 - 簡化處理，直接使用數據庫操作
	now := time.Now()
	transaction := entity.Transaction{
		ID:            fmt.Sprintf("%d", time.Now().UnixNano()),
		UserID:        fmt.Sprintf("%d", user.ID),
		Amount:        req.Amount,
		Type:          entity.TransactionDeposit,
		Status:        entity.StatusCompleted,
		Description:   &req.Description,
		BalanceBefore: beforeBalance,
		BalanceAfter:  user.AvailableBalance,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 6. 提交事務
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	// 7. 構建響應
	return &models.OperationResponse{
		Success: true,
		Message: fmt.Sprintf("成功為用戶 %s 充值 %.2f 元", user.Name, req.Amount),
	}, nil
}
