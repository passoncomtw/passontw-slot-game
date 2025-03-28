package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// OperationType 操作類型
type OperationType string

// 操作類型常量
const (
	OperationCreate OperationType = "create"
	OperationRead   OperationType = "read"
	OperationUpdate OperationType = "update"
	OperationDelete OperationType = "delete"
	OperationLogin  OperationType = "login"
	OperationLogout OperationType = "logout"
	OperationExport OperationType = "export"
	OperationImport OperationType = "import"
	OperationOther  OperationType = "other"
)

// EntityType 操作對象類型
type EntityType string

// 操作對象類型常量
const (
	EntityUser        EntityType = "user"
	EntityGame        EntityType = "game"
	EntityTransaction EntityType = "transaction"
	EntitySetting     EntityType = "setting"
	EntityAdmin       EntityType = "admin"
	EntitySystem      EntityType = "system"
)

// AdminOperationLog 管理員操作日誌實體
type AdminOperationLog struct {
	ID           uuid.UUID      `gorm:"primaryKey;column:log_id;type:uuid" json:"log_id"`
	AdminID      *uuid.UUID     `gorm:"column:admin_id;type:uuid" json:"admin_id"`
	Operation    OperationType  `gorm:"column:operation;type:operation_type;not null" json:"operation"`
	EntityType   EntityType     `gorm:"column:entity_type;type:entity_type;not null" json:"entity_type"`
	EntityID     *string        `gorm:"column:entity_id;type:varchar(100)" json:"entity_id"`
	Description  string         `gorm:"column:description;type:text;not null" json:"description"`
	IPAddress    *string        `gorm:"column:ip_address;type:varchar(45)" json:"ip_address"`
	UserAgent    *string        `gorm:"column:user_agent;type:text" json:"user_agent"`
	RequestData  datatypes.JSON `gorm:"column:request_data;type:jsonb" json:"request_data"`
	ResponseData datatypes.JSON `gorm:"column:response_data;type:jsonb" json:"response_data"`
	Status       string         `gorm:"column:status;type:varchar(20);not null;default:'success'" json:"status"`
	ExecutedAt   time.Time      `gorm:"column:executed_at;type:timestamptz;not null;default:now()" json:"executed_at"`
}

// TableName 指定資料表名稱
func (AdminOperationLog) TableName() string {
	return "admin_operation_logs"
}

// BeforeCreate 在創建前執行
func (l *AdminOperationLog) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	if l.ExecutedAt.IsZero() {
		l.ExecutedAt = time.Now()
	}
	return nil
}
