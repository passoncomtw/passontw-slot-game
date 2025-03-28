package handler

import (
	"fmt"
	"net/http"

	"game-api/internal/config"
	"game-api/internal/interfaces"
	"game-api/internal/middleware"
	"game-api/pkg/websocketManager"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type SuccessResponse struct {
	Message string `json:"message"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func NewRouter(
	cfg *config.Config,
	authHandler *AuthHandler,
	userHandler *UserHandler,
	betHandler *BetHandler,
	adminHandler *AdminHandler,
	authService interfaces.AuthService,
	wsHandler *websocketManager.WebSocketHandler,
) *gin.Engine {
	r := gin.Default()
	r.Use(configureCORS())
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, SuccessResponse{Message: "Service is healthy"})
	})

	r.GET("/ws", wsHandler.HandleConnection)

	api := r.Group("/api/v1")
	{
		// 公開路由
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		// 用戶公開路由
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

	adminGroup := r.Group("/api/admin")
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

	return r
}

func configureCORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func StartServer(
	cfg *config.Config,
	router *gin.Engine,
	authHandler *AuthHandler,
	userHandler *UserHandler,
	betHandler *BetHandler,
	adminHandler *AdminHandler,
	wsHandler *websocketManager.WebSocketHandler,
) {
	// 配置路由
	router.Use(configureCORS())
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, SuccessResponse{Message: "Service is healthy"})
	})

	router.GET("/ws", wsHandler.HandleConnection)

	api := router.Group("/api/v1")
	{
		// 公開路由
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		// 用戶公開路由
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

	// 添加管理員路由
	admin := router.Group("/api/admin")
	{
		// 公開路由
		admin.POST("/login", adminHandler.AdminLogin)

		// 需要認證的路由
		authorized := admin.Group("/")
		authorized.Use(authHandler.AuthMiddleware()) // 使用現有的 AuthHandler 中間件
		{
			// 用戶管理
			userGroup := authorized.Group("/users")
			{
				userGroup.GET("/", adminHandler.GetUserList)
				userGroup.POST("/status", adminHandler.ChangeUserStatus)
				userGroup.POST("/deposit", adminHandler.DepositForUser)
			}
		}
	}

	// 服務已設置，但不在這裡啟動，而是讓RouterModule負責啟動
	fmt.Printf("服務器已配置，包括Swagger UI (http://%s:%d/swagger/index.html)\n", cfg.Server.Host, cfg.Server.Port)
}
