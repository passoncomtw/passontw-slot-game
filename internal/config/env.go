package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type ServerConfig struct {
	APIHost string
	Port    string
	Version string
}

type RedisENVConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	DB       int
}
type EnvConfig struct {
	NACOS_HOST      string
	NACOS_PORT      uint64
	NACOS_NAMESPACE string
	NACOS_GROUP     string
	NACOS_USERNAME  string
	NACOS_PASSWORD  string
}

type JWTConfig struct {
	Secret    string
	ExpiresIn time.Duration
}

func LoadEnv() *EnvConfig {
	// 嘗試加載 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	config := &EnvConfig{
		NACOS_HOST:      getEnv("NACOS_HOST", "127.0.0.1"),
		NACOS_PORT:      uint64(getEnvAsInt("NACOS_PORT", 8488)),
		NACOS_NAMESPACE: getEnv("NACOS_NAMESPACE", "public"),
		NACOS_GROUP:     getEnv("NACOS_GROUP", "DEFAULT_GROUP"),
		NACOS_USERNAME:  getEnv("NACOS_USERNAME", "username"),
		NACOS_PASSWORD:  getEnv("NACOS_PASSWORD", "password"),
	}

	return config
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		n, err := strconv.Atoi(value)
		if err != nil {
			return 0
		}
		return n
	}
	return defaultValue
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

func getEnvAsDuration(key, defaultValue string) time.Duration {
	value := getEnv(key, defaultValue)
	duration, err := time.ParseDuration(value)
	if err != nil {
		log.Printf("Warning: invalid duration for %s, using default value", key)
		duration, _ = time.ParseDuration(defaultValue)
	}
	return duration
}

// GetEnv 獲取環境變數，如果不存在則返回默認值
func GetEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
