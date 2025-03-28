package interfaces

import (
	"context"
	"game-api/internal/domain/models"
)

// AdminLogService 定義操作日誌服務的介面
type AdminLogService interface {
	// GetLogList 獲取操作日誌列表
	GetLogList(ctx context.Context, req models.AdminLogListRequest) (*models.AdminLogListResponse, error)

	// GetLogStats 獲取操作日誌統計
	GetLogStats(ctx context.Context, startDate, endDate string) (*models.AdminLogStatsResponse, error)

	// ExportLogs 匯出操作日誌為CSV
	ExportLogs(ctx context.Context, req models.LogExportRequest) ([]byte, string, error)
}
