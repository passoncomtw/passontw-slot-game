package main

import (
	"fmt"
	"log"
	"passontw-slot-game/apps/slot-game1/config"
	"passontw-slot-game/apps/slot-game1/docs"
	"passontw-slot-game/apps/slot-game1/handler"
	"passontw-slot-game/apps/slot-game1/pkg/database"
	"passontw-slot-game/apps/slot-game1/pkg/logger"
	"passontw-slot-game/apps/slot-game1/service"

	redis "passontw-slot-game/pkg/redisManager"
	"passontw-slot-game/pkg/utils"

	_ "passontw-slot-game/apps/slot-game1/docs" // 導入 swagger docs

	"go.uber.org/fx"
)

// @title           Passontw Slot Game API
// @description     Passontw Slot Game API.
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

// @BasePath  /
func main() {
	cfg, cfgerror := config.LoadConfigFromNacos()

	if cfgerror != nil {
		fmt.Printf("get nacos config error: %v", cfgerror)
		return
	}

	docs.SwaggerInfo.Host = cfg.Server.APIHost
	docs.SwaggerInfo.Version = cfg.Server.Version

	err := utils.InitSnowflake(1) // 使用一個合適的 worker ID
	if err != nil {
		log.Fatalf("Failed to initialize Snowflake: %v", err)
	}

	app := fx.New(
		fx.Provide(
			func() *config.Config {
				return cfg
			},
			redis.ProvideRedisConfig,
			redis.ProvideRedisClient,
			redis.ProvideRedisManager,
			logger.NewLogger,
			database.NewDatabase,
			service.NewOrderService,
			service.NewGameService,
			service.NewHelloService,
			service.NewAuthService,
			service.NewCheckerService,
			service.NewBalanceService,
			fx.Annotate(
				service.NewUserService,
				fx.As(new(service.UserService)),
			),
			handler.NewHelloHandler,
			handler.NewOrderHandler,
			handler.NewGameHandler,
			handler.NewAuthHandler,
			handler.NewUserHandler,
			handler.NewWebSocketHandler,
			handler.NewRouter,
		),
		fx.Invoke(handler.StartServer),
	)

	app.Run()
}
