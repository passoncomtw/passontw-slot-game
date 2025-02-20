package service

import (
	"fmt"
	"passontw-slot-game/internal/domain"
	"passontw-slot-game/internal/domain/models"
)

// WinResult 代表一次遊戲的中獎結果
type WinResult struct {
	Lines  []models.WinningLine // 中獎線
	Payout float64              // 總獎金
}

// Checker 負責檢查遊戲規則和計算獎金
type Checker struct {
	symbolInfo map[domain.Symbol]domain.SymbolInfo
}

// NewChecker 創建新的規則檢查器
func NewCheckerService() *Checker {
	checker := &Checker{
		symbolInfo: make(map[domain.Symbol]domain.SymbolInfo),
	}

	// 初始化符號資訊映射
	for _, info := range domain.GetSymbolList() {
		checker.symbolInfo[info.Symbol] = info
	}

	return checker
}

// CheckWin 檢查盤面是否中獎並計算獎金
func (c *Checker) CheckWin(board models.Board) WinResult {
	var result WinResult

	// 檢查橫向
	for i := 0; i < 3; i++ {
		if board[i][0] == board[i][1] && board[i][1] == board[i][2] {
			line := models.WinningLine{
				Type:     "Horizontal",
				Position: i,
				Symbol:   board[i][0],
			}
			result.Lines = append(result.Lines, line)
			result.Payout += c.symbolInfo[board[i][0]].Payout
		}
	}

	// 檢查縱向
	for j := 0; j < 3; j++ {
		if board[0][j] == board[1][j] && board[1][j] == board[2][j] {
			line := models.WinningLine{
				Type:     "Vertical",
				Position: j,
				Symbol:   board[0][j],
			}
			result.Lines = append(result.Lines, line)
			result.Payout += c.symbolInfo[board[0][j]].Payout
		}
	}

	// 檢查對角線
	if board[0][0] == board[1][1] && board[1][1] == board[2][2] {
		line := models.WinningLine{
			Type:     "Diagonal",
			Position: 1, // 左上到右下
			Symbol:   board[1][1],
		}
		result.Lines = append(result.Lines, line)
		result.Payout += c.symbolInfo[board[1][1]].Payout
	}

	if board[0][2] == board[1][1] && board[1][1] == board[2][0] {
		line := models.WinningLine{
			Type:     "Diagonal",
			Position: 2, // 右上到左下
			Symbol:   board[1][1],
		}
		result.Lines = append(result.Lines, line)
		result.Payout += c.symbolInfo[board[1][1]].Payout
	}

	return result
}

// FormatWinResult 格式化中獎結果為字符串
func (c *Checker) FormatWinResult(result WinResult) string {
	if len(result.Lines) == 0 {
		return "No winning lines"
	}

	var output string
	output = fmt.Sprintf("Found %d winning lines:\n", len(result.Lines))
	for _, line := range result.Lines {
		output += fmt.Sprintf("- %s line %d with symbol %s\n",
			line.Type, line.Position+1, line.Symbol)
	}
	output += fmt.Sprintf("Total payout: %.2fx\n", result.Payout)

	return output
}
