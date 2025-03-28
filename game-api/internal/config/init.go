package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

func initializeConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found or cannot be loaded: %v", err)
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
