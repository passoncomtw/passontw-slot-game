package routes

import (
	"game-api/internal/handler"
	"game-api/internal/interfaces"
	"game-api/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupAdminRoutes 設置後台管理路由
func SetupAdminRoutes(router *gin.Engine, adminHandler *handler.AdminHandler, authService interfaces.AuthService) {
	// 管理員API組
	adminGroup := router.Group("/api/admin")
	{
		// 公開路由
		adminGroup.POST("/login", adminHandler.AdminLogin)

		// 需要認證的路由
		authorized := adminGroup.Group("/")
		authorized.Use(middleware.AdminAuthMiddleware(authService))
		{
			// 用戶管理
			userGroup := authorized.Group("/users")
			{
				userGroup.GET("/", adminHandler.GetUserList)
				userGroup.POST("/status", adminHandler.ChangeUserStatus)
				userGroup.POST("/deposit", adminHandler.DepositForUser)
			}

			// 可以添加更多後台管理功能路由，例如：
			// - 遊戲管理
			// - 活動管理
			// - 數據統計
			// - 系統設置
		}
	}
}
