package databaseManager

import (
	"context"

	"gorm.io/gorm"
)

// DatabaseManager 提供數據庫操作的介面
type DatabaseManager interface {
	// 獲取 GORM 資料庫實例
	GetDB() *gorm.DB

	// 關閉數據庫連接
	Close() error

	// 事務相關
	Transaction(ctx context.Context, fc func(tx *gorm.DB) error) error

	// 基礎 CRUD 操作
	Create(ctx context.Context, value interface{}) error
	Save(ctx context.Context, value interface{}) error
	Updates(ctx context.Context, model interface{}, values interface{}) error
	Delete(ctx context.Context, value interface{}) error

	// 查詢相關
	Find(ctx context.Context, dest interface{}, conds ...interface{}) error
	First(ctx context.Context, dest interface{}, conds ...interface{}) error
	Where(query interface{}, args ...interface{}) *gorm.DB
	Model(value interface{}) *gorm.DB
	Order(value string) *gorm.DB
	Limit(limit int) *gorm.DB
	Offset(offset int) *gorm.DB
	Count(ctx context.Context, model interface{}, count *int64) error
	Preload(query string, args ...interface{}) *gorm.DB
}
