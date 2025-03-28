package service

import (
	"context"
	"errors"
	"game-api/internal/config"
	"game-api/internal/domain/interfaces"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// JWT 聲明結構
type Claims struct {
	UserID string `json:"user_id"`
	jwt.StandardClaims
}

// JWTAuthService 提供 JWT 認證服務
type JWTAuthService struct {
	config *config.Config
	logger *zap.Logger
}

// NewJWTAuthService 創建 JWT 認證服務
func NewJWTAuthService(cfg *config.Config, logger *zap.Logger) interfaces.AuthService {
	return &JWTAuthService{
		config: cfg,
		logger: logger,
	}
}

// ValidateToken 驗證 token 並返回用戶 ID
func (s *JWTAuthService) ValidateToken(ctx context.Context, tokenString string) (string, error) {
	// 從配置獲取密鑰
	secretKey := s.config.JWT.SecretKey
	if secretKey == "" {
		secretKey = "default_secret_key" // 僅用於開發環境
	}

	// 解析 token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secretKey), nil
	})

	if err != nil {
		s.logger.Error("解析 token 失敗", zap.Error(err))
		return "", err
	}

	// 驗證 token
	if !token.Valid {
		return "", errors.New("無效的 token")
	}

	// 獲取用戶 ID
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return "", errors.New("無法獲取 token 聲明")
	}

	// 檢查 token 是否過期
	if claims.ExpiresAt < time.Now().Unix() {
		return "", errors.New("token 已過期")
	}

	return claims.UserID, nil
}

// GenerateToken 為用戶生成新的 token
func (s *JWTAuthService) GenerateToken(ctx context.Context, userID string) (string, error) {
	// 從配置獲取密鑰和過期時間
	secretKey := s.config.JWT.SecretKey
	if secretKey == "" {
		secretKey = "default_secret_key" // 僅用於開發環境
	}

	expirationTime := time.Now().Add(24 * time.Hour) // 默認 24 小時
	if s.config.JWT.TokenExpiration > 0 {
		expirationTime = time.Now().Add(time.Duration(s.config.JWT.TokenExpiration) * time.Second)
	}

	// 創建 JWT 聲明
	claims := &Claims{
		UserID: userID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
			Issuer:    "game-api",
			Id:        uuid.New().String(),
		},
	}

	// 創建 token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		s.logger.Error("生成 token 失敗", zap.Error(err))
		return "", err
	}

	return tokenString, nil
}

// RevokeToken 撤銷 token
func (s *JWTAuthService) RevokeToken(ctx context.Context, tokenString string) error {
	// 在實際應用中，您可能需要將 token 添加到黑名單
	// 這裡僅為示例，實際實現可能需要使用 Redis 等快取服務存儲黑名單
	s.logger.Info("撤銷 token", zap.String("token", tokenString))
	return nil
}
