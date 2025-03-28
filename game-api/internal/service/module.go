package service

import (
	"game-api/internal/interfaces"
	"game-api/pkg/databaseManager"
	"game-api/pkg/logger"

	"go.uber.org/fx"
)

// Module 服務模組
var Module = fx.Options(
	fx.Provide(NewAuthService),
	fx.Provide(NewUserService),
	fx.Provide(NewBetService),
	fx.Provide(NewAdminService),
	fx.Provide(
		func(db databaseManager.DatabaseManager, logger logger.Logger) interfaces.GameService {
			return NewGameService(db.GetDB(), logger)
		},
	),
)
