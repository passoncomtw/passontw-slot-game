package config

import "fmt"

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
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
		JWT: JWTConfig{
			Secret:    envConfig.JWT.Secret,
			ExpiresIn: envConfig.JWT.ExpiresIn,
		},
	}
}
