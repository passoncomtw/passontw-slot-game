package models

import "time"

// Admin 管理員模型
type Admin struct {
	ID               string    `json:"admin_id" gorm:"primaryKey;column:admin_id;type:uuid"`
	Username         string    `json:"username" gorm:"column:username;type:varchar(50);not null;uniqueIndex"`
	Email            string    `json:"email" gorm:"column:email;type:varchar(255);not null;uniqueIndex"`
	Password         string    `json:"-" gorm:"column:password_hash;type:varchar(255);not null"`
	FullName         string    `json:"full_name" gorm:"column:full_name;type:varchar(100);not null"`
	Role             string    `json:"role" gorm:"column:role;type:admin_role;not null;default:'operator'"`
	AvatarURL        string    `json:"avatar_url,omitempty" gorm:"column:avatar_url;type:varchar(255)"`
	IsActive         bool      `json:"is_active" gorm:"column:is_active;not null;default:true"`
	LastLogin        time.Time `json:"last_login_at,omitempty" gorm:"column:last_login_at"`
	LastLoginIP      string    `json:"last_login_ip,omitempty" gorm:"column:last_login_ip;type:varchar(45)"`
	FailedLoginCount int       `json:"-" gorm:"column:failed_login_attempts;not null;default:0"`
	LockedUntil      time.Time `json:"-" gorm:"column:locked_until"`
	CreatedAt        time.Time `json:"created_at" gorm:"column:created_at;not null;default:now()"`
	UpdatedAt        time.Time `json:"updated_at" gorm:"column:updated_at;not null;default:now()"`
	CreatedBy        string    `json:"created_by,omitempty" gorm:"column:created_by;type:uuid"`
}

// TableName 指定表名為admin_users
func (Admin) TableName() string {
	return "admin_users"
}

// AdminLoginRequest 管理員登入請求
type AdminLoginRequest struct {
	Email    string `json:"email" binding:"required,email" example:"admin@example.com"`
	Password string `json:"password" binding:"required" example:"admin123"`
}

// AdminResponse 管理員回應結構
type AdminResponse struct {
	ID        string    `json:"admin_id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	AvatarURL string    `json:"avatar_url,omitempty"`
	IsActive  bool      `json:"is_active"`
	LastLogin time.Time `json:"last_login_at,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
