package core

import (
	"context"
	"fmt"
	"game-api/internal/config"
	"game-api/internal/service"
	"game-api/pkg/databaseManager"
	"game-api/pkg/logger"
	"game-api/pkg/nacosManager"
	redis "game-api/pkg/redisManager"
	"game-api/pkg/websocketManager"

	"go.uber.org/fx"
)

// DatabaseModule 數據庫模組
var DatabaseModule = fx.Options(
	fx.Provide(
		// 基於 Config 轉換為 PostgresConfig
		fx.Annotate(
			func(cfg *config.Config) *databaseManager.PostgresConfig {
				return &databaseManager.PostgresConfig{
					Host:     cfg.Database.Host,
					Port:     cfg.Database.Port,
					User:     cfg.Database.User,
					Password: cfg.Database.Password,
					Name:     cfg.Database.Name,
				}
			},
			fx.ResultTags(`name:"postgresConfig"`),
		),
		// 提供 DatabaseManager 實例
		fx.Annotate(
			func(lc fx.Lifecycle, config *databaseManager.PostgresConfig) (databaseManager.DatabaseManager, error) {
				return databaseManager.ProvideDatabaseManager(lc, config)
			},
			fx.ParamTags(``, `name:"postgresConfig"`),
		),
	),
)

// RedisModule Redis 模組
var RedisModule = fx.Options(
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
		// 提供 Redis 客戶端和管理器
		redis.ProvideRedisClient,
		redis.ProvideRedisManager,
	),
)

// WebSocketModule WebSocket 模組
var WebSocketModule = fx.Options(
	fx.Provide(
		// 提供 WebSocket 管理器
		func(authService service.AuthService) *websocketManager.Manager {
			// 創建適配器函數，將 string 轉換為 uint
			authAdapter := func(token string) (uint, error) {
				userID, err := authService.ValidateToken(token)
				if err != nil {
					return 0, err
				}
				// 轉換字符串ID為uint
				var userIDUint uint
				_, err = fmt.Sscanf(userID, "%d", &userIDUint)
				if err != nil {
					return 0, fmt.Errorf("用戶ID格式無效: %v", err)
				}
				return userIDUint, nil
			}
			return websocketManager.NewManager(authAdapter)
		},
		// 提供 WebSocket 處理程序
		websocketManager.NewWebSocketHandler,
	),
	// 啟動 WebSocket 管理器
	fx.Invoke(
		func(lc fx.Lifecycle, manager *websocketManager.Manager) {
			lc.Append(fx.Hook{
				OnStart: func(ctx context.Context) error {
					go manager.Start(ctx)
					return nil
				},
				OnStop: func(ctx context.Context) error {
					manager.Shutdown()
					return nil
				},
			})
		},
	),
)

// LoggerModule 日誌模組
var LoggerModule = fx.Provide(logger.NewLogger)

// 整合的核心模組，包含所有基礎設施
var Module = fx.Options(
	nacosManager.Module,
	DatabaseModule,
	RedisModule,
	WebSocketModule,
	LoggerModule,
)
