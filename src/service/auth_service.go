package service

import (
	"errors"
	redis "passontw-slot-game/pkg/redisManager"
	"passontw-slot-game/src/config"
	"time"

	"context"

	"github.com/golang-jwt/jwt/v5"
)

type AuthService interface {
	Login(username, password string) (string, error)
	Logout(token string) error
	ValidateToken(token string) (uint, error)
}

type authService struct {
	userService UserService
	config      *config.Config
	redisClient redis.RedisManager
}

func NewAuthService(userService UserService, config *config.Config, redisClient redis.RedisManager) AuthService {
	return &authService{
		userService: userService,
		config:      config,
		redisClient: redisClient,
	}
}

func (s *authService) Login(username, password string) (string, error) {
	// 使用用戶服務驗證憑據並獲取 JWT
	token, err := s.userService.Login(username, password)
	if err != nil {
		return "", err
	}
	return token, nil
}

func (s *authService) Logout(token string) error {
	// 添加令牌到黑名單（Redis）
	// 解析令牌以獲取過期時間
	claims := jwt.MapClaims{}
	_, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWT.Secret), nil
	})

	if err != nil {
		// 即使解析失敗，我們仍然可以將令牌添加到黑名單
		// 使用默認的過期時間
		err = s.redisClient.Set(context.Background(), "blacklist:"+token, "true", s.config.JWT.ExpiresIn)
		return err
	}

	// 從聲明中獲取過期時間
	if exp, ok := claims["exp"].(float64); ok {
		expTime := time.Unix(int64(exp), 0)
		ttl := time.Until(expTime)
		if ttl > 0 {
			err = s.redisClient.Set(context.Background(), "blacklist:"+token, "true", ttl)
			return err
		}
	}

	// 如果無法從聲明中獲取有效的過期時間，使用默認過期時間
	err = s.redisClient.Set(context.Background(), "blacklist:"+token, "true", s.config.JWT.ExpiresIn)
	return err
}

func (s *authService) ValidateToken(token string) (uint, error) {
	// 檢查令牌是否在黑名單中
	exists, err := s.redisClient.Exists(context.Background(), "blacklist:"+token)
	if err != nil {
		return 0, err
	}
	if exists {
		return 0, errors.New("令牌已被撤銷")
	}

	// 解析令牌
	claims := jwt.MapClaims{}
	_, err = jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWT.Secret), nil
	})

	if err != nil {
		return 0, err
	}

	// 檢查令牌是否過期
	if exp, ok := claims["exp"].(float64); ok {
		if float64(time.Now().Unix()) > exp {
			return 0, errors.New("令牌已過期")
		}
	}

	// 獲取用戶 ID
	if sub, ok := claims["sub"].(float64); ok {
		return uint(sub), nil
	}

	return 0, errors.New("無效的令牌聲明")
}
