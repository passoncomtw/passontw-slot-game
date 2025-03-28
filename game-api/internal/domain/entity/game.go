package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// GameType 遊戲類型
type GameType string

const (
	GameTypeSlot   GameType = "slot"
	GameTypeCard   GameType = "card"
	GameTypeTable  GameType = "table"
	GameTypeArcade GameType = "arcade"
)

// Volatility 波動類型
type Volatility string

const (
	VolatilityLow    Volatility = "low"
	VolatilityMedium Volatility = "medium"
	VolatilityHigh   Volatility = "high"
)

// Game 遊戲實體
type Game struct {
	ID              uuid.UUID      `gorm:"primaryKey;column:game_id;type:uuid" json:"game_id"`
	Title           string         `gorm:"column:title;type:varchar(100);not null" json:"title"`
	Description     string         `gorm:"column:description;type:text" json:"description"`
	GameType        GameType       `gorm:"column:game_type;type:game_type;not null" json:"game_type"`
	Icon            string         `gorm:"column:icon;type:varchar(255);not null" json:"icon"`
	BackgroundColor string         `gorm:"column:background_color;type:varchar(20);not null" json:"background_color"`
	RTP             float64        `gorm:"column:rtp;type:decimal(5,2);not null" json:"rtp"`
	Volatility      Volatility     `gorm:"column:volatility;type:varchar(20);not null" json:"volatility"`
	MinBet          float64        `gorm:"column:min_bet;type:decimal(10,2);not null" json:"min_bet"`
	MaxBet          float64        `gorm:"column:max_bet;type:decimal(10,2);not null" json:"max_bet"`
	Features        datatypes.JSON `gorm:"column:features;type:jsonb" json:"features"`
	IsFeatured      bool           `gorm:"column:is_featured;not null;default:false" json:"is_featured"`
	IsNew           bool           `gorm:"column:is_new;not null;default:false" json:"is_new"`
	IsActive        bool           `gorm:"column:is_active;not null;default:true" json:"is_active"`
	ReleaseDate     time.Time      `gorm:"column:release_date;type:date;not null;default:CURRENT_DATE" json:"release_date"`
	CreatedAt       time.Time      `gorm:"column:created_at;not null;default:now()" json:"created_at"`
	UpdatedAt       time.Time      `gorm:"column:updated_at;not null;default:now()" json:"updated_at"`
}

// TableName 指定資料表名稱
func (Game) TableName() string {
	return "games"
}

// BeforeCreate 在創建前執行
func (g *Game) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}

	now := time.Now()
	g.CreatedAt = now
	g.UpdatedAt = now
	if g.ReleaseDate.IsZero() {
		g.ReleaseDate = now
	}

	return nil
}

// BeforeUpdate 在更新前執行
func (g *Game) BeforeUpdate(tx *gorm.DB) error {
	g.UpdatedAt = time.Now()
	return nil
}
