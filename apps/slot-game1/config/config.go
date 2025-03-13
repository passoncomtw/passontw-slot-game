package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"passontw-slot-game/pkg/logger"
	"passontw-slot-game/pkg/nacosManager"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/nacos-group/nacos-sdk-go/vo"
	"go.uber.org/fx"
	"gopkg.in/yaml.v3"
)

type NacosAppConfig struct {
	Port          string `json:"PORT" yaml:"PORT"`
	DBHost        string `json:"DB_HOST" yaml:"DB_HOST"`
	DBPort        int    `json:"DB_PORT" yaml:"DB_PORT"`
	DBName        string `json:"DB_NAME" yaml:"DB_NAME"`
	DBUser        string `json:"DB_USER" yaml:"DB_USER"`
	DBPassword    string `json:"DB_PASSWORD" yaml:"DB_PASSWORD"`
	JWTSecret     string `json:"JWT_SECRET" yaml:"JWT_SECRET"`
	JWTExpiresIn  string `json:"JWT_EXPIRES_IN" yaml:"JWT_EXPIRES_IN"`
	APIHost       string `json:"API_HOST" yaml:"API_HOST"`
	Version       string `json:"VERSION" yaml:"VERSION"`
	RedisHost     string `json:"REDIS_HOST" yaml:"REDIS_HOST"`
	RedisPort     string `json:"REDIS_PORT" yaml:"REDIS_PORT"`
	RedisUsername string `json:"REDIS_USERNAME" yaml:"REDIS_USERNAME"`
	RedisPassword string `json:"REDIS_PASSWORD" yaml:"REDIS_PASSWORD"`
	RedisDB       int    `json:"REDIS_DB" yaml:"REDIS_DB"`
}

type Config struct {
	Server      ServerConfig
	Database    DatabaseConfig
	Redis       RedisConfig
	JWT         JWTConfig
	Nacos       NacosConfig
	EnableNacos bool
}

// 實現 nacosManager.ConfigWithNacos 接口
func (c *Config) IsNacosEnabled() bool {
	return c.EnableNacos
}

func (c *Config) GetNacosGroup() string {
	return c.Nacos.Group
}

func (c *Config) GetNacosDataId() string {
	return c.Nacos.DataId
}

type NacosConfig struct {
	Host        string
	Port        uint64
	NamespaceId string
	Group       string
	DataId      string
	Username    string
	Password    string
}

type ServerConfig struct {
	Host    string
	Port    uint64
	APIHost string
	Version string
}

type RedisConfig struct {
	Addr     string
	Username string
	Password string
	DB       int
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
}

type JWTConfig struct {
	Secret    string
	ExpiresIn time.Duration
}

const (
	AppConfigDataID = "slot_game_config"
)

func updateConfigFromNacos(cfg *Config, nacosConfig *NacosAppConfig) {
	// 更新服務器配置
	if nacosConfig.Port != "" {
		portInt, err := strconv.Atoi(nacosConfig.Port)
		if err == nil {
			cfg.Server.Port = uint64(portInt)
		}
	}

	if nacosConfig.APIHost != "" {
		cfg.Server.APIHost = nacosConfig.APIHost
	}

	if nacosConfig.Version != "" {
		cfg.Server.Version = nacosConfig.Version
	}

	// 更新數據庫配置
	if nacosConfig.DBHost != "" {
		cfg.Database.Host = nacosConfig.DBHost
	}

	if nacosConfig.DBPort != 0 {
		cfg.Database.Port = nacosConfig.DBPort
	}

	if nacosConfig.DBName != "" {
		cfg.Database.Name = nacosConfig.DBName
	}

	if nacosConfig.DBUser != "" {
		cfg.Database.User = nacosConfig.DBUser
	}

	if nacosConfig.DBPassword != "" {
		cfg.Database.Password = nacosConfig.DBPassword
	}

	// 更新 Redis 配置
	if nacosConfig.RedisHost != "" || nacosConfig.RedisPort != "" {
		host := nacosConfig.RedisHost
		if host == "" {
			host = "localhost"
		}

		port := nacosConfig.RedisPort
		if port == "" {
			port = "6379"
		}

		cfg.Redis.Addr = host + ":" + port
	}

	if nacosConfig.RedisUsername != "" {
		cfg.Redis.Username = nacosConfig.RedisUsername
	}

	if nacosConfig.RedisPassword != "" {
		cfg.Redis.Password = nacosConfig.RedisPassword
	}

	if nacosConfig.RedisDB != 0 {
		cfg.Redis.DB = nacosConfig.RedisDB
	}

	// 更新 JWT 配置
	if nacosConfig.JWTSecret != "" {
		cfg.JWT.Secret = nacosConfig.JWTSecret
	}

	if nacosConfig.JWTExpiresIn != "" {
		duration, err := time.ParseDuration(nacosConfig.JWTExpiresIn)
		if err == nil {
			cfg.JWT.ExpiresIn = duration
		}
	}
}

// GetEnv 獲取環境變數，如果不存在則返回默認值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

// 初始化基本配置
func initializeConfig() *Config {
	// 嘗試加載 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found or cannot be loaded: %v", err)
	}

	cfg := &Config{}

	// 從環境變量加載配置
	cfg.Server.Host = getEnv("SERVER_HOST", "localhost")
	portStr := getEnv("SERVER_PORT", "8080")
	portInt, err := strconv.Atoi(portStr)
	if err == nil {
		cfg.Server.Port = uint64(portInt)
	} else {
		cfg.Server.Port = 8080
	}
	cfg.Server.APIHost = getEnv("API_HOST", "localhost:8080")
	cfg.Server.Version = getEnv("VERSION", "1.0.0")

	// 數據庫配置
	cfg.Database.Host = getEnv("DB_HOST", "localhost")
	cfg.Database.Port = getEnvAsInt("DB_PORT", 5432)
	cfg.Database.User = getEnv("DB_USER", "postgres")
	cfg.Database.Password = getEnv("DB_PASSWORD", "postgres")
	cfg.Database.Name = getEnv("DB_NAME", "postgres")

	// Redis 配置
	redisHost := getEnv("REDIS_HOST", "localhost")
	redisPort := getEnv("REDIS_PORT", "6379")
	cfg.Redis.Addr = redisHost + ":" + redisPort
	cfg.Redis.Username = getEnv("REDIS_USERNAME", "")
	cfg.Redis.Password = getEnv("REDIS_PASSWORD", "")
	cfg.Redis.DB = getEnvAsInt("REDIS_DB", 0)

	// Nacos 配置
	cfg.EnableNacos = getEnvAsBool("ENABLE_NACOS", false)
	cfg.Nacos.Host = getEnv("NACOS_HOST", "localhost")
	nacosPort := getEnvAsInt("NACOS_PORT", 8848)
	cfg.Nacos.Port = uint64(nacosPort)
	cfg.Nacos.NamespaceId = getEnv("NACOS_NAMESPACE", "")
	cfg.Nacos.Group = getEnv("NACOS_GROUP", "DEFAULT_GROUP")
	cfg.Nacos.DataId = getEnv("NACOS_DATAID", "slot_game_config")
	cfg.Nacos.Username = getEnv("NACOS_USERNAME", "")
	cfg.Nacos.Password = getEnv("NACOS_PASSWORD", "")

	// JWT 配置
	cfg.JWT.Secret = getEnv("JWT_SECRET", "your-secret-key")
	expiresInStr := getEnv("JWT_EXPIRES_IN", "24h")
	duration, err := time.ParseDuration(expiresInStr)
	if err == nil {
		cfg.JWT.ExpiresIn = duration
	} else {
		cfg.JWT.ExpiresIn = 24 * time.Hour
	}

	return cfg
}

// ProvideConfig 是提供配置的 fx 提供者函數
func ProvideConfig(lc fx.Lifecycle, nacosClient nacosManager.NacosClient, logger logger.Logger) (*Config, error) {
	// 從環境變量載入基本配置
	cfg := initializeConfig()

	// 添加 Nacos 連接測試日誌
	logger.Info(fmt.Sprintf("Nacos 配置: Host=%s, Port=%d, Namespace=%s, Group=%s, DataId=%s, EnableNacos=%v",
		cfg.Nacos.Host, cfg.Nacos.Port, cfg.Nacos.NamespaceId, cfg.Nacos.Group, cfg.Nacos.DataId, cfg.EnableNacos))

	if !cfg.EnableNacos {
		logger.Info("Nacos 配置未啟用，使用本地配置")
		return cfg, nil
	}

	logger.Info("嘗試從 Nacos 獲取配置...")

	// 使用 nacos 客戶端獲取配置
	content, err := nacosClient.GetConfig(cfg.Nacos.DataId, cfg.Nacos.Group)
	if err != nil {
		logger.Info(fmt.Sprintf("從 Nacos 獲取配置失敗: %v", err))
	} else {
		// 解析從 Nacos 獲取的配置
		var nacosAppConfig NacosAppConfig
		err = yaml.Unmarshal([]byte(content), &nacosAppConfig)
		if err != nil {
			logger.Info(fmt.Sprintf("解析 Nacos 配置失敗: %v", err))
		} else {
			// 使用 Nacos 配置更新本地配置
			logger.Info(fmt.Sprintf("原始數據庫配置: Host=%s, Port=%d, User=%s, Name=%s",
				cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Name))

			updateConfigFromNacos(cfg, &nacosAppConfig)

			logger.Info(fmt.Sprintf("更新後數據庫配置: Host=%s, Port=%d, User=%s, Name=%s",
				cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Name))

			logger.Info("成功從 Nacos 加載配置")
		}

		// 設置配置變更監聽
		lc.Append(fx.Hook{
			OnStart: func(ctx context.Context) error {
				// 監聽配置變更
				err := nacosClient.ListenConfig(cfg.Nacos.DataId, cfg.Nacos.Group, func(newContent string) {
					logger.Info("Nacos 配置已更改")

					// 解析新的配置
					var newNacosConfig NacosAppConfig
					err := yaml.Unmarshal([]byte(newContent), &newNacosConfig)
					if err != nil {
						logger.Info(fmt.Sprintf("解析新的 Nacos 配置失敗: %v", err))
						return
					}

					// 更新配置
					updateConfigFromNacos(cfg, &newNacosConfig)
					logger.Info("配置已動態更新")
				})

				if err != nil {
					logger.Info(fmt.Sprintf("設置 Nacos 配置監聽失敗: %v", err))
					return nil // 不要因為監聽設置失敗而中斷啟動
				}

				// 註冊服務到 Nacos
				success, err := registerService(nacosClient, cfg)
				if err != nil {
					logger.Info(fmt.Sprintf("註冊服務到 Nacos 失敗: %v", err))
				} else if success {
					logger.Info("服務已成功註冊到 Nacos")
				}

				return nil
			},
			OnStop: func(ctx context.Context) error {
				// 如果需要清理資源，可以在這裡實現
				return nil
			},
		})
	}

	return cfg, nil
}

// registerService 註冊服務到 Nacos
func registerService(nacosClient nacosManager.NacosClient, cfg *Config) (bool, error) {
	param := vo.RegisterInstanceParam{
		Ip:          cfg.Server.Host,
		Port:        cfg.Server.Port,
		ServiceName: "slot-game1",
		Weight:      10,
		Enable:      true,
		Healthy:     true,
		Ephemeral:   true,
		Metadata:    map[string]string{"version": cfg.Server.Version},
		GroupName:   cfg.Nacos.Group,
	}

	return nacosClient.RegisterInstance(param)
}

// ConfigModule 是配置模組
var Module = fx.Module("config",
	fx.Provide(
		ProvideConfig,
	),
)

// 添加數據庫配置的 getter 方法
func (c *Config) GetDatabaseHost() string {
	return c.Database.Host
}

func (c *Config) GetDatabasePort() int {
	return c.Database.Port
}

func (c *Config) GetDatabaseUser() string {
	return c.Database.User
}

func (c *Config) GetDatabasePassword() string {
	return c.Database.Password
}

func (c *Config) GetDatabaseName() string {
	return c.Database.Name
}
