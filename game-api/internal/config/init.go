package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

func initializeConfig() *Config {
	// 首先嘗試加載 .env.local 文件
	if err := godotenv.Load(".env.local"); err != nil {
		log.Printf("Info: .env.local file not found, trying with .env file")

		// 如果 .env.local 不存在，則嘗試加載 .env 文件
		if err := godotenv.Load(); err != nil {
			log.Printf("Warning: .env file not found or cannot be loaded: %v", err)
		}
	} else {
		log.Printf("Info: Using .env.local configuration")
	}

	cfg := &Config{}

	// Nacos 設置
	cfg.EnableNacos = getEnvAsBool("ENABLE_NACOS", false)
	cfg.Nacos.Host = getEnv("NACOS_HOST", "localhost")
	nacosPort := getEnvAsInt("NACOS_PORT", 8848)
	cfg.Nacos.Port = uint64(nacosPort)
	cfg.Nacos.NamespaceId = getEnv("NACOS_NAMESPACE", "")
	cfg.Nacos.Group = getEnv("NACOS_GROUP", "DEFAULT_GROUP")
	cfg.Nacos.DataId = getEnv("NACOS_DATAID", "slot_game_config") // 使用環境變量獲取DataId
	cfg.Nacos.Username = getEnv("NACOS_USERNAME", "")
	cfg.Nacos.Password = getEnv("NACOS_PASSWORD", "")

	// 服務器設置
	cfg.Server.Host = getEnv("SERVER_HOST", "localhost")
	cfg.Server.Port = uint64(getEnvAsInt("SERVER_PORT", 3010))
	cfg.Server.APIHost = getEnv("API_HOST", "localhost")
	cfg.Server.Version = getEnv("API_VERSION", "v1")

	// 資料庫設置
	cfg.Database.Host = getEnv("DB_HOST", "localhost")
	cfg.Database.Port = getEnvAsInt("DB_PORT", 5432)
	cfg.Database.Name = getEnv("DB_NAME", "slot_game")
	cfg.Database.User = getEnv("DB_USER", "postgres")
	cfg.Database.Password = getEnv("DB_PASSWORD", "postgres")

	// JWT 設置
	cfg.JWT.SecretKey = getEnv("JWT_SECRET", "your-secret-key-here")
	cfg.JWT.AdminSecretKey = getEnv("JWT_SECRET", "your-secret-key-here-admin")
	cfg.JWT.TokenExpiration = int64(getEnvAsInt("JWT_EXPIRES_IN", 86400))

	// Redis 設置
	cfg.Redis.Addr = getEnv("REDIS_HOST", "localhost") + ":" + getEnv("REDIS_PORT", "6379")
	cfg.Redis.Username = getEnv("REDIS_USERNAME", "")
	cfg.Redis.Password = getEnv("REDIS_PASSWORD", "")
	cfg.Redis.DB = getEnvAsInt("REDIS_DB", 0)

	return cfg
}

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
