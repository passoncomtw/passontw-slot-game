package nacos

import (
	"encoding/json"
	"fmt"

	"github.com/nacos-group/nacos-sdk-go/v2/clients"
	"github.com/nacos-group/nacos-sdk-go/v2/clients/config_client"
	"github.com/nacos-group/nacos-sdk-go/v2/clients/naming_client"
	"github.com/nacos-group/nacos-sdk-go/v2/common/constant"
	"github.com/nacos-group/nacos-sdk-go/v2/model"
	"github.com/nacos-group/nacos-sdk-go/v2/vo"
)

type Instance struct {
	InstanceId  string  `json:"instanceId"`
	Ip          string  `json:"ip"`
	Port        uint64  `json:"port"`
	ServiceName string  `json:"serviceName"`
	Weight      float64 `json:"weight"`
	Healthy     bool    `json:"healthy"`
	Enable      bool    `json:"enable"`
	Ephemeral   bool    `json:"ephemeral"`
}

// NacosClient Nacos 客戶端
type NacosClient struct {
	configClient config_client.IConfigClient
	namingClient naming_client.INamingClient
	namespace    string
	group        string
}

// NacosConfig Nacos 配置
type NacosConfig struct {
	Endpoints []string `json:"endpoints"` // Nacos 服務器地址
	Port      uint64   `json:"port"`      // Nacos 服務器端口
	Namespace string   `json:"namespace"` // 命名空間
	Group     string   `json:"group"`     // 分組
	DataID    string   `json:"dataId"`    // 配置 ID
	Username  string   `json:"username"`  // 用戶名
	Password  string   `json:"password"`  // 密碼
}

// NewNacosClient 創建 Nacos 客戶端
func NewNacosClient(cfg *NacosConfig) (*NacosClient, error) {
	// 創建 ServerConfig
	serverConfigs := make([]constant.ServerConfig, 0)
	for _, endpoint := range cfg.Endpoints {
		serverConfigs = append(serverConfigs, constant.ServerConfig{
			IpAddr: endpoint,
			Port:   8848, // Nacos 默認端口
		})
	}

	// 創建 ClientConfig
	clientConfig := constant.ClientConfig{
		NamespaceId:         cfg.Namespace,
		TimeoutMs:           5000,
		NotLoadCacheAtStart: true,
		LogDir:              "/tmp/nacos/log",
		CacheDir:            "/tmp/nacos/cache",
		Username:            cfg.Username,
		Password:            cfg.Password,
	}

	// 創建配置客戶端
	configClient, err := clients.NewConfigClient(
		vo.NacosClientParam{
			ClientConfig:  &clientConfig,
			ServerConfigs: serverConfigs,
		},
	)
	if err != nil {
		return nil, fmt.Errorf("create config client error: %v", err)
	}

	// 創建服務發現客戶端
	namingClient, err := clients.NewNamingClient(
		vo.NacosClientParam{
			ClientConfig:  &clientConfig,
			ServerConfigs: serverConfigs,
		},
	)
	if err != nil {
		return nil, fmt.Errorf("create naming client error: %v", err)
	}

	return &NacosClient{
		configClient: configClient,
		namingClient: namingClient,
		namespace:    cfg.Namespace,
		group:        cfg.Group,
	}, nil
}

// GetConfig 獲取配置
func (c *NacosClient) GetConfig(dataId string, v interface{}) error {
	content, err := c.configClient.GetConfig(vo.ConfigParam{
		DataId: dataId,
		Group:  c.group,
	})
	if err != nil {
		return fmt.Errorf("get config error: %v", err)
	}

	if err := json.Unmarshal([]byte(content), v); err != nil {
		return fmt.Errorf("unmarshal config error: %v", err)
	}

	return nil
}

// ListenConfig 監聽配置變更
func (c *NacosClient) ListenConfig(dataId string, onChange func(string)) error {
	return c.configClient.ListenConfig(vo.ConfigParam{
		DataId: dataId,
		Group:  c.group,
		OnChange: func(namespace, group, dataId, data string) {
			onChange(data)
		},
	})
}

// RegisterInstance 註冊服務實例
func (c *NacosClient) RegisterInstance(serviceName string, ip string, port uint64) error {
	_, err := c.namingClient.RegisterInstance(vo.RegisterInstanceParam{
		Ip:          ip,
		Port:        port,
		ServiceName: serviceName,
		Weight:      10,
		Enable:      true,
		Healthy:     true,
		Ephemeral:   true,
		GroupName:   c.group,
	})
	return err
}

// GetService 獲取服務實例
func (c *NacosClient) GetService(serviceName string) ([]model.Instance, error) {
	instances, err := c.namingClient.SelectInstances(vo.SelectInstancesParam{
		ServiceName: serviceName,
		GroupName:   c.group,
		HealthyOnly: true,
	})
	if err != nil {
		return nil, err
	}
	return instances, nil
}

// Subscribe 訂閱服務變更
func (c *NacosClient) Subscribe(serviceName string, onChange func([]model.Instance)) error {
	return c.namingClient.Subscribe(&vo.SubscribeParam{
		ServiceName: serviceName,
		GroupName:   c.group,
		// 直接使用 model.Instance 作為回調參數類型
		SubscribeCallback: func(services []model.Instance, err error) {
			if err != nil {
				fmt.Printf("watch service error: %v\n", err)
				return
			}
			onChange(services)
		},
	})
}
