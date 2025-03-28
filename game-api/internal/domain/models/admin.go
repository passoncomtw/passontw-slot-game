package models

import "time"

// Admin 管理員模型
type Admin struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"not null"`
	Name      string    `json:"name" gorm:"size:50;not null"`
	Role      string    `json:"role" gorm:"default:admin;not null"` // admin, super_admin
	LastLogin time.Time `json:"last_login"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 指定表名為admins
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
	ID        uint      `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
	LastLogin time.Time `json:"last_login"`
	CreatedAt time.Time `json:"created_at"`
}
