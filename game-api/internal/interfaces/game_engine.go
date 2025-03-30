package interfaces

import (
	"context"
	"game-api/internal/domain/models"
)

// GameEngine 遊戲引擎接口
type GameEngine interface {
	// GenerateGameResult 生成遊戲結果
	// rtp: 理論回報率
	// volatility: 波動性 (low/medium/high)
	// betAmount: 投注金額
	// betLines: 投注線數
	// betOptions: 其他投注選項
	GenerateGameResult(ctx context.Context, rtp float64, volatility string,
		betAmount float64, betLines int, betOptions map[string]interface{}) (*models.GameResult, error)
}
