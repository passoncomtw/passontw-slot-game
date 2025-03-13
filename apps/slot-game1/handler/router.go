package handler

import (
	"fmt"
	"passontw-slot-game/apps/slot-game1/config"
	"passontw-slot-game/apps/slot-game1/middleware"
	redis "passontw-slot-game/pkg/redisManager"

	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func NewRouter(
	cfg *config.Config,
	helloHandler *HelloHandler,
	gameHandler *GameHandler,
	orderHandler *OrderHandler,
	wsHandler *WebSocketHandler,
	redisManager redis.RedisManager,
) *gin.Engine {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.Use(middleware.Logger())

	router.GET("/api-docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	router.GET("/hello", helloHandler.HelloWorld)
	router.GET("/ws", wsHandler.HandleWebSocket)
	router.POST("/game/spin", gameHandler.GetGameSpin)

	// API 路由組
	v1 := router.Group("/api/v1")
	{
		// 認證相關路由已移至 auth-service

		authorized := v1.Group("")
		authorized.Use(middleware.AuthMiddleware(cfg, redisManager))
		{
			authorized.POST("/orders", orderHandler.CreateOrder)
		}
	}

	return router
}

func StartServer(router *gin.Engine, cfg *config.Config) {
	Server_Port := fmt.Sprintf(":%d", cfg.Server.Port)
	router.Run(Server_Port)
}
