package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AdminDashboardStats 管理員儀表板統計數據
type AdminDashboardStats struct {
	ID               uuid.UUID      `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	StatDate         time.Time      `gorm:"type:date;not null;uniqueIndex:idx_stat_date"`
	TotalDeposits    float64        `gorm:"type:decimal(18,2);not null;default:0"`
	TotalWithdrawals float64        `gorm:"type:decimal(18,2);not null;default:0"`
	ActiveUsers      int            `gorm:"type:int;not null;default:0"`
	NewUsers         int            `gorm:"type:int;not null;default:0"`
	GamePlayed       int            `gorm:"type:int;not null;default:0"`
	CreatedAt        time.Time      `gorm:"autoCreateTime"`
	UpdatedAt        time.Time      `gorm:"autoUpdateTime"`
	DeletedAt        gorm.DeletedAt `gorm:"index"`
}

// TableName 指定表名
func (AdminDashboardStats) TableName() string {
	return "admin_dashboard_stats"
}
