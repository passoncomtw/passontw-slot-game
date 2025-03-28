package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"game-api/internal/config"
	"game-api/internal/domain/interfaces"
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

// Claims 是 JWT 的標準聲明
type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.StandardClaims
}

// GenerateToken 為用戶創建一個新的 JWT 令牌
func (s *AuthService) GenerateToken(ctx context.Context, userID string) (string, error) {
	expirationTime := time.Now().Add(time.Duration(s.config.JWT.TokenExpiration) * time.Second)
	claims := &Claims{
		UserID: userID,
		Role:   "user", // 預設角色
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
			Id:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWT.SecretKey))
	if err != nil {
		s.log.Error("生成令牌失敗", zap.Error(err))
		return "", err
	}

	return tokenString, nil
}

// ValidateToken 驗證並解析 JWT 令牌
func (s *AuthService) ValidateToken(ctx context.Context, tokenString string) (string, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("意外的簽名方法: %v", token.Header["alg"])
		}
		return []byte(s.config.JWT.SecretKey), nil
	})

	if err != nil {
		return "", err
	}

	if !token.Valid {
		return "", errors.New("無效的令牌")
	}

	return claims.UserID, nil
}

// RevokeToken 撤銷 JWT 令牌
func (s *AuthService) RevokeToken(ctx context.Context, token string) error {
	// 實現撤銷令牌的邏輯，可能需要將令牌添加到黑名單中
	// 這裡只是一個示例，實際實現可能需要使用 Redis 或數據庫來存儲已撤銷的令牌
	s.log.Info("令牌撤銷", zap.String("token", token))
	return nil
}
