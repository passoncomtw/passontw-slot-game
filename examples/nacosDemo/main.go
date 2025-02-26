package main

import (
	"encoding/json"
	"fmt"
	"log"
	"nacos-demo/nacos"
	"time"

	"github.com/nacos-group/nacos-sdk-go/v2/model"
)

// AppConfig 應用配置結構
type AppConfig struct {
	Database struct {
		Host     string `json:"host"`
		Port     int    `json:"port"`
		Username string `json:"username"`
		Password string `json:"password"`
		DBName   string `json:"dbname"`
	} `json:"database"`
	Redis struct {
		Host     string `json:"host"`
		Port     int    `json:"port"`
		Password string `json:"password"`
		DB       int    `json:"db"`
	} `json:"redis"`
}

func main() {
	// 創建 Nacos 客戶端
	client, err := nacos.NewNacosClient(&nacos.NacosConfig{
		Endpoints: []string{"172.237.27.51"},
		Port:      8848,
		Namespace: "test_golang",
		Group:     "TEST_GOLANG_ENVS",
		Username:  "nacos",
		Password:  "xup6jo3fup6",
	})
	if err != nil {
		log.Fatalf("create nacos client error: %v", err)
	}

	// 獲取配置
	var config AppConfig
	err = client.GetConfig("slot_game_config", &config)
	if err != nil {
		log.Fatalf("get config error: %v", err)
	}
	fmt.Printf("Initial config: %+v\n", config)

	// 監聽配置變更
	err = client.ListenConfig("slot_game_config", func(data string) {
		var newConfig AppConfig
		if err := json.Unmarshal([]byte(data), &newConfig); err != nil {
			log.Printf("parse new config error: %v", err)
			return
		}
		fmt.Printf("Config changed: %+v\n", newConfig)
		// 這裡可以重新加載應用配置
	})
	if err != nil {
		log.Fatalf("listen config error: %v", err)
	}

	// 註冊服務
	err = client.RegisterInstance("slot_game_config", "172.237.27.51", 8848)
	if err != nil {
		log.Fatalf("register service error: %v", err)
	}

	// 獲取服務實例
	instances, err := client.GetService("slot_game_config")
	if err != nil {
		log.Fatalf("get service error: %v", err)
	}
	fmt.Printf("Service instances: %+v\n", instances)

	// 訂閱服務變更
	err = client.Subscribe("slot_game_config", func(instances []model.Instance) {
		fmt.Printf("Service instances changed: %+v\n", instances)
	})
	if err != nil {
		log.Fatalf("subscribe service error: %v", err)
	}

	// 保持程序運行
	for {
		time.Sleep(time.Second)
	}
}
