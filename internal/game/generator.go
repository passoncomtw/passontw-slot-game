package game

import (
	"math/rand"
	"passontw-slot-game/internal/domain/models"
	"time"

	"passontw-slot-game/internal/domain"
)

type Generator struct {
	symbols []domain.SymbolInfo
	rng     *rand.Rand
}

// NewGenerator 創建新的盤面生成器
func NewGenerator() *Generator {
	return &Generator{
		symbols: domain.GetSymbolList(),
		rng:     rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

func (g *Generator) GenerateBoard() models.Board {
	var board models.Board

	// 計算總權重
	totalWeight := 0
	for _, symbol := range g.symbols {
		totalWeight += symbol.Weight
	}

	// 填充盤面
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			// 根據權重隨機選擇符號
			weight := g.rng.Intn(totalWeight)
			currentWeight := 0

			for _, symbol := range g.symbols {
				currentWeight += symbol.Weight
				if weight < currentWeight {
					board[i][j] = symbol.Symbol
					break
				}
			}
		}
	}

	return board
}

// GenerateBoardWithBias 生成帶有偏好的盤面（較高機會出現連線）
func (g *Generator) GenerateBoardWithBias() models.Board {
	var board models.Board

	// 隨機選擇一個符號作為主要符號
	mainSymbol := g.symbols[g.rng.Intn(len(g.symbols))].Symbol

	// 隨機選擇一種連線方式
	lineType := g.rng.Intn(8) // 3橫 + 3直 + 2斜

	// 先填充可能的連線
	switch {
	case lineType < 3: // 橫線
		row := lineType
		for j := 0; j < 3; j++ {
			board[row][j] = mainSymbol
		}
	case lineType < 6: // 直線
		col := lineType - 3
		for i := 0; i < 3; i++ {
			board[i][col] = mainSymbol
		}
	case lineType == 6: // 左上到右下
		for i := 0; i < 3; i++ {
			board[i][i] = mainSymbol
		}
	case lineType == 7: // 右上到左下
		for i := 0; i < 3; i++ {
			board[i][2-i] = mainSymbol
		}
	}

	// 填充其餘位置
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if board[i][j] == 0 { // 未填充的位置
				board[i][j] = g.randomSymbol()
			}
		}
	}

	return board
}

// randomSymbol 隨機選擇一個符號（考慮權重）
func (g *Generator) randomSymbol() domain.Symbol {
	totalWeight := 0
	for _, symbol := range g.symbols {
		totalWeight += symbol.Weight
	}

	weight := g.rng.Intn(totalWeight)
	currentWeight := 0

	for _, symbol := range g.symbols {
		currentWeight += symbol.Weight
		if weight < currentWeight {
			return symbol.Symbol
		}
	}

	return g.symbols[0].Symbol // 預設返回第一個符號
}
