package main

import (
	"context"
	"fmt"
	"log"
	"time"

	redismanager "passontw-slot-game/pkg/redisManager"

	"github.com/redis/go-redis/v9"
)

func main() {
	// 創建 Redis 管理器實例
	// 使用你提供的參數: ip=127.0.0.1, user=default, 無密碼
	redisManager, err := redismanager.NewRedisManager("127.0.0.1:6379", "default", "", 0)
	if err != nil {
		log.Fatalf("Failed to create Redis manager: %v", err)
	}
	defer redisManager.Close()

	// 創建 context
	ctx := context.Background()

	// 測試連接
	if err := redisManager.Ping(ctx); err != nil {
		log.Fatalf("Failed to ping Redis: %v", err)
	}
	fmt.Println("Successfully connected to Redis")

	// 示範基本操作
	err = redisManager.Set(ctx, "hello1", "world111", 1*time.Minute)
	if err != nil {
		log.Fatalf("Failed to set key: %v", err)
	}

	value, err := redisManager.Get(ctx, "hello1")
	if err != nil {
		log.Fatalf("Failed to get key: %v", err)
	}
	fmt.Printf("Value for key 'hello1': %s\n", value)

	// 示範哈希操作
	err = redisManager.HSet(ctx, "user:1000", "name", "John Doe")
	if err != nil {
		log.Fatalf("Failed to set hash field: %v", err)
	}
	err = redisManager.HSet(ctx, "user:1000", "email", "john@example.com")
	if err != nil {
		log.Fatalf("Failed to set hash field: %v", err)
	}

	userInfo, err := redisManager.HGetAll(ctx, "user:1000")
	if err != nil {
		log.Fatalf("Failed to get hash: %v", err)
	}
	fmt.Println("User info:", userInfo)

	// 示範列表操作
	err = redisManager.LPush(ctx, "recent_users", "user:1000", "user:1001", "user:1002")
	if err != nil {
		log.Fatalf("Failed to push to list: %v", err)
	}

	recentUsers, err := redisManager.LRange(ctx, "recent_users", 0, 1)
	if err != nil {
		log.Fatalf("Failed to get list range: %v", err)
	}
	fmt.Println("Recent users:", recentUsers)

	// 示範事務操作
	err = redisManager.Watch(ctx, func(tx *redis.Tx) error {
		// 在事務中執行操作
		_, err := tx.Get(ctx, "hello1").Result()
		if err != nil && err != redis.Nil {
			return err
		}

		// 執行事務
		_, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
			pipe.Set(ctx, "hello1", "updated-world", 1*time.Minute) //一分鐘後過期
			return nil
		})
		return err
	}, "hello1")

	if err != nil {
		log.Fatalf("Transaction failed: %v", err)
	}

	// 確認事務結果
	updatedValue, err := redisManager.Get(ctx, "hello1")
	if err != nil {
		log.Fatalf("Failed to get updated key: %v", err)
	}
	fmt.Printf("Updated value for key 'hello1': %s\n", updatedValue)

	fmt.Println("All operations completed successfully")
}
