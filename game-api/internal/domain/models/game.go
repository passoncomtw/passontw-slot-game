package models

import (
	"game-api/internal/domain/entity"

	"github.com/google/uuid"
)

// GameListRequest 遊戲列表請求
type GameListRequest struct {
	Search string `form:"search" json:"search"`
}

// GameResponse 遊戲回應
// @Description 遊戲詳細信息
type GameResponse struct {
	ID              uuid.UUID       `json:"game_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Title           string          `json:"title" example:"幸運七"`
	Description     string          `json:"description" example:"經典老虎機遊戲，有特殊的七倍符號獎勵和免費旋轉功能。"`
	GameType        entity.GameType `json:"game_type" example:"slot"`
	Icon            string          `json:"icon" example:"diamond"`
	BackgroundColor string          `json:"background_color" example:"#6200EA"`
	RTP             float64         `json:"rtp" example:"96.5"`
	Volatility      string          `json:"volatility" example:"medium"`
	MinBet          float64         `json:"min_bet" example:"1.0"`
	MaxBet          float64         `json:"max_bet" example:"500.0"`
	Features        string          `json:"features" example:"{\"free_spins\":true,\"bonus_rounds\":true,\"multipliers\":true}"`
	IsFeatured      bool            `json:"is_featured" example:"true"`
	IsNew           bool            `json:"is_new" example:"false"`
	IsActive        bool            `json:"is_active" example:"true"`
	ReleaseDate     string          `json:"release_date" example:"2024-05-10"`
	CreatedAt       string          `json:"created_at" example:"2024-05-10 15:04:05"`
}

// GameListResponse 遊戲列表回應
type GameListResponse struct {
	Games []GameResponse `json:"games"`
	Total int64          `json:"total" example:"10"`
}

// GameStatusChangeRequest 遊戲狀態變更請求
type GameStatusChangeRequest struct {
	GameID uuid.UUID `json:"game_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	Status bool      `json:"status" binding:"required" example:"true"`
}

// CreateGameRequest 創建遊戲請求
type CreateGameRequest struct {
	Title           string          `json:"title" binding:"required,min=2,max=100" example:"寶藏樂園"`
	Description     string          `json:"description" binding:"required" example:"一款充滿寶藏的刺激老虎機遊戲"`
	GameType        entity.GameType `json:"game_type" binding:"required" example:"slot"`
	Icon            string          `json:"icon" binding:"required" example:"treasure"`
	BackgroundColor string          `json:"background_color" binding:"required,min=4,max=20" example:"#FF9800"`
	RTP             float64         `json:"rtp" binding:"required,min=70,max=100" example:"95.8"`
	Volatility      string          `json:"volatility" binding:"required,oneof=low medium high" example:"high"`
	MinBet          float64         `json:"min_bet" binding:"required,min=0.1" example:"2.0"`
	MaxBet          float64         `json:"max_bet" binding:"required,min=1" example:"1000.0"`
	Features        string          `json:"features" example:"{\"free_spins\":true,\"bonus_rounds\":true,\"multipliers\":true}"`
	IsFeatured      bool            `json:"is_featured" example:"false"`
	IsNew           bool            `json:"is_new" example:"true"`
	IsActive        bool            `json:"is_active" example:"true"`
}

// GameOperationResponse 遊戲操作回應
type GameOperationResponse struct {
	Success bool   `json:"success" example:"true"`
	Message string `json:"message" example:"遊戲 寶藏樂園 已成功創建"`
}

// ConvertToGameResponse 將遊戲實體轉換為回應模型
func ConvertToGameResponse(game entity.Game) GameResponse {
	var features string
	if len(game.Features) > 0 {
		features = string(game.Features)
	}

	return GameResponse{
		ID:              game.ID,
		Title:           game.Title,
		Description:     game.Description,
		GameType:        game.GameType,
		Icon:            game.Icon,
		BackgroundColor: game.BackgroundColor,
		RTP:             game.RTP,
		Volatility:      string(game.Volatility),
		MinBet:          game.MinBet,
		MaxBet:          game.MaxBet,
		Features:        features,
		IsFeatured:      game.IsFeatured,
		IsNew:           game.IsNew,
		IsActive:        game.IsActive,
		ReleaseDate:     game.ReleaseDate.Format("2006-01-02"),
		CreatedAt:       game.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}
