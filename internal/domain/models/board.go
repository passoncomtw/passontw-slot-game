package models

import (
	"fmt"
	"passontw-slot-game/internal/domain"
)

type Board [3][3]domain.Symbol

// WinningLine 代表一條中獎線
type WinningLine struct {
	Type     string        // 線的類型（橫、直、斜）
	Position int           // 線的位置
	Symbol   domain.Symbol // 中獎符號
}

func (b Board) PrintBoard() string {
	var result string

	// 打印上邊框
	result += "┌───┬───┬───┐\n"

	// 打印每一行
	for i := 0; i < 3; i++ {
		result += "│"
		for j := 0; j < 3; j++ {
			result += fmt.Sprintf(" %s │", b[i][j])
		}
		result += "\n"

		// 打印分隔線或下邊框
		if i < 2 {
			result += "├───┼───┼───┤\n"
		} else {
			result += "└───┴───┴───┘\n"
		}
	}

	return result
}

func (b Board) GetSymbolCount() map[domain.Symbol]int {
	counts := make(map[domain.Symbol]int)
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			counts[b[i][j]]++
		}
	}
	return counts
}

func (b Board) GetAllPositions(symbol domain.Symbol) [][2]int {
	var positions [][2]int
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if b[i][j] == symbol {
				positions = append(positions, [2]int{i, j})
			}
		}
	}
	return positions
}
