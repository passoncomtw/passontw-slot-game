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
	appHandler *AppHandler,
	adminHandler *AdminHandler,
	gameHandler *GameHandler,
	transactionHandler *TransactionHandler,
	logHandler *AdminLogHandler,
	dashboardHandler *DashboardHandler,
	wsHandler *websocketManager.WebSocketHandler,
	authService interfaces.AuthService,
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
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/register", authHandler.Register)

		// 用戶公開路由
		api.POST("/users", userHandler.Register)

		// 遊戲公開路由 (不需要認證)
		api.GET("/games", appHandler.GetGameList)
		api.GET("/games/:game_id", appHandler.GetGameDetail)

		// 需要認證的路由
		authorized := api.Group("/")
		authorized.Use(authHandler.AuthMiddleware())
		{
			// 認證相關
			authorized.GET("/auth/profile", userHandler.GetProfile)

			// 用戶相關
			authorized.GET("/users/profile", userHandler.GetProfile)
			authorized.PUT("/users/profile", userHandler.UpdateProfile)
			authorized.PUT("/users/settings", userHandler.UpdateSettings)

			// 投注相關
			authorized.GET("/bets/history", betHandler.GetBetHistory)
			authorized.GET("/bets/:session_id", betHandler.GetBetDetail)

			// 遊戲相關 (需要認證)
			authorized.POST("/games/sessions", appHandler.StartGameSession)
			authorized.POST("/games/bets", appHandler.PlaceBet)
			authorized.POST("/games/sessions/end", appHandler.EndGameSession)

			// 錢包相關
			authorized.GET("/wallet/balance", appHandler.GetWalletBalance)
			authorized.POST("/wallet/deposit", appHandler.RequestDeposit)
			authorized.POST("/wallet/withdraw", appHandler.RequestWithdraw)
			authorized.GET("/wallet/transactions", appHandler.GetTransactionHistory)
		}
	}

	// 添加管理員路由
	admin := router.Group("/api")
	{
		// 公開路由
		admin.POST("/admin/login", adminHandler.AdminLogin)

		// 需要認證的路由
		adminAuth := middleware.AdminAuthMiddleware(authService)

		// 用戶管理
		adminUsers := admin.Group("/admin/users")
		adminUsers.Use(adminAuth)
		{
			adminUsers.GET("", adminHandler.GetUserList)
			adminUsers.POST("/status", adminHandler.ChangeUserStatus)
			adminUsers.POST("/deposit", adminHandler.DepositForUser)
		}

		// 遊戲管理
		gameHandler.RegisterRoutes(admin, adminAuth)

		// 交易管理
		transactionHandler.RegisterRoutes(admin, adminAuth)

		// 操作日誌管理
		logHandler.RegisterRoutes(admin, adminAuth)

		// 儀表板管理
		dashboardHandler.RegisterRoutes(admin, adminAuth)
	}

	// 服務已設置，但不在這裡啟動，而是讓RouterModule負責啟動
	fmt.Printf("服務器已配置，包括Swagger UI (http://%s:%d/swagger/index.html)\n", cfg.Server.Host, cfg.Server.Port)
}
