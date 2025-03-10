package config

import (
	"fmt"
	"passontw-slot-game/apps/slot-game1/pkg/nacos"
	"strings"
	"time"
)

type NacosAppConfig struct {
	Port          string `json:"PORT"`
	DBHost        string `json:"DB_HOST"`
	DBPort        int    `json:"DB_PORT"`
	DBName        string `json:"DB_NAME"`
	DBUser        string `json:"DB_USER"`
	DBPassword    string `json:"DB_PASSWORD"`
	JWTSecret     string `json:"JWT_SECRET"`
	JWTExpiresIn  string `json:"JWT_EXPIRES_IN"`
	APIHost       string `json:"API_HOST"`
	Version       string `json:"VERSION"`
	RedisHost     string `json:"REDIS_HOST"`
	RedisPort     string `json:"REDIS_PORT"`
	RedisUsername string `json:"REDIS_USERNAME"`
	RedisPassword string `json:"REDIS_PASSWORD"`
	RedisDB       int    `json:"REDIS_DB"`
}

const (
	AppConfigDataID = "slot_game_config"
)

var origin = time.Date(0, 1, 1, 0, 0, 0, 0, time.UTC)

func parseDuration(input string) (time.Duration, error) {
	var layout string
	if strings.Count(input, ":") == 1 {
		layout = "04:05"
	} else {
		layout = "15:04:05"
	}
	t, err := time.Parse(layout, input)
	if err != nil {
		return 0, err
	}
	return t.Sub(origin), nil
}

func LoadConfigFromNacos() (*Config, error) {
	cfg := LoadEnv()

	nacosClient, err := nacos.NewNacosClient(&nacos.NacosConfig{
		Endpoints: []string{cfg.NACOS_HOST},
		Port:      cfg.NACOS_PORT,
		Namespace: cfg.NACOS_NAMESPACE,
		Group:     cfg.NACOS_GROUP,
		Username:  cfg.NACOS_USERNAME,
		Password:  cfg.NACOS_PASSWORD,
	})

	if err != nil {
		return nil, fmt.Errorf("failed to create nacos client: %w", err)
	}

	// 從 Nacos 獲取配置
	var nacosAppConfig NacosAppConfig
	err = nacosClient.GetConfig(AppConfigDataID, &nacosAppConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to get config from nacos: %w", err)
	}

	expiresIn, _ := parseDuration(nacosAppConfig.JWTExpiresIn)

	config := &Config{
		Server: ServerConfig{
			APIHost: nacosAppConfig.APIHost,
			Port:    nacosAppConfig.Port,
			Version: nacosAppConfig.Version,
		},
		Database: DatabaseConfig{
			Host:     nacosAppConfig.DBHost,
			Port:     nacosAppConfig.DBPort,
			Name:     nacosAppConfig.DBName,
			User:     nacosAppConfig.DBUser,
			Password: nacosAppConfig.DBPassword,
		},
		JWT: JWTConfig{
			Secret:    nacosAppConfig.JWTSecret,
			ExpiresIn: expiresIn,
		},
		Redis: RedisConfig{
			Addr:     fmt.Sprintf("%s:%s", nacosAppConfig.RedisHost, nacosAppConfig.RedisPort),
			Username: nacosAppConfig.RedisUsername,
			Password: nacosAppConfig.RedisPassword,
			DB:       nacosAppConfig.RedisDB,
		},
	}

	return config, nil
}

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
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
