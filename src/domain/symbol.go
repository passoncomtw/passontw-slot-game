package domain

// Symbol 代表老虎機的符號
type Symbol int

// 定義所有可能的符號
const (
	Cherry Symbol = iota
	Bell
	Lemon
	Orange
	Star
	Skull
	Crown
	Diamond
	Seven
	BAR
)

// SymbolInfo 儲存符號的相關資訊
type SymbolInfo struct {
	Symbol Symbol
	Weight int     // 出現權重
	Payout float64 // 獎金倍數
}

// String 方法用於將 Symbol 轉換為字串表示
func (s Symbol) String() string {
	symbols := []string{
		"🍒",   // Cherry
		"🔔",   // Bell
		"🍋",   // Lemon
		"🍊",   // Orange
		"⭐",   // Star
		"💀",   // Skull
		"👑",   // Crown
		"💎",   // Diamond
		"7️⃣", // Seven
		"📊",   // BAR
	}
	return symbols[s]
}

// GetSymbolList 返回所有符號的配置信息
func GetSymbolList() []SymbolInfo {
	return []SymbolInfo{
		{Cherry, 10, 2.0}, // 較常見，獎金較小
		{Bell, 8, 2.5},
		{Lemon, 10, 2.0},
		{Orange, 10, 2.0},
		{Star, 6, 3.0},
		{Skull, 4, 5.0},
		{Crown, 4, 5.0},
		{Diamond, 2, 10.0}, // 較稀有，獎金較高
		{Seven, 3, 7.0},
		{BAR, 5, 4.0},
	}
}
