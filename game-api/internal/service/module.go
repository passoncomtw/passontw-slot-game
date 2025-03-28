package service

import (
	"go.uber.org/fx"
)

// Module 服務模組
var Module = fx.Options(
	fx.Provide(NewAuthService),
	fx.Provide(NewUserService),
	fx.Provide(NewBetService),
	fx.Provide(NewAdminService),
)
