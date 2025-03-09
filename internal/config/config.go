package config

import "fmt"

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

func NewConfig() *Config {
	envConfig := LoadEnv()

	return &Config{
		Server: ServerConfig{
			Port: fmt.Sprintf(":%s", envConfig.Server.Port),
		},
		Database: DatabaseConfig{
			Host:     envConfig.Database.Host,
			Port:     envConfig.Database.Port,
			Name:     envConfig.Database.Name,
			User:     envConfig.Database.User,
			Password: envConfig.Database.Password,
		},
		Redis: RedisConfig{
			Addr:     fmt.Sprintf("%s:%s", envConfig.Redis.Host, envConfig.Redis.Port),
			Username: envConfig.Redis.Username,
			Password: envConfig.Redis.Password,
			DB:       envConfig.Redis.DB,
		},
		JWT: JWTConfig{
			Secret:    envConfig.JWT.Secret,
			ExpiresIn: envConfig.JWT.ExpiresIn,
		},
	}
}
