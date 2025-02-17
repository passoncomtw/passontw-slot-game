package handler

import (
	"passontw-slot-game/internal/config"
	"passontw-slot-game/internal/middleware"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func NewRouter(
	cfg *config.Config,
	helloHandler *HelloHandler,
	authHandler *AuthHandler,
	userHandler *UserHandler,
	wsHandler *WebSocketHandler,
) *gin.Engine {
	router := gin.Default()

	// 添加全局中間件
	router.Use(middleware.Logger())

	// Swagger UI
	router.GET("/api-docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	router.GET("/hello", helloHandler.HelloWorld)
	router.GET("/ws", wsHandler.HandleWebSocket)

	// API 路由組
	v1 := router.Group("/api/v1")
	{
		v1.POST("/auth", authHandler.userLogin)

		authorized := v1.Group("")
		authorized.Use(middleware.AuthMiddleware(cfg))
		{
			authorized.GET("/users", userHandler.GetUsers)
			authorized.POST("/users", userHandler.CreateUser)
		}
	}

	return router
}

func StartServer(router *gin.Engine, cfg *config.Config) {
	router.Run(cfg.Server.Port)
}
