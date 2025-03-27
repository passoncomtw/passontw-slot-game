package service

import (
	"context"
	"errors"
	"game-api/internal/config"
	"game-api/internal/domain/entity"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AuthService 認證服務實現
type AuthService struct {
	config *config.Config
	db     *gorm.DB
	logger *zap.Logger
}

// NewAuthService 創建認證服務
func NewAuthService(cfg *config.Config, db *gorm.DB, logger *zap.Logger) interfaces.AuthService {
	return &AuthService{
		config: cfg,
		db:     db,
		logger: logger,
	}
}

// AppLogin App用戶登入
func (s *AuthService) AppLogin(ctx context.Context, req models.AppLoginRequest) (*models.LoginResponse, error) {
	var user entity.AppUser

	// 查詢用戶
	result := s.db.Where("username = ?", req.Username).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("用戶名或密碼錯誤")
		}
		return nil, result.Error
	}

	// 檢查用戶狀態
	if !user.IsActive {
		return nil, errors.New("帳號已被凍結")
	}

	// 驗證密碼
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("用戶名或密碼錯誤")
	}

	// 更新最後登入時間
	now := time.Now()
	user.LastLogin = &now
	s.db.Model(&user).Update("last_login_at", now)

	// 生成令牌
	tokenData := models.TokenData{
		UserID: user.ID,
		Role:   string(user.Role),
	}

	token, expiresIn, err := s.GenerateToken(tokenData)
	if err != nil {
		return nil, err
	}

	return &models.LoginResponse{
		Token:     token,
		TokenType: "Bearer",
		ExpiresIn: expiresIn,
	}, nil
}

// AdminLogin 管理員登入
func (s *AuthService) AdminLogin(ctx context.Context, req models.AdminLoginRequest) (*models.LoginResponse, error) {
	var admin entity.Admin

	// 查詢管理員
	result := s.db.Where("email = ? AND role = 'admin'", req.Email).First(&admin)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("電子郵件或密碼錯誤")
		}
		return nil, result.Error
	}

	// 檢查管理員狀態
	if !admin.IsActive {
		return nil, errors.New("帳號已被凍結")
	}

	// 驗證密碼
	err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("電子郵件或密碼錯誤")
	}

	// 更新最後登入時間
	now := time.Now()
	admin.LastLogin = &now
	s.db.Model(&admin).Update("last_login_at", now)

	// 生成令牌
	tokenData := models.TokenData{
		UserID: admin.ID,
		Role:   admin.Role,
	}

	token, expiresIn, err := s.GenerateToken(tokenData)
	if err != nil {
		return nil, err
	}

	return &models.LoginResponse{
		Token:     token,
		TokenType: "Bearer",
		ExpiresIn: expiresIn,
	}, nil
}

// GenerateToken 生成JWT令牌
func (s *AuthService) GenerateToken(data models.TokenData) (string, int64, error) {
	expirationTime := time.Now().Add(time.Hour * 24) // 默認24小時過期
	claims := jwt.MapClaims{
		"user_id": data.UserID,
		"role":    data.Role,
		"exp":     expirationTime.Unix(),
		"iat":     time.Now().Unix(),
		"jti":     uuid.New().String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWT.Secret))
	if err != nil {
		return "", 0, errors.New("無法生成令牌")
	}

	expiresIn := int64(expirationTime.Sub(time.Now()).Seconds())
	return tokenString, expiresIn, nil
}

// ValidateToken 驗證JWT令牌
func (s *AuthService) ValidateToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// 驗證簽名方法
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("無效的簽名方法")
		}

		return []byte(s.config.JWT.Secret), nil
	})

	if err != nil {
		return "", errors.New("無效的令牌")
	}

	// 驗證令牌格式和簽名
	if !token.Valid {
		return "", errors.New("無效的令牌")
	}

	// 獲取用戶ID
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("無效的令牌聲明")
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return "", errors.New("無效的用戶ID")
	}

	return userID, nil
}

// ParseToken 解析JWT令牌數據
func (s *AuthService) ParseToken(tokenString string) (*models.TokenData, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWT.Secret), nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("無效的令牌")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("無效的令牌聲明")
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return nil, errors.New("無效的用戶ID")
	}

	role, ok := claims["role"].(string)
	if !ok {
		return nil, errors.New("無效的角色")
	}

	return &models.TokenData{
		UserID: userID,
		Role:   role,
	}, nil
}
