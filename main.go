package main

import (
	"log"
	"passontw-slot-game/src/config"
	"passontw-slot-game/src/handler"
	"passontw-slot-game/src/service"

	_ "passontw-slot-game/docs"
	"passontw-slot-game/pkg/databaseManager"
	"passontw-slot-game/pkg/logger"
	"passontw-slot-game/pkg/nacosManager"
	redis "passontw-slot-game/pkg/redisManager"
	"passontw-slot-game/pkg/utils"

	"go.uber.org/fx"
)

// @title           Passontw Auth Service API
// @description     Passontw Auth Service API.
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
	err := utils.InitSnowflake(2)
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

		// 不使用 fx.Replace，直接提供 Redis 所需的各個組件
		fx.Provide(
			// 提供 Redis 配置
			func(cfg *config.Config) *redis.RedisConfig {
				return &redis.RedisConfig{
					Addr:     cfg.Redis.Addr,
					Username: cfg.Redis.Username,
					Password: cfg.Redis.Password,
					DB:       cfg.Redis.DB,
				}
			},
			// 剩餘的 Redis 組件由原始模塊提供
			redis.ProvideRedisClient,
			redis.ProvideRedisManager,
		),

		fx.Provide(
			logger.NewLogger,
			service.ProvideGormDB,
			service.NewAuthService,
			fx.Annotate(
				service.NewUserService,
				fx.As(new(service.UserService)),
			),
			handler.NewAuthHandler,
			handler.NewUserHandler,
			handler.NewRouter,
		),
		fx.Invoke(handler.StartServer),
	)

	app.Run()
}
