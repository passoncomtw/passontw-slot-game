package models

// AdminUserListRequest 後台用戶列表請求參數
type AdminUserListRequest struct {
	Page     int    `form:"page" json:"page" binding:"min=1" example:"1"`
	PageSize int    `form:"page_size" json:"page_size" binding:"min=1,max=100" example:"10"`
	Status   string `form:"status" json:"status" example:"active"` // active, inactive, pending, all
	Search   string `form:"search" json:"search" example:"王小明"`    // 搜尋關鍵字
}

// AdminUserListResponse 後台用戶列表回應
type AdminUserListResponse struct {
	CurrentPage int                `json:"current_page" example:"1"`
	PageSize    int                `json:"page_size" example:"10"`
	TotalPages  int                `json:"total_pages" example:"10"`
	Total       int64              `json:"total" example:"100"`
	Users       []AdminUserSummary `json:"users"`
}

// AdminUserSummary 後台用戶摘要信息 - 用於列表顯示
type AdminUserSummary struct {
	ID        uint    `json:"id" example:"1"`
	Username  string  `json:"username" example:"王小明"`
	Email     string  `json:"email" example:"wangxiaoming@example.com"`
	Avatar    string  `json:"avatar_url" example:"https://example.com/avatar.jpg"`
	Balance   float64 `json:"balance" example:"3250.00"`
	Status    string  `json:"status" example:"active"`         // active, inactive, pending
	CreatedAt string  `json:"created_at" example:"2024-04-15"` // 格式化後的日期
}

// AdminChangeUserStatusRequest 後台變更用戶狀態請求
type AdminChangeUserStatusRequest struct {
	UserID uint   `json:"user_id" binding:"required" example:"1"`
	Status string `json:"status" binding:"required,oneof=active inactive pending" example:"inactive"`
}

// AdminDepositRequest 後台儲值請求
type AdminDepositRequest struct {
	UserID        uint    `json:"user_id" binding:"required" example:"1"`
	Amount        float64 `json:"amount" binding:"required,gt=0" example:"500"`
	PaymentMethod string  `json:"payment_method" example:"信用卡"`
	Description   string  `json:"description" example:"VIP用戶充值優惠"`
}
