package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type ServerConfig struct {
	Port string
}

type EnvConfig struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
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
		Server: ServerConfig{
			Port: getEnv("PORT", "3000"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			Name:     getEnv("DB_NAME", "postgres"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
		},
		JWT: JWTConfig{
			Secret:    getEnv("JWT_SECRET", "default-secret-key"),
			ExpiresIn: getEnvAsDuration("JWT_EXPIRES_IN", "24h"),
		},
	}

	// 驗證必要的環境變數
	validateEnvConfig(config)

	return config
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

func validateEnvConfig(config *EnvConfig) {
	// 檢查必要的配置
	if config.Database.Password == "" {
		log.Fatal("DB_PASSWORD is required")
	}
	if config.JWT.Secret == "default-secret-key" {
		log.Print("Warning: using default JWT secret key, this is not recommended for production")
	}
}
