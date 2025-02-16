package service

import (
	"errors"
	"passontw-slot-game/internal/config"
	"passontw-slot-game/internal/domain/entity"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AuthService interface {
	GenerateToken(user *entity.User) (string, error)
	ValidateToken(tokenString string) (*jwt.Token, error)
}

type authService struct {
	config *config.Config
}

func NewAuthService(config *config.Config) AuthService {
	return &authService{
		config: config,
	}
}

func (s *authService) GenerateToken(user *entity.User) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"name": user.Name,
		"exp":  time.Now().Add(s.config.JWT.ExpiresIn).Unix(),
	})

	return token.SignedString([]byte(s.config.JWT.Secret))
}

func (s *authService) ValidateToken(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.config.JWT.Secret), nil
	})
}
