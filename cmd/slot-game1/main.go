package main

import (
	"log"
	"passontw-slot-game/apps/slot-game1/config"
	"passontw-slot-game/apps/slot-game1/handler"
	"passontw-slot-game/apps/slot-game1/service"

	"passontw-slot-game/pkg/databaseManager"
	"passontw-slot-game/pkg/logger"
	"passontw-slot-game/pkg/nacosManager"
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

	// docs.SwaggerInfo.Host = cfg.Server.APIHost
	// docs.SwaggerInfo.Version = cfg.Server.Version

	err := utils.InitSnowflake(1) // 使用一個合適的 worker ID
	if err != nil {
		log.Fatalf("Failed to initialize Snowflake: %v", err)
	}

	app := fx.New(
		nacosManager.Module,
		config.Module,
		fx.Replace(databaseManager.Module),
		fx.Provide(
			fx.Annotate(
				func(cfg *config.Config) *databaseManager.PostgresConfig {
					return databaseManager.ProvidePostgresConfig(cfg)
				},
				fx.ResultTags(`name:"postgresConfig"`),
			),
			fx.Annotate(
				func(lc fx.Lifecycle, config *databaseManager.PostgresConfig) (databaseManager.DatabaseManager, error) {
					return databaseManager.ProvideDatabaseManager(lc, config)
				},
				fx.ParamTags(``, `name:"postgresConfig"`),
			),
		),
		redis.Module,

		fx.Provide(
			logger.NewLogger,
			service.ProvideGormDB,
			service.NewOrderService,
			service.NewGameService,
			service.NewHelloService,
			service.NewAuthService,
			service.NewCheckerService,
			service.NewBalanceService,
			handler.NewHelloHandler,
			handler.NewOrderHandler,
			handler.NewGameHandler,
			handler.NewWebSocketHandler,
			handler.NewRouter,
		),
		fx.Invoke(handler.StartServer),
	)

	app.Run()
}
