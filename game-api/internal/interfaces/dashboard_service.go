package interfaces

import (
	"context"
	"game-api/internal/domain/models"
)

// DashboardService 定義儀表板服務介面
type DashboardService interface {
	// GetDashboardData 獲取儀表板數據
	GetDashboardData(ctx context.Context, req models.DashboardRequest) (*models.DashboardResponse, error)

	// MarkAllNotificationsAsRead 將所有通知標記為已讀
	MarkAllNotificationsAsRead(ctx context.Context, adminID string) error
}
