package entity

import (
	"time"

	"gorm.io/gorm"
)

// Admin 管理員模型
type Admin struct {
	ID        string     `gorm:"primaryKey;column:admin_id;type:uuid" json:"admin_id"`
	Username  string     `gorm:"column:username;type:varchar(50);not null;uniqueIndex" json:"username" binding:"required,max=50"`
	Email     string     `gorm:"column:email;type:varchar(255);not null;uniqueIndex" json:"email" binding:"required,email,max=255"`
	Password  string     `gorm:"column:password_hash;type:varchar(255);not null" json:"-"`
	Role      string     `gorm:"column:role;type:user_role;not null;default:'admin'" json:"role"`
	IsActive  bool       `gorm:"column:is_active;not null;default:true" json:"is_active"`
	CreatedAt time.Time  `gorm:"column:created_at;not null;default:now()" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;not null;default:now()" json:"updated_at"`
	LastLogin *time.Time `gorm:"column:last_login_at" json:"last_login_at,omitempty"`
}

// TableName 指定資料表名稱
func (Admin) TableName() string {
	return "admin_users"
}

// BeforeCreate 在創建前執行
func (a *Admin) BeforeCreate(tx *gorm.DB) error {
	now := time.Now()
	a.CreatedAt = now
	a.UpdatedAt = now
	return nil
}

// BeforeUpdate 在更新前執行
func (a *Admin) BeforeUpdate(tx *gorm.DB) error {
	a.UpdatedAt = time.Now()
	return nil
}

// UpdateLastLogin 更新最後登入時間
func (a *Admin) UpdateLastLogin(tx *gorm.DB) error {
	now := time.Now()
	a.LastLogin = &now
	return tx.Model(a).Update("last_login_at", now).Error
}
