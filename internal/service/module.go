package service

import (
	"game-api/internal/config"
	"game-api/internal/domain/interfaces"
	"game-api/pkg/databaseManager"
	"game-api/pkg/logger"

	"go.uber.org/fx"
	"go.uber.org/zap"
)

// Module 服務模組
var Module = fx.Options(
	fx.Provide(
		NewUserService,
		NewBetService,
		NewJWTAuthService,
	),
)

// ProvideServices 提供所有服務的工廠函數
func ProvideServices(cfg *config.Config, db databaseManager.DatabaseManager, log logger.Logger, zapLogger *zap.Logger) (interfaces.UserService, interfaces.BetService, interfaces.AuthService) {
	return NewUserService(cfg, db, log),
		NewBetService(db, log),
		NewJWTAuthService(cfg, zapLogger)
}
