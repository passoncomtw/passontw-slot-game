package databaseManager

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/fx"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// PostgresConfig 存儲 PostgreSQL 連接的配置項
type PostgresConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
}

// postgresManagerImpl 是 DatabaseManager 介面的實作
type postgresManagerImpl struct {
	db *gorm.DB
}

// GetDB 返回 GORM DB 實例
func (p *postgresManagerImpl) GetDB() *gorm.DB {
	return p.db
}

// Close 關閉數據庫連接
func (p *postgresManagerImpl) Close() error {
	sqlDB, err := p.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}
	return sqlDB.Close()
}

// Transaction 實現事務操作
func (p *postgresManagerImpl) Transaction(ctx context.Context, fc func(tx *gorm.DB) error) error {
	return p.db.WithContext(ctx).Transaction(fc)
}

// Create 創建一個記錄
func (p *postgresManagerImpl) Create(ctx context.Context, value interface{}) error {
	return p.db.WithContext(ctx).Create(value).Error
}

// Save 更新一個記錄
func (p *postgresManagerImpl) Save(ctx context.Context, value interface{}) error {
	return p.db.WithContext(ctx).Save(value).Error
}

// Updates 更新多個字段
func (p *postgresManagerImpl) Updates(ctx context.Context, model interface{}, values interface{}) error {
	return p.db.WithContext(ctx).Model(model).Updates(values).Error
}

// Delete 刪除一個記錄
func (p *postgresManagerImpl) Delete(ctx context.Context, value interface{}) error {
	return p.db.WithContext(ctx).Delete(value).Error
}

// Find 查詢多個記錄
func (p *postgresManagerImpl) Find(ctx context.Context, dest interface{}, conds ...interface{}) error {
	return p.db.WithContext(ctx).Find(dest, conds...).Error
}

// First 查詢單個記錄
func (p *postgresManagerImpl) First(ctx context.Context, dest interface{}, conds ...interface{}) error {
	return p.db.WithContext(ctx).First(dest, conds...).Error
}

// Where 使用條件查詢
func (p *postgresManagerImpl) Where(query interface{}, args ...interface{}) *gorm.DB {
	return p.db.Where(query, args...)
}

// Order 排序
func (p *postgresManagerImpl) Order(value string) *gorm.DB {
	return p.db.Order(value)
}

// Limit 限制結果數量
func (p *postgresManagerImpl) Limit(limit int) *gorm.DB {
	return p.db.Limit(limit)
}

// Offset 設置結果偏移量
func (p *postgresManagerImpl) Offset(offset int) *gorm.DB {
	return p.db.Offset(offset)
}

// Count 計算記錄數量
func (p *postgresManagerImpl) Count(ctx context.Context, model interface{}, count *int64) error {
	return p.db.WithContext(ctx).Model(model).Count(count).Error
}

// Model 設置操作的模型
func (p *postgresManagerImpl) Model(value interface{}) *gorm.DB {
	return p.db.Model(value)
}

// Preload 預加載關聯
func (p *postgresManagerImpl) Preload(query string, args ...interface{}) *gorm.DB {
	return p.db.Preload(query, args...)
}

// NewPostgresManager 創建一個新的 PostgreSQL 數據庫管理器
func NewPostgresManager(config *PostgresConfig) (DatabaseManager, error) {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		config.Host,
		config.Port,
		config.User,
		config.Password,
		config.Name,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	db.Debug()

	// 設置連接池
	sqlDB.SetMaxOpenConns(10)           // 最大連接數
	sqlDB.SetMaxIdleConns(5)            // 最大空閒連接數
	sqlDB.SetConnMaxLifetime(time.Hour) // 連接最大生命週期

	// 驗證連接
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &postgresManagerImpl{db: db}, nil
}

// ProvidePostgresConfig 提供 PostgreSQL 配置，用於 fx
func ProvidePostgresConfig(cfg interface{}) *PostgresConfig {
	// 這裡需要根據實際的配置結構進行調整
	// 假設 cfg 是一個包含 Database 字段的結構
	config, ok := cfg.(interface {
		GetDatabaseHost() string
		GetDatabasePort() int
		GetDatabaseUser() string
		GetDatabasePassword() string
		GetDatabaseName() string
	})

	if !ok {
		// 如果無法轉換，返回默認配置
		return &PostgresConfig{
			Host:     "localhost",
			Port:     5432,
			User:     "postgres",
			Password: "postgres",
			Name:     "postgres",
		}
	}

	return &PostgresConfig{
		Host:     config.GetDatabaseHost(),
		Port:     config.GetDatabasePort(),
		User:     config.GetDatabaseUser(),
		Password: config.GetDatabasePassword(),
		Name:     config.GetDatabaseName(),
	}
}

// ProvideDatabaseManager 提供 DatabaseManager 實例，用於 fx
func ProvideDatabaseManager(lc fx.Lifecycle, config *PostgresConfig) (DatabaseManager, error) {
	manager, err := NewPostgresManager(config)
	if err != nil {
		return nil, err
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			fmt.Println("Database connected successfully")
			return nil
		},
		OnStop: func(ctx context.Context) error {
			fmt.Println("Closing database connection...")
			return manager.Close()
		},
	})

	return manager, nil
}

// Module 創建 fx 模組，包含所有數據庫相關組件
var Module = fx.Module("database",
	fx.Provide(
		ProvidePostgresConfig,
		ProvideDatabaseManager,
	),
)
