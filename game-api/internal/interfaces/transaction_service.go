package interfaces

import (
	"context"
	"game-api/internal/domain/models"
)

// TransactionService 定義交易服務的介面
type TransactionService interface {
	// GetTransactionList 獲取交易列表
	GetTransactionList(ctx context.Context, req models.AdminTransactionListRequest) (*models.AdminTransactionListResponse, error)

	// GetTransactionStats 獲取交易統計
	GetTransactionStats(ctx context.Context, startDate, endDate string) (*models.AdminTransactionStatsResponse, error)

	// ExportTransactions 匯出交易報表為Excel
	ExportTransactions(ctx context.Context, req models.TransactionExportRequest) ([]byte, string, error)
}
