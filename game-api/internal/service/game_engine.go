package service

import (
	"context"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"
	"math/rand"
	"time"
)

// SlotGameEngine 老虎機遊戲引擎
type SlotGameEngine struct {
	logger logger.Logger
}

// NewSlotGameEngine 創建新的老虎機遊戲引擎
func NewSlotGameEngine(logger logger.Logger) interfaces.GameEngine {
	// 設置隨機數種子
	rand.Seed(time.Now().UnixNano())

	return &SlotGameEngine{
		logger: logger,
	}
}

// GenerateGameResult 生成遊戲結果
func (e *SlotGameEngine) GenerateGameResult(ctx context.Context, rtp float64, volatility string,
	betAmount float64, betLines int, betOptions map[string]interface{}) (*models.GameResult, error) {

	// 所有可能的符號
	symbols := []string{"7", "BAR", "葡萄", "西瓜", "鈴鐺", "櫻桃", "檸檬", "橙子"}

	// 根據RTP和波動性調整獲勝機率
	// 較高的RTP意味著較高的獲勝機率
	// 根據波動性調整最大倍數和獲勝機率
	var winProbability float64
	var maxMultiplier float64

	// 設置波動性參數
	switch volatility {
	case "low":
		winProbability = rtp / 100 * 1.3 // 較高的獲勝機率
		maxMultiplier = 3.0              // 較低的最大倍數
	case "medium":
		winProbability = rtp / 100 // 中等獲勝機率
		maxMultiplier = 10.0       // 中等最大倍數
	case "high":
		winProbability = rtp / 100 * 0.7 // 較低的獲勝機率
		maxMultiplier = 50.0             // 較高的最大倍數
	default:
		winProbability = rtp / 100
		maxMultiplier = 10.0
	}

	// 隨機決定是否獲勝
	isWin := rand.Float64() < winProbability

	// 產生隨機符號矩陣 (3x3)
	symbolMatrix := make([][]string, 3)
	for i := 0; i < 3; i++ {
		symbolMatrix[i] = make([]string, 3)
		for j := 0; j < 3; j++ {
			symbolIndex := rand.Intn(len(symbols))
			symbolMatrix[i][j] = symbols[symbolIndex]
		}
	}

	// 初始化結果
	result := &models.GameResult{
		WinAmount:  0,
		Multiplier: 0,
		IsWin:      false,
		Symbols:    symbolMatrix,
		PayLines:   []map[string]interface{}{},
		Features:   map[string]interface{}{"free_spins": 0, "bonus_round": false},
	}

	// 如果贏了，設置獎金
	if isWin {
		// 根據波動性設置倍數
		var multiplier float64
		switch volatility {
		case "low":
			// 低波動性: 較低的倍數，較窄的範圍
			multiplier = 1.1 + rand.Float64()*0.9 // 1.1-2.0
		case "medium":
			// 中等波動性: 中等倍數，較廣的範圍
			multiplier = 1.5 + rand.Float64()*3.5 // 1.5-5.0
		case "high":
			// 高波動性: 較高的倍數，非常廣的範圍
			multiplier = 2.0 + rand.Float64()*(maxMultiplier-2.0) // 2.0-maxMultiplier
		default:
			multiplier = 1.5 + rand.Float64()*3.5
		}

		// 設置獲勝資訊
		result.IsWin = true
		result.Multiplier = multiplier
		result.WinAmount = betAmount * multiplier

		// 模擬一個隨機獲勝線
		winLine := rand.Intn(betLines) + 1
		winSymbol := symbolMatrix[1][rand.Intn(3)] // 使用中間行的一個隨機符號作為獲勝符號

		// 在獲勝線上設置相同的符號
		for i := 0; i < 3; i++ {
			symbolMatrix[1][i] = winSymbol
		}

		// 更新結果的符號矩陣
		result.Symbols = symbolMatrix

		// 添加獲勝線資訊
		result.PayLines = append(result.PayLines, map[string]interface{}{
			"line":    winLine,
			"symbols": winSymbol,
			"count":   3,
		})

		// 隨機觸發特殊功能
		if rand.Float64() < 0.1 { // 10%機率獲得免費旋轉
			freeSpins := 5 + rand.Intn(11) // 5-15次免費旋轉
			result.Features["free_spins"] = freeSpins
		}

		if rand.Float64() < 0.05 { // 5%機率獲得獎金遊戲
			result.Features["bonus_round"] = true
		}
	}

	return result, nil
}
