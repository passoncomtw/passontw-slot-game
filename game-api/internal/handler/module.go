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
	fx.Invoke(registerRoutes),
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

// registerRoutes 註冊路由到 Gin Engine
func registerRoutes(router *gin.Engine, authHandler *AuthHandler, userHandler *UserHandler) {
	// API 路由群組
	api := router.Group("/api")
	{
		// 認證相關路由
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.AppLogin)
			// auth.POST("/register", authHandler.Register) // 待實現
		}

		// 管理員路由群組
		admin := api.Group("/admin")
		{
			// 管理員認證
			admin.POST("/auth/login", authHandler.AdminLogin)
		}
	}

	// 健康檢查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// Swagger API 文檔
	// router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}
