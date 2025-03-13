package service

import (
	"passontw-slot-game/pkg/databaseManager"

	"gorm.io/gorm"
)

// ProvideGormDB 提供一個 *gorm.DB 實例
func ProvideGormDB(dbManager databaseManager.DatabaseManager) *gorm.DB {
	return dbManager.GetDB()
}
