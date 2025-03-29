package interfaces

import (
	"context"
	"game-api/internal/domain/models"
)

// AppService 定義應用程序服務介面
type AppService interface {
	// 遊戲相關
	GetGameList(ctx context.Context, req models.AppGameListRequest) (*models.AppGameListResponse, error)
	GetGameDetail(ctx context.Context, gameID string) (*models.AppGameResponse, error)

	// 遊戲會話與投注相關
	StartGameSession(ctx context.Context, userID string, req models.GameSessionRequest) (*models.GameSessionResponse, error)
	PlaceBet(ctx context.Context, userID string, req models.BetRequest) (*models.BetResponse, error)
	EndGameSession(ctx context.Context, userID string, req models.EndSessionRequest) (*models.EndSessionResponse, error)

	// 交易相關
	GetTransactionHistory(ctx context.Context, userID string, req models.TransactionHistoryRequest) (*models.TransactionHistoryResponse, error)
	GetWalletBalance(ctx context.Context, userID string) (*models.WalletBalanceResponse, error)
	RequestDeposit(ctx context.Context, userID string, req models.AppDepositRequest) (*models.TransactionResponse, error)
	RequestWithdraw(ctx context.Context, userID string, req models.WithdrawRequest) (*models.TransactionResponse, error)
}
