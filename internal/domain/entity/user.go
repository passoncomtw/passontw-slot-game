package entity

import (
	"time"
)

// User 資料表結構
// CREATE TABLE "public"."users" (
//
//	"id" int4 NOT NULL DEFAULT nextval('users_id_seq'::regclass),
//	"created_at" timestamp NOT NULL DEFAULT now(),
//	"updated_at" timestamp NOT NULL DEFAULT now(),
//	"deleted_at" timestamp,
//	"name" varchar(20) NOT NULL,
//	"phone" varchar(20) NOT NULL,
//	"password" varchar(200) NOT NULL,
//	PRIMARY KEY ("id")
//
// );
type User struct {
	ID        int        `gorm:"primaryKey;column:id" json:"id" example:"1"`
	CreatedAt time.Time  `gorm:"column:created_at;not null;default:now()" json:"created_at" example:"2025-02-16T16:05:00.763995Z"`
	UpdatedAt time.Time  `gorm:"column:updated_at;not null;default:now()" json:"updated_at" example:"2025-02-16T16:05:00.763995Z"`
	DeletedAt *time.Time `gorm:"column:deleted_at" json:"deleted_at,omitempty" example:"2025-02-16T16:05:00.763995Z"`
	Name      string     `gorm:"column:name;type:varchar(20);not null" json:"name" binding:"required,max=20" example:"testdemo001"`
	Phone     string     `gorm:"column:phone;type:varchar(20);not null" json:"phone" binding:"required,max=20" example:"0987654321"`
	Password  string     `gorm:"column:password;type:varchar(200);not null" json:"-"`
}

// TableName 指定資料表名稱
func (User) TableName() string {
	return "users"
}

// BeforeCreate 在創建記錄前自動設置時間戳
func (u *User) BeforeCreate() error {
	now := time.Now()
	u.CreatedAt = now
	u.UpdatedAt = now
	return nil
}

// BeforeUpdate 在更新記錄前自動更新時間戳
func (u *User) BeforeUpdate() error {
	u.UpdatedAt = time.Now()
	return nil
}
