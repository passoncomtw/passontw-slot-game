package interfaces

import (
	"context"
)

type AuthService interface {
	// 驗證 token
	ValidateToken(ctx context.Context, token string) (string, error)

	// 生成 token
	GenerateToken(ctx context.Context, userID string) (string, error)

	// 撤銷 token
	RevokeToken(ctx context.Context, token string) error
}
