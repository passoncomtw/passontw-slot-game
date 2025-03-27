package handler

import (
	"game-api/internal/interfaces"

	"github.com/gin-gonic/gin"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// Module 處理程序模組
var Module = fx.Options(
	fx.Provide(
		provideAuthHandler,
		provideUserHandler,
	),
	fx.Invoke(setupRouters),
)

// provideAuthHandler 提供認證處理程序
func provideAuthHandler(authService interfaces.AuthService, logger *zap.Logger) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		logger:      logger,
	}
}

// provideUserHandler 提供用戶處理程序
func provideUserHandler(userService interfaces.UserService, authService interfaces.AuthService, logger *zap.Logger) *UserHandler {
	return &UserHandler{
		userService: userService,
		authService: authService,
		logger:      logger,
	}
}

// setupRouters 設置路由
func setupRouters(router *gin.Engine, authHandler *AuthHandler, userHandler *UserHandler) {
	SetupRoutes(router, authHandler, userHandler)
}
