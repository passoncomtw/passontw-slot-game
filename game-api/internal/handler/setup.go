package handler

import (
	"game-api/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 設置所有API路由
func SetupRoutes(router *gin.Engine, authHandler *AuthHandler, userHandler *UserHandler) {
	// 註冊認證路由
	api := router.Group("/api")

	// App用戶認證
	api.POST("/auth/login", authHandler.AppLogin)

	// 管理員認證
	admin := api.Group("/admin")
	admin.POST("/auth/login", authHandler.AdminLogin)

	// 需要認證的管理員路由
	adminAuth := admin.Group("")
	adminAuth.Use(middleware.AuthMiddleware(userHandler.authService))
	{
		adminAuth.GET("/users", userHandler.GetUsers)
		adminAuth.GET("/users/:user_id", userHandler.GetUserByID)
		adminAuth.POST("/users", userHandler.CreateUser)
		adminAuth.POST("/users/deposit", userHandler.DepositToUser)
		adminAuth.PUT("/users/status", userHandler.ChangeUserStatus)
	}
}
