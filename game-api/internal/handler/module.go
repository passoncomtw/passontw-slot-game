package handler

import (
	"go.uber.org/fx"
)

// Module 提供所有 Handler 的 fx 模組
var Module = fx.Options(
	fx.Provide(
		NewAuthHandler,
		NewUserHandler,
		NewBetHandler,
		NewAdminHandler,
		NewGameHandler,
		NewTransactionHandler,
	),
	fx.Invoke(StartServer),
)
