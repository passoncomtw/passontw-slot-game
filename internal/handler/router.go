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
) *gin.Engine {
	router := gin.Default()

	// 添加全局中間件
	router.Use(middleware.Logger())

	// Swagger UI
	router.GET("/api-docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	router.GET("/hello", helloHandler.HelloWorld)

	// API 路由組
	v1 := router.Group("/api/v1")
	{
		v1.GET("/users", userHandler.GetUsers)
		v1.POST("/auth", authHandler.userLogin)
		v1.POST("/users", userHandler.CreateUser)
	}

	return router
}

func StartServer(router *gin.Engine, cfg *config.Config) {
	router.Run(cfg.Server.Port)
}
