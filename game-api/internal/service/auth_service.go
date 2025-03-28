package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"game-api/internal/config"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// AuthService 提供身份驗證功能
type AuthService struct {
	config *config.Config
	log    logger.Logger
}

// NewAuthService 創建一個新的 AuthService 實例
func NewAuthService(config *config.Config, log logger.Logger) interfaces.AuthService {
	return &AuthService{
		config: config,
		log:    log,
	}
}

// AdminLogin 管理員登入功能
func (s *AuthService) AdminLogin(ctx context.Context, req models.AdminLoginRequest) (*models.LoginResponse, error) {
	// 實現管理員登入邏輯
	return nil, errors.New("請使用AdminService進行管理員登入")
}

// AppLogin 應用登入功能
func (s *AuthService) AppLogin(ctx context.Context, req models.AppLoginRequest) (*models.LoginResponse, error) {
	// 實現應用登入邏輯
	return nil, errors.New("請實現應用登入邏輯")
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

// RevokeToken 撤銷 JWT 令牌
func (s *AuthService) RevokeToken(token string) error {
	// 實現撤銷令牌的邏輯，可能需要將令牌添加到黑名單中
	// 這裡只是一個示例，實際實現可能需要使用 Redis 或數據庫來存儲已撤銷的令牌
	s.log.Info("令牌撤銷", zap.String("token", token))
	return nil
}
