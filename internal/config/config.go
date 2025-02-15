package config

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
}

type ServerConfig struct {
	Port string
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
}

func NewConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port: ":8080",
		},
		Database: DatabaseConfig{
			Host:     "172.237.27.51",
			Port:     15432,
			User:     "postgres",
			Password: "1qaz@WSX3edc",
			Name:     "games",
		},
	}
}
