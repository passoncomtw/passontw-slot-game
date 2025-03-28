package handler

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRoutes 設置所有API路由
func SetupRoutes(router *gin.Engine, authHandler *AuthHandler, userHandler *UserHandler, betHandler *BetHandler) {
	// Swagger UI
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 健康檢查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// API 路由群組
	api := router.Group("/api/v1")
	{
		// 公開路由
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		api.POST("/users", userHandler.Register)

		// 需要認證的路由
		authorized := api.Group("/")
		authorized.Use(authHandler.AuthMiddleware())
		{
			// 用戶相關
			authorized.GET("/users/profile", userHandler.GetProfile)
			authorized.PUT("/users/profile", userHandler.UpdateProfile)
			authorized.PUT("/users/settings", userHandler.UpdateSettings)

			// 投注相關
			authorized.GET("/bets/history", betHandler.GetBetHistory)
			authorized.GET("/bets/:session_id", betHandler.GetBetDetail)
		}
	}
}
