package handler

import (
	"passontw-slot-game/internal/config"
	"passontw-slot-game/internal/middleware"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	cfg *config.Config,
	helloHandler *HelloHandler,
) *gin.Engine {
	router := gin.Default()

	// 添加全局中間件
	router.Use(middleware.Logger())

	// API 路由組
	v1 := router.Group("/api/v1")
	{
		v1.GET("/hello", helloHandler.HelloWorld)
	}

	return router
}

func StartServer(router *gin.Engine, cfg *config.Config) {
	router.Run(cfg.Server.Port)
}
