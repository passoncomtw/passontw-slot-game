package service

import (
	"game-api/pkg/databaseManager"

	"gorm.io/gorm"
)

func ProvideGormDB(dbManager databaseManager.DatabaseManager) *gorm.DB {
	return dbManager.GetDB()
}
