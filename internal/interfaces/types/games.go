package types

type WinningLineInfo struct {
	Type     string  `json:"type" example:"Horizontal"`
	Position int     `json:"position" example:"1"`
	Symbols  []int   `json:"symbols" swaggertype:"array,integer"`
	Payout   float64 `json:"payout" example:"5.0"`
}
