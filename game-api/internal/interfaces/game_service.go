package interfaces

import (
	"context"
	"game-api/internal/domain/models"

	"github.com/google/uuid"
)

// GameService 遊戲服務接口
type GameService interface {
	// 獲取遊戲列表
	GetGameList(ctx context.Context, req models.GameListRequest) (*models.GameListResponse, error)

	// 改變遊戲狀態（上架或下架）
	ChangeGameStatus(ctx context.Context, req models.GameStatusChangeRequest) (*models.GameOperationResponse, error)

	// 創建新遊戲
	CreateGame(ctx context.Context, req models.CreateGameRequest) (*models.GameOperationResponse, error)

	// 獲取單個遊戲
	GetGameByID(ctx context.Context, gameID uuid.UUID) (*models.GameResponse, error)
}
