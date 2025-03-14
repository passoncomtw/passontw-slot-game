package handler

import (
	"fmt"
	"net/http"
	"passontw-slot-game/src/config"
	"passontw-slot-game/src/interfaces"
	"passontw-slot-game/src/middleware"
	"passontw-slot-game/src/service"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func NewRouter(
	cfg *config.Config,
	authHandler *AuthHandler,
	userHandler *UserHandler,
	authService service.AuthService,
) *gin.Engine {
	r := gin.Default()

	// 配置 CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Swagger
	r.GET("/api-docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 健康檢查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, interfaces.SuccessResponse{Message: "Auth Service is healthy"})
	})

	// API 路由
	api := r.Group("/api/v1")
	{
		// 認證路由 - 無需認證
		api.POST("/auth", authHandler.UserLogin)

		// 用戶創建 - 無需認證
		api.POST("/users", userHandler.CreateUser)

		// 認證需要的路由
		authorized := api.Group("/")
		authorized.Use(middleware.AuthMiddleware(authService))
		{
			authorized.POST("/auth/logout", authHandler.UserLogout)
			authorized.GET("/users", userHandler.GetUsers)
		}
	}

	return r
}

func StartServer(cfg *config.Config, router *gin.Engine) {
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	router.Run(addr)
}
