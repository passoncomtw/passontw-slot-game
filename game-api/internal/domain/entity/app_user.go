package entity

import (
	"time"

	"gorm.io/gorm"
)

// 用戶角色類型
type UserRole string

const (
	RoleUser  UserRole = "user"
	RoleVIP   UserRole = "vip"
	RoleAdmin UserRole = "admin"
)

// 認證提供商類型
type AuthProvider string

const (
	AuthEmail    AuthProvider = "email"
	AuthGoogle   AuthProvider = "google"
	AuthFacebook AuthProvider = "facebook"
	AuthApple    AuthProvider = "apple"
)

// AppUser 應用用戶模型
type AppUser struct {
	ID             string       `gorm:"primaryKey;column:user_id;type:uuid" json:"user_id"`
	Username       string       `gorm:"column:username;type:varchar(50);not null;uniqueIndex" json:"username" binding:"required,max=50"`
	Email          string       `gorm:"column:email;type:varchar(255);not null;uniqueIndex" json:"email" binding:"required,email,max=255"`
	Password       string       `gorm:"column:password_hash;type:varchar(255)" json:"-"`
	AuthProvider   AuthProvider `gorm:"column:auth_provider;type:auth_provider;not null;default:'email'" json:"auth_provider"`
	AuthProviderID *string      `gorm:"column:auth_provider_id;type:varchar(255)" json:"auth_provider_id,omitempty"`
	Role           UserRole     `gorm:"column:role;type:user_role;not null;default:'user'" json:"role"`
	VIPLevel       int          `gorm:"column:vip_level;not null;default:0" json:"vip_level"`
	Points         int          `gorm:"column:points;not null;default:0" json:"points"`
	AvatarURL      *string      `gorm:"column:avatar_url;type:varchar(255)" json:"avatar_url,omitempty"`
	IsVerified     bool         `gorm:"column:is_verified;not null;default:false" json:"is_verified"`
	IsActive       bool         `gorm:"column:is_active;not null;default:true" json:"is_active"`
	CreatedAt      time.Time    `gorm:"column:created_at;not null;default:now()" json:"created_at"`
	UpdatedAt      time.Time    `gorm:"column:updated_at;not null;default:now()" json:"updated_at"`
	LastLogin      *time.Time   `gorm:"column:last_login_at" json:"last_login_at,omitempty"`
}

// TableName 指定資料表名稱
func (AppUser) TableName() string {
	return "users"
}

// BeforeCreate 在創建前執行
func (u *AppUser) BeforeCreate(tx *gorm.DB) error {
	now := time.Now()
	u.CreatedAt = now
	u.UpdatedAt = now
	return nil
}

// BeforeUpdate 在更新前執行
func (u *AppUser) BeforeUpdate(tx *gorm.DB) error {
	u.UpdatedAt = time.Now()
	return nil
}

// UpdateLastLogin 更新最後登入時間
func (u *AppUser) UpdateLastLogin(tx *gorm.DB) error {
	now := time.Now()
	u.LastLogin = &now
	return tx.Model(u).Update("last_login_at", now).Error
}
