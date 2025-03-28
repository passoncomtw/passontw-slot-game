package core

import (
	"context"
	"fmt"
	"game-api/internal/config"
	"game-api/internal/interfaces"
	"game-api/pkg/databaseManager"
	"game-api/pkg/logger"
	"game-api/pkg/nacosManager"
	redis "game-api/pkg/redisManager"
	"game-api/pkg/websocketManager"

	"net"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/fx"
	"go.uber.org/zap"
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

// RouterModule Gin路由模組
var RouterModule = fx.Options(
	fx.Provide(
		// 提供 Gin Engine
		func(cfg *config.Config, logger *zap.Logger) *gin.Engine {
			// 預設為調試模式，如果是生產環境，可以透過環境變數設置
			gin.SetMode(gin.DebugMode)

			// 記錄服務啟動信息
			hostIP := cfg.Server.Host
			if hostIP == "localhost" || hostIP == "127.0.0.1" {
				// 嘗試獲取實際 IP 顯示給使用者
				if externalIP, err := getOutboundIP(); err == nil {
					logger.Info("服務將在多個 IP 地址上可訪問",
						zap.String("external_ip", externalIP),
						zap.Uint64("port", cfg.Server.Port),
						zap.String("url", fmt.Sprintf("http://%s:%d", externalIP, cfg.Server.Port)))
				}
			}

			// 打印標準的訪問地址
			logger.Info("Gin HTTP 服務已啟動",
				zap.String("host", hostIP),
				zap.Uint64("port", cfg.Server.Port),
				zap.String("url", fmt.Sprintf("http://%s:%d", hostIP, cfg.Server.Port)))

			// 創建 Gin 引擎
			r := gin.New()

			// 使用自定義中間件
			r.Use(
				gin.Recovery(),
				// 日誌中間件
				func(c *gin.Context) {
					start := time.Now()
					path := c.Request.URL.Path

					// 處理請求
					c.Next()

					// 請求完成後記錄日誌
					latency := time.Since(start)
					statusCode := c.Writer.Status()
					clientIP := c.ClientIP()

					logger.Info("HTTP Request",
						zap.String("method", c.Request.Method),
						zap.String("path", path),
						zap.Int("status", statusCode),
						zap.String("ip", clientIP),
						zap.Duration("latency", latency),
					)
				},
			)

			return r
		},
	),
	// 啟動 HTTP 服務器
	fx.Invoke(
		func(lc fx.Lifecycle, cfg *config.Config, r *gin.Engine, logger *zap.Logger) {
			lc.Append(fx.Hook{
				OnStart: func(ctx context.Context) error {
					// 在 goroutine 中啟動服務器
					go func() {
						addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
						if err := r.Run(addr); err != nil {
							logger.Error("服務器啟動失敗", zap.Error(err))
						}
					}()
					return nil
				},
				OnStop: func(ctx context.Context) error {
					return nil
				},
			})
		},
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
		fx.Annotate(
			func(authService interfaces.AuthService) *websocketManager.Manager {
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
			fx.ParamTags(``),
		),
		// 提供 WebSocket 處理程序
		websocketManager.NewWebSocketHandler,
	),
	// 啟動 WebSocket 管理器
	fx.Invoke(
		func(lc fx.Lifecycle, manager *websocketManager.Manager, logger *zap.Logger) {
			// 使用獨立的 background context 而不是應用的 context
			bgCtx, cancel := context.WithCancel(context.Background())

			lc.Append(fx.Hook{
				OnStart: func(ctx context.Context) error {
					logger.Info("Starting WebSocket Manager with independent background context")

					// 使用 goroutine 啟動管理器
					go func() {
						// 添加恢復機制
						defer func() {
							if r := recover(); r != nil {
								logger.Error("WebSocket Manager panicked",
									zap.Any("error", r))

								// 嘗試重新啟動
								logger.Info("Attempting to restart WebSocket Manager")
								go manager.Start(bgCtx)
							}
						}()

						manager.Start(bgCtx)
					}()

					return nil
				},
				OnStop: func(ctx context.Context) error {
					logger.Info("Stopping WebSocket Manager")

					// 先取消 context
					cancel()

					// 然後執行正常關閉程序
					manager.Shutdown()

					return nil
				},
			})
		},
	),
)

// LoggerModule 日誌模組
var LoggerModule = fx.Options(
	fx.Provide(
		// 提供 Logger 實例
		logger.NewLogger,
		// 從 logger.Logger 轉換為 *zap.Logger
		func(l logger.Logger) *zap.Logger {
			return l.GetZapLogger()
		},
	),
)

// 整合的核心模組，包含所有基礎設施
var Module = fx.Options(
	nacosManager.Module,
	DatabaseModule,
	RedisModule,
	WebSocketModule,
	LoggerModule,
	RouterModule,
)

// 獲取本機對外 IP 地址
func getOutboundIP() (string, error) {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "", err
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String(), nil
}
