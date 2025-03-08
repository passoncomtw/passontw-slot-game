package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// 導出 redis.Nil 以便使用者可以處理找不到鍵的情況
var Nil = redis.Nil

// 輔助函數，檢查錯誤是否表示鍵不存在
func IsKeyNotExist(err error) bool {
	return err == redis.Nil
}

type RedisManager interface {
	// 基本操作
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Get(ctx context.Context, key string) (string, error)
	Delete(ctx context.Context, keys ...string) error
	Exists(ctx context.Context, key string) (bool, error)

	// 過期時間操作
	Expire(ctx context.Context, key string, expiration time.Duration) (bool, error)
	TTL(ctx context.Context, key string) (time.Duration, error)

	// 哈希操作
	HSet(ctx context.Context, key string, field string, value interface{}) error
	HGet(ctx context.Context, key string, field string) (string, error)
	HGetAll(ctx context.Context, key string) (map[string]string, error)
	HDel(ctx context.Context, key string, fields ...string) error

	// 列表操作
	LPush(ctx context.Context, key string, values ...interface{}) error
	RPush(ctx context.Context, key string, values ...interface{}) error
	LRange(ctx context.Context, key string, start, stop int64) ([]string, error)

	// 集合操作
	SAdd(ctx context.Context, key string, members ...interface{}) error
	SMembers(ctx context.Context, key string) ([]string, error)
	SRem(ctx context.Context, key string, members ...interface{}) error

	// 有序集合操作
	ZAdd(ctx context.Context, key string, score float64, member string) error
	ZRange(ctx context.Context, key string, start, stop int64) ([]string, error)

	// 事務操作
	Watch(ctx context.Context, fn func(*redis.Tx) error, keys ...string) error

	// 連接管理
	Close() error
	Ping(ctx context.Context) error
}

// redisManagerImpl 是 RedisManager 介面的實作
type redisManagerImpl struct {
	client *redis.Client
}

// NewRedisManager 創建並返回一個新的 RedisManager 實例
func NewRedisManager(addr, username, password string, db int) (RedisManager, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Username: username,
		Password: password,
		DB:       db,
	})

	// 測試連接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &redisManagerImpl{
		client: client,
	}, nil
}

// 實作基本操作

func (r *redisManagerImpl) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return r.client.Set(ctx, key, value, expiration).Err()
}

func (r *redisManagerImpl) Get(ctx context.Context, key string) (string, error) {
	result, err := r.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("key %s does not exist", key)
	}
	return result, err
}

func (r *redisManagerImpl) Delete(ctx context.Context, keys ...string) error {
	return r.client.Del(ctx, keys...).Err()
}

func (r *redisManagerImpl) Exists(ctx context.Context, key string) (bool, error) {
	result, err := r.client.Exists(ctx, key).Result()
	return result > 0, err
}

// 實作哈希操作
func (r *redisManagerImpl) HSet(ctx context.Context, key string, field string, value interface{}) error {
	return r.client.HSet(ctx, key, field, value).Err()
}

func (r *redisManagerImpl) HGet(ctx context.Context, key string, field string) (string, error) {
	result, err := r.client.HGet(ctx, key, field).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("field %s in key %s does not exist", field, key)
	}
	return result, err
}

func (r *redisManagerImpl) HGetAll(ctx context.Context, key string) (map[string]string, error) {
	return r.client.HGetAll(ctx, key).Result()
}

func (r *redisManagerImpl) HDel(ctx context.Context, key string, fields ...string) error {
	return r.client.HDel(ctx, key, fields...).Err()
}

// 實作列表操作

func (r *redisManagerImpl) LPush(ctx context.Context, key string, values ...interface{}) error {
	return r.client.LPush(ctx, key, values...).Err()
}

func (r *redisManagerImpl) RPush(ctx context.Context, key string, values ...interface{}) error {
	return r.client.RPush(ctx, key, values...).Err()
}

func (r *redisManagerImpl) LRange(ctx context.Context, key string, start, stop int64) ([]string, error) {
	return r.client.LRange(ctx, key, start, stop).Result()
}

// 實作集合操作

func (r *redisManagerImpl) SAdd(ctx context.Context, key string, members ...interface{}) error {
	return r.client.SAdd(ctx, key, members...).Err()
}

func (r *redisManagerImpl) SMembers(ctx context.Context, key string) ([]string, error) {
	return r.client.SMembers(ctx, key).Result()
}

func (r *redisManagerImpl) SRem(ctx context.Context, key string, members ...interface{}) error {
	return r.client.SRem(ctx, key, members...).Err()
}

// 實作有序集合操作

func (r *redisManagerImpl) ZAdd(ctx context.Context, key string, score float64, member string) error {
	z := redis.Z{
		Score:  score,
		Member: member,
	}
	return r.client.ZAdd(ctx, key, z).Err()
}

func (r *redisManagerImpl) ZRange(ctx context.Context, key string, start, stop int64) ([]string, error) {
	return r.client.ZRange(ctx, key, start, stop).Result()
}

// 實作事務操作

func (r *redisManagerImpl) Watch(ctx context.Context, fn func(*redis.Tx) error, keys ...string) error {
	return r.client.Watch(ctx, fn, keys...)
}

// 實作連接管理

func (r *redisManagerImpl) Close() error {
	return r.client.Close()
}

func (r *redisManagerImpl) Ping(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}

// 實作過期時間操作
func (r *redisManagerImpl) Expire(ctx context.Context, key string, expiration time.Duration) (bool, error) {
	return r.client.Expire(ctx, key, expiration).Result()
}

func (r *redisManagerImpl) TTL(ctx context.Context, key string) (time.Duration, error) {
	return r.client.TTL(ctx, key).Result()
}
