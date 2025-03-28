package config

import (
	"context"
	"fmt"
	"time"

	"game-api/pkg/logger"
	"game-api/pkg/nacosManager"

	"github.com/nacos-group/nacos-sdk-go/vo"
	"go.uber.org/fx"
	"gopkg.in/yaml.v3"
)

var Module = fx.Module("config",
	fx.Provide(
		ProvideConfig,
	),
)

func ProvideConfig(lc fx.Lifecycle, nacosClient nacosManager.NacosClient, logger logger.Logger) (*Config, error) {
	cfg := initializeConfig()

	logger.Info(fmt.Sprintf("Nacos配置: Host=%s, Port=%d, Namespace=%s, Group=%s, DataId=%s, EnableNacos=%v",
		cfg.Nacos.Host, cfg.Nacos.Port, cfg.Nacos.NamespaceId, cfg.Nacos.Group, cfg.Nacos.DataId, cfg.EnableNacos))

	if !cfg.EnableNacos {
		logger.Info("Nacos配置未啟用，使用本地配置")
		return cfg, nil
	}

	return configureWithNacos(lc, nacosClient, logger, cfg)
}

func configureWithNacos(lc fx.Lifecycle, nacosClient nacosManager.NacosClient, logger logger.Logger, cfg *Config) (*Config, error) {
	logger.Info("嘗試從Nacos獲取配置...")

	content, err := nacosClient.GetConfig(cfg.Nacos.DataId, cfg.Nacos.Group)
	if err != nil {
		logger.Info(fmt.Sprintf("從Nacos獲取配置失敗: %v", err))
		return cfg, nil
	}

	var nacosAppConfig NacosAppConfig
	if err = yaml.Unmarshal([]byte(content), &nacosAppConfig); err != nil {
		logger.Info(fmt.Sprintf("解析Nacos配置失敗: %v", err))
		return cfg, nil
	}

	logger.Info(fmt.Sprintf("原始數據庫配置: Host=%s, Port=%d, User=%s, Name=%s",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Name))

	updateConfigFromNacos(cfg, &nacosAppConfig)

	logger.Info(fmt.Sprintf("更新後數據庫配置: Host=%s, Port=%d, User=%s, Name=%s",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Name))
	logger.Info("成功從Nacos加載配置")

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			setupConfigListener(nacosClient, logger, cfg)
			registerServiceToNacos(nacosClient, logger, cfg)

			return nil
		},
		OnStop: func(ctx context.Context) error {
			return nil
		},
	})

	return cfg, nil
}

func setupConfigListener(nacosClient nacosManager.NacosClient, logger logger.Logger, cfg *Config) {
	err := nacosClient.ListenConfig(cfg.Nacos.DataId, cfg.Nacos.Group, func(newContent string) {
		logger.Info("Nacos配置已更改")

		var newNacosConfig NacosAppConfig
		if err := yaml.Unmarshal([]byte(newContent), &newNacosConfig); err != nil {
			logger.Info(fmt.Sprintf("解析新的Nacos配置失敗: %v", err))
			return
		}

		updateConfigFromNacos(cfg, &newNacosConfig)
		logger.Info("配置已動態更新")
	})

	if err != nil {
		logger.Info(fmt.Sprintf("設置Nacos配置監聽失敗: %v", err))
	}
}

func registerServiceToNacos(nacosClient nacosManager.NacosClient, logger logger.Logger, cfg *Config) {
	// 檢查 Nacos 客戶端是否有效
	if nacosClient == nil {
		logger.Info("Nacos 客戶端為空，無法註冊服務")
		return
	}

	// 創建註冊參數
	param := createServiceRegistrationParam(cfg)

	// 輸出詳細的註冊信息
	logger.Info(fmt.Sprintf("正在嘗試註冊服務到 Nacos: ServiceName=%s, IP=%s, Port=%d, Group=%s, Version=%s",
		param.ServiceName, param.Ip, param.Port, param.GroupName, param.Metadata["version"]))

	// 嘗試多次註冊
	maxRetries := 3
	retryCount := 0
	registerSuccess := false
	var lastError error

	for retryCount < maxRetries && !registerSuccess {
		if retryCount > 0 {
			logger.Info(fmt.Sprintf("重試註冊服務到 Nacos (第 %d 次嘗試)", retryCount+1))
			time.Sleep(time.Duration(retryCount) * time.Second) // 增加重試間隔
		}

		success, err := nacosClient.RegisterInstance(param)
		if err != nil {
			lastError = err
			logger.Info(fmt.Sprintf("第 %d 次註冊服務到 Nacos 失敗: %v", retryCount+1, err))
			retryCount++
			continue
		}

		if success {
			registerSuccess = true
			logger.Info("服務已成功註冊到 Nacos")

			// 註冊成功後，檢查服務是否可被發現
			checkParam := vo.GetServiceParam{
				ServiceName: param.ServiceName,
				GroupName:   param.GroupName,
			}

			// 不阻塞主流程，使用 goroutine 進行檢查
			go func() {
				time.Sleep(1 * time.Second) // 等待註冊生效

				service, err := nacosClient.GetService(checkParam)
				if err != nil {
					logger.Info(fmt.Sprintf("無法獲取已註冊的服務信息: %v", err))
					return
				}

				logger.Info(fmt.Sprintf("服務註冊確認: 服務名=%s, 實例數=%d",
					service.Name, len(service.Hosts)))

				for i, host := range service.Hosts {
					if i < 5 { // 只顯示前 5 個實例
						logger.Info(fmt.Sprintf("實例 #%d: IP=%s, Port=%d, Healthy=%t",
							i+1, host.Ip, host.Port, host.Healthy))
					}
				}
			}()

			break
		} else {
			logger.Info(fmt.Sprintf("第 %d 次註冊服務到 Nacos 返回失敗", retryCount+1))
			retryCount++
		}
	}

	if !registerSuccess {
		logger.Info(fmt.Sprintf("在 %d 次嘗試後，註冊服務到 Nacos 失敗: %v", maxRetries, lastError))
	}
}
