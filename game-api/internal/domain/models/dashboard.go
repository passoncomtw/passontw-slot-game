package models

import "time"

// DashboardRequest 儀表板請求
type DashboardRequest struct {
	TimeRange string `form:"time_range" json:"time_range" example:"today"` // today, week, month, year
}

// DashboardResponse 儀表板資料回應
type DashboardResponse struct {
	Summary       DashboardSummary     `json:"summary"`
	Income        []TimeSeriesData     `json:"income"`
	PopularGames  []GameStatistic      `json:"popular_games"`
	Transactions  []RecentTransaction  `json:"recent_transactions"`
	Notifications []SystemNotification `json:"notifications"`
}

// DashboardSummary 儀表板摘要數據
type DashboardSummary struct {
	TotalIncome      float64 `json:"total_income" example:"128430.00"`
	IncomePercentage float64 `json:"income_percentage" example:"12.5"`
	ActiveUsers      int     `json:"active_users" example:"3721"`
	UsersPercentage  float64 `json:"users_percentage" example:"8.2"`
	TotalGames       int     `json:"total_games" example:"47"`
	NewGames         int     `json:"new_games" example:"3"`
	AIEffectiveness  float64 `json:"ai_effectiveness" example:"92.7"`
	AIImprovement    float64 `json:"ai_improvement" example:"5.3"`
	CurrentDate      string  `json:"current_date" example:"2024-06-15"`
	AdminName        string  `json:"admin_name" example:"陳管理員"`
	AdminRole        string  `json:"admin_role" example:"超級管理員"`
}

// TimeSeriesData 時間序列數據
type TimeSeriesData struct {
	Time  string  `json:"time" example:"2024-06-15 10:00"`
	Value float64 `json:"value" example:"5432.10"`
}

// GameStatistic 遊戲統計
type GameStatistic struct {
	GameID     string  `json:"game_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name       string  `json:"name" example:"幸運七"`
	Icon       string  `json:"icon" example:"dice"`
	IconColor  string  `json:"icon_color" example:"#6200EA"` // primary-color
	Value      float64 `json:"value" example:"42580.00"`
	Percentage float64 `json:"percentage" example:"85.0"`
}

// RecentTransaction 最近交易
type RecentTransaction struct {
	ID          string    `json:"id" example:"T2024061500001"`
	Type        string    `json:"type" example:"deposit"` // deposit, withdraw
	Amount      float64   `json:"amount" example:"200.00"`
	Username    string    `json:"username" example:"王小明"`
	UserID      string    `json:"user_id" example:"U001"`
	Time        time.Time `json:"time" example:"2024-06-15T15:20:36Z"`
	TimeDisplay string    `json:"time_display" example:"10分鐘前"`
}

// SystemNotification 系統通知
type SystemNotification struct {
	ID          string    `json:"id" example:"N001"`
	Type        string    `json:"type" example:"info"` // info, warning, success, accent
	Title       string    `json:"title" example:"系統更新通知"`
	Content     string    `json:"content" example:"系統將於明日凌晨2點進行維護更新，預計2小時完成。"`
	Icon        string    `json:"icon" example:"bell"`
	Time        time.Time `json:"time" example:"2024-06-15T15:20:36Z"`
	TimeDisplay string    `json:"time_display" example:"5分鐘前"`
	IsRead      bool      `json:"is_read" example:"false"`
}
