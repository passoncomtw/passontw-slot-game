package models

// GameResult 遊戲結果
type GameResult struct {
	WinAmount  float64                  // 贏得金額
	Multiplier float64                  // 倍數
	IsWin      bool                     // 是否獲勝
	Symbols    [][]string               // 符號矩陣
	PayLines   []map[string]interface{} // 獲勝線
	Features   map[string]interface{}   // 特殊功能
}
