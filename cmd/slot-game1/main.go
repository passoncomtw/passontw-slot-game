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
		// 核心服务模块
		nacosManager.Module, // 提供 Nacos 客戶端
		config.Module,       // 提供配置管理
		// 使用自定義的數據庫模組來傳遞 config
		fx.Replace(databaseManager.Module),
		fx.Provide(
			// 明確提供 ProvidePostgresConfig 和 ProvideDatabaseManager
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
		redis.Module, // 提供 Redis 管理

		// 應用程序服務
		fx.Provide(
			logger.NewLogger,
			service.ProvideGormDB, // 提供 gorm.DB 實例
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
