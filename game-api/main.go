package main

import (
	"game-api/internal/config"
	"game-api/internal/handler"
	"game-api/internal/service"
	"log"

	_ "game-api/docs"
	"game-api/pkg/core"
	"game-api/pkg/utils"

	"go.uber.org/fx"
)

// @title           Slot Game Service API
// @description     Slot Game Service API Documentation
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

// @BasePath  /api
// @tag.name games
// @tag.description 遊戲相關 API
// @tag.name wallet
// @tag.description 錢包與交易相關 API
// @tag.name user
// @tag.description 用戶相關 API
// @tag.name auth
// @tag.description 認證相關 API

func main() {
	if err := utils.InitSnowflake(2); err != nil {
		log.Fatalf("Failed to initialize Snowflake: %v", err)
	}

	app := fx.New(
		config.Module,
		service.Module,
		core.Module,
		handler.Module,
	)

	app.Run()
}
