package models

import "time"

// OperationType 操作類型
type OperationType string

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

const (
	EntityUser        EntityType = "user"
	EntityGame        EntityType = "game"
	EntityTransaction EntityType = "transaction"
	EntitySetting     EntityType = "setting"
	EntityAdmin       EntityType = "admin"
	EntitySystem      EntityType = "system"
)

// AdminLogListRequest 操作日誌列表請求參數
type AdminLogListRequest struct {
	Page        int       `form:"page" json:"page" binding:"min=1" example:"1"`
	PageSize    int       `form:"page_size" json:"page_size" binding:"min=1,max=100" example:"10"`
	Search      string    `form:"search" json:"search" example:"新增遊戲"` // 操作內容或操作者模糊搜尋
	Operation   string    `form:"operation" json:"operation" example:"create"`
	EntityType  string    `form:"entity_type" json:"entity_type" example:"game"`
	StartDate   time.Time `form:"start_date" json:"start_date" time_format:"2006-01-02"`
	EndDate     time.Time `form:"end_date" json:"end_date" time_format:"2006-01-02"`
	SortBy      string    `form:"sort_by" json:"sort_by" example:"executed_at"`
	SortOrder   string    `form:"sort_order" json:"sort_order" example:"desc"` // asc, desc
	ExportToCSV bool      `form:"export" json:"export" example:"false"`
}

// AdminLogListResponse 操作日誌列表回應
type AdminLogListResponse struct {
	CurrentPage int               `json:"current_page" example:"1"`
	PageSize    int               `json:"page_size" example:"10"`
	TotalPages  int               `json:"total_pages" example:"10"`
	Total       int64             `json:"total" example:"100"`
	Logs        []AdminLogSummary `json:"logs"`
}

// AdminLogSummary 操作日誌摘要
type AdminLogSummary struct {
	ID          string        `json:"log_id" example:"d5a8b5e0-e8c0-4951-b3b4-71a6b7f3d9a1"`
	AdminID     string        `json:"admin_id,omitempty" example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	AdminName   string        `json:"admin_name" example:"陳管理員"`
	Operation   OperationType `json:"operation" example:"create"`
	EntityType  EntityType    `json:"entity_type" example:"game"`
	EntityID    string        `json:"entity_id,omitempty" example:"G007"`
	Description string        `json:"description" example:"新增遊戲「神龍寶藏」"`
	IPAddress   string        `json:"ip_address,omitempty" example:"192.168.1.100"`
	UserAgent   string        `json:"user_agent,omitempty" example:"Chrome/Windows"`
	Status      string        `json:"status" example:"success"`
	ExecutedAt  time.Time     `json:"executed_at" example:"2024-06-15T15:20:36Z"`
}

// AdminLogStatsResponse 操作日誌統計回應
type AdminLogStatsResponse struct {
	TotalLogs              int             `json:"total_logs" example:"187"`
	CreateOperations       int             `json:"create_operations" example:"45"`
	UpdateOperations       int             `json:"update_operations" example:"72"`
	DeleteOperations       int             `json:"delete_operations" example:"12"`
	LoginOperations        int             `json:"login_operations" example:"23"`
	OtherOperations        int             `json:"other_operations" example:"35"`
	EntityTypeDistribution map[string]int  `json:"entity_type_distribution"`
	AdminActivityRanking   []AdminActivity `json:"admin_activity_ranking"`
	StartDate              string          `json:"start_date" example:"2024-06-15"`
	EndDate                string          `json:"end_date" example:"2024-06-15"`
}

// AdminActivity 管理員活動統計
type AdminActivity struct {
	AdminID   string `json:"admin_id" example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	AdminName string `json:"admin_name" example:"陳管理員"`
	Count     int    `json:"count" example:"45"`
}

// LogExportRequest 日誌匯出請求
type LogExportRequest struct {
	StartDate  time.Time `form:"start_date" json:"start_date" time_format:"2006-01-02"`
	EndDate    time.Time `form:"end_date" json:"end_date" time_format:"2006-01-02"`
	Operation  string    `form:"operation" json:"operation" example:"all"`     // all, create, update, delete, login, logout, export, import, other
	EntityType string    `form:"entity_type" json:"entity_type" example:"all"` // all, user, game, transaction, setting, admin, system
}
