package config

import (
	"net"
	"os"
	"strconv"
	"time"

	"log"

	"github.com/nacos-group/nacos-sdk-go/vo"
)

// 使用 init.go 中已有的環境變量獲取方法
// 此函數僅在 nacos.go 內部使用，與 init.go 中的同名函數是不同的作用域
func getLocalEnv(key string, defaultValue string) string {
	value := os.Getenv(key)
	if value != "" {
		return value
	}
	return defaultValue
}

func updateConfigFromNacos(cfg *Config, nacosConfig *NacosAppConfig) {
	if nacosConfig.Port != "" {
		portInt, err := strconv.ParseUint(nacosConfig.Port, 10, 64)
		if err == nil {
			cfg.Server.Port = portInt
		} else {
			// 如果转换失败，尝试使用 Atoi
			if portInt, err := strconv.Atoi(nacosConfig.Port); err == nil {
				cfg.Server.Port = uint64(portInt)
			}
		}
	}
	if nacosConfig.APIHost != "" {
		cfg.Server.APIHost = nacosConfig.APIHost
	}
	if nacosConfig.Version != "" {
		cfg.Server.Version = nacosConfig.Version
	}

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

func createServiceRegistrationParam(cfg *Config) vo.RegisterInstanceParam {
	serviceName := getLocalEnv("NACOS_SERVICE_NAME", "slot-game-service")
	hostIp := cfg.Server.Host

	// 如果配置的是 localhost 或 127.0.0.1，嘗試獲取實際 IP
	if hostIp == "localhost" || hostIp == "127.0.0.1" {
		// 嘗試獲取外部 IP
		externalIP := getOutboundIP()
		if externalIP != "" {
			hostIp = externalIP
		}
	}

	// 確保端口號是有效的
	port := int(cfg.Server.Port)
	if port <= 0 {
		port = 8080 // 默認端口
	}

	log.Printf("註冊服務到 Nacos: 服務名=%s, IP=%s, 端口=%d, 組=%s",
		serviceName, hostIp, port, cfg.Nacos.Group)

	return vo.RegisterInstanceParam{
		Ip:          hostIp,
		Port:        uint64(port),
		ServiceName: serviceName,
		Weight:      10,
		Enable:      true,
		Healthy:     true,
		Ephemeral:   true,
		Metadata:    map[string]string{"version": cfg.Server.Version},
		GroupName:   cfg.Nacos.Group,
	}
}

// 獲取本機對外 IP 地址
func getOutboundIP() string {
	// 通過建立 UDP 連接方式獲取外網 IP
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return ""
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}
