package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"game-api/internal/config"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/databaseManager"
	"game-api/pkg/logger"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AuthService 提供身份驗證功能
type AuthService struct {
	config *config.Config
	log    logger.Logger
	db     databaseManager.DatabaseManager
}

// NewAuthService 創建一個新的 AuthService 實例
func NewAuthService(config *config.Config, log logger.Logger, db databaseManager.DatabaseManager) interfaces.AuthService {
	return &AuthService{
		config: config,
		log:    log,
		db:     db,
	}
}

// AdminLogin 管理員登入功能
func (s *AuthService) AdminLogin(ctx context.Context, req models.AdminLoginRequest) (*models.LoginResponse, error) {
	// 實現管理員登入邏輯
	return nil, errors.New("請使用AdminService進行管理員登入")
}

// AppLogin 處理行動應用登入，進行認證並返回JWT令牌
func (s *AuthService) AppLogin(ctx context.Context, req models.AppLoginRequest) (*models.LoginResponse, error) {
	if req.Password == "" {
		s.log.Error("密碼不能為空")
		return nil, errors.New("密碼不能為空")
	}

	s.log.Info("嘗試登入", zap.Any("request", req))

	// 從資料庫查詢用戶
	db := s.db.GetDB().WithContext(ctx)
	var user struct {
		UserID       string `gorm:"column:user_id"`
		Username     string `gorm:"column:username"`
		Email        string `gorm:"column:email"`
		PasswordHash string `gorm:"column:password_hash"`
		Role         string `gorm:"column:role"`
	}

	// 建立查詢
	query := db.Table("users")

	// 添加條件
	if req.Email != "" {
		query = query.Where("email = ?", req.Email)
	}

	// 執行查詢，確保資料返回到 user 結構中
	result := query.First(&user)
	if err := result.Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			s.log.Warn("使用者不存在", zap.String("email", req.Email))
			return nil, errors.New("使用者不存在")
		}
		s.log.Error("查詢使用者失敗", zap.Error(err))
		return nil, fmt.Errorf("查詢使用者失敗: %w", err)
	}

	// 檢查是否有找到記錄
	if result.RowsAffected == 0 {
		s.log.Warn("未找到用戶記錄")
		return nil, errors.New("使用者不存在")
	}

	// 確保用戶ID不為空
	if user.UserID == "" {
		s.log.Error("查詢到的用戶ID為空")
		return nil, errors.New("使用者不存在")
	}

	// 驗證密碼
	if !s.verifyPassword(user.PasswordHash, req.Password) {
		s.log.Warn("密碼不正確", zap.String("userID", user.UserID))
		return nil, errors.New("密碼不正確")
	}

	// 生成 JWT token
	tokenData := models.TokenData{
		UserID: user.UserID,
		Role:   user.Role,
	}

	token, expiry, err := s.GenerateToken(tokenData)
	if err != nil {
		s.log.Error("創建令牌失敗", zap.Error(err))
		return nil, err
	}

	// 更新最後登入時間
	updateResult := db.Table("users").Where("user_id = ?", user.UserID).
		Update("last_login_at", time.Now())
	if err := updateResult.Error; err != nil {
		s.log.Warn("更新最後登入時間失敗", zap.Error(err), zap.String("userID", user.UserID))
	}

	s.log.Info("登入成功", zap.String("userID", user.UserID), zap.String("username", user.Username))
	return &models.LoginResponse{
		Token:     token,
		TokenType: "Bearer",
		ExpiresIn: expiry,
	}, nil
}

// 驗證密碼
func (s *AuthService) verifyPassword(hashedPassword, plainPassword string) bool {
	// 使用 bcrypt 進行密碼驗證
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
	return err == nil
}

// Claims 是 JWT 的標準聲明
type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.StandardClaims
}

// GenerateToken 生成 JWT 令牌
func (s *AuthService) GenerateToken(data models.TokenData) (string, int64, error) {
	expirationTime := time.Now().Add(time.Duration(s.config.JWT.TokenExpiration) * time.Second)
	expiresAt := expirationTime.Unix()

	claims := &Claims{
		UserID: data.UserID,
		Role:   data.Role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expiresAt,
			IssuedAt:  time.Now().Unix(),
			Id:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWT.SecretKey))
	if err != nil {
		s.log.Error("生成令牌失敗", zap.Error(err))
		return "", 0, err
	}

	return tokenString, expiresAt, nil
}

// ValidateToken 驗證 JWT 令牌
func (s *AuthService) ValidateToken(token string) (string, error) {
	claims := &Claims{}
	parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("意外的簽名方法: %v", token.Header["alg"])
		}
		return []byte(s.config.JWT.SecretKey), nil
	})

	if err != nil {
		return "", err
	}

	if !parsedToken.Valid {
		return "", errors.New("無效的令牌")
	}

	return claims.UserID, nil
}

// ValidateAdminToken 驗證管理員 JWT 令牌
func (s *AuthService) ValidateAdminToken(token string) (string, error) {
	claims := &Claims{}
	parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("意外的簽名方法: %v", token.Header["alg"])
		}
		return []byte(s.config.JWT.AdminSecretKey), nil
	})

	if err != nil {
		return "", err
	}

	if !parsedToken.Valid {
		return "", errors.New("無效的令牌")
	}

	return claims.UserID, nil
}

// ParseToken 解析 JWT 令牌數據
func (s *AuthService) ParseToken(token string) (*models.TokenData, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("意外的簽名方法: %v", token.Header["alg"])
		}
		return []byte(s.config.JWT.SecretKey), nil
	})

	if err != nil {
		return nil, err
	}

	return &models.TokenData{
		UserID: claims.UserID,
		Role:   claims.Role,
	}, nil
}

// ParseAdminToken 解析管理員 JWT 令牌數據
func (s *AuthService) ParseAdminToken(token string) (*models.TokenData, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("意外的簽名方法: %v", token.Header["alg"])
		}
		return []byte(s.config.JWT.AdminSecretKey), nil
	})

	if err != nil {
		return nil, err
	}

	return &models.TokenData{
		UserID: claims.UserID,
		Role:   claims.Role,
	}, nil
}

// Login 簡易登入方法，直接返回 token
func (s *AuthService) Login(identifier string, password string) (string, error) {
	ctx := context.Background()

	// 判斷是否為 email (包含 @ 符號)
	req := models.AppLoginRequest{
		Password: password,
	}

	// 如果包含 @ 符號，視為 email
	if s.isEmail(identifier) {
		req.Email = identifier
	}

	response, err := s.AppLogin(ctx, req)
	if err != nil {
		return "", err
	}

	return response.Token, nil
}

// isEmail 檢查是否為 email 格式 (簡單判斷是否含有 @ 符號)
func (s *AuthService) isEmail(str string) bool {
	return strings.Contains(str, "@")
}

// GetUserProfile 獲取用戶個人資料
func (s *AuthService) GetUserProfile(ctx context.Context, userID string) (*models.UserProfileResponse, error) {
	// 從資料庫查詢用戶資料
	db := s.db.GetDB().WithContext(ctx)

	var user struct {
		UserID    string    `gorm:"column:user_id"`
		Username  string    `gorm:"column:username"`
		Email     string    `gorm:"column:email"`
		Role      string    `gorm:"column:role"`
		IsActive  bool      `gorm:"column:is_active"`
		CreatedAt time.Time `gorm:"column:created_at"`
		UpdatedAt time.Time `gorm:"column:updated_at"`
	}

	// 查詢用戶資料
	if err := db.Table("users").Where("user_id = ?", userID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用戶不存在")
		}
		return nil, fmt.Errorf("查詢用戶資料失敗: %w", err)
	}

	// 查詢用戶錢包資料
	var wallet struct {
		Balance float64 `gorm:"column:balance"`
	}

	if err := db.Table("user_wallets").Where("user_id = ?", userID).First(&wallet).Error; err != nil {
		// 如果找不到錢包，默認餘額為0
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			s.log.Warn("查詢用戶錢包失敗", zap.Error(err), zap.String("userID", userID))
		}
	}

	// 構建並返回用戶資料
	status := "ACTIVE"
	if !user.IsActive {
		status = "INACTIVE"
	}

	return &models.UserProfileResponse{
		ID:        user.UserID,
		Username:  user.Username,
		Email:     user.Email,
		Balance:   wallet.Balance,
		Role:      user.Role,
		Status:    status,
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
		UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
	}, nil
}

// RevokeToken 撤銷 JWT 令牌
func (s *AuthService) RevokeToken(token string) error {
	// 實現撤銷令牌的邏輯，可能需要將令牌添加到黑名單中
	// 這裡只是一個示例，實際實現可能需要使用 Redis 或數據庫來存儲已撤銷的令牌
	s.log.Info("令牌撤銷", zap.String("token", token))
	return nil
}
