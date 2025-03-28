package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"game-api/internal/domain/entity"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type GameServiceImpl struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewGameService 創建新的GameService實例
func NewGameService(
	db *gorm.DB,
	logger logger.Logger,
) interfaces.GameService {
	return &GameServiceImpl{
		db:     db,
		logger: logger,
	}
}

// GetGameList 獲取遊戲列表
func (s *GameServiceImpl) GetGameList(ctx context.Context, req models.GameListRequest) (*models.GameListResponse, error) {
	var (
		games []entity.Game
		total int64
	)

	// 構建查詢條件
	query := s.db.Model(&entity.Game{})

	// 按關鍵詞搜索（遊戲名稱）
	if req.Search != "" {
		searchTerm := "%" + req.Search + "%"
		query = query.Where("title LIKE ?", searchTerm)
	}

	// 獲取總數
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// 查詢遊戲列表
	if err := query.Find(&games).Error; err != nil {
		return nil, err
	}

	// 構建回應
	response := &models.GameListResponse{
		Total: total,
		Games: make([]models.GameResponse, 0, len(games)),
	}

	for _, game := range games {
		response.Games = append(response.Games, models.ConvertToGameResponse(game))
	}

	return response, nil
}

// ChangeGameStatus 改變遊戲狀態（上架或下架）
func (s *GameServiceImpl) ChangeGameStatus(ctx context.Context, req models.GameStatusChangeRequest) (*models.GameOperationResponse, error) {
	// 1. 查找遊戲
	var game entity.Game
	if err := s.db.First(&game, "game_id = ?", req.GameID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("遊戲不存在")
		}
		return nil, err
	}

	// 2. 更新遊戲狀態
	if err := s.db.Model(&game).Update("is_active", req.Status).Error; err != nil {
		return nil, err
	}

	// 3. 構建響應
	statusText := "上架"
	if !req.Status {
		statusText = "下架"
	}

	return &models.GameOperationResponse{
		Success: true,
		Message: fmt.Sprintf("遊戲 %s 已%s", game.Title, statusText),
	}, nil
}

// CreateGame 創建新遊戲
func (s *GameServiceImpl) CreateGame(ctx context.Context, req models.CreateGameRequest) (*models.GameOperationResponse, error) {
	// 1. 檢查同名遊戲是否存在
	var count int64
	if err := s.db.Model(&entity.Game{}).Where("title = ?", req.Title).Count(&count).Error; err != nil {
		return nil, err
	}

	if count > 0 {
		return nil, errors.New("相同名稱的遊戲已存在")
	}

	// 2. 創建新遊戲實體
	featuresJSON, err := validateAndConvertFeatures(req.Features)
	if err != nil {
		return nil, err
	}

	game := entity.Game{
		ID:              uuid.New(),
		Title:           req.Title,
		Description:     req.Description,
		GameType:        req.GameType,
		Icon:            req.Icon,
		BackgroundColor: req.BackgroundColor,
		RTP:             req.RTP,
		Volatility:      entity.Volatility(req.Volatility),
		MinBet:          req.MinBet,
		MaxBet:          req.MaxBet,
		Features:        featuresJSON,
		IsFeatured:      req.IsFeatured,
		IsNew:           req.IsNew,
		IsActive:        req.IsActive,
	}

	// 3. 保存到數據庫
	if err := s.db.Create(&game).Error; err != nil {
		return nil, err
	}

	// 4. 構建響應
	return &models.GameOperationResponse{
		Success: true,
		Message: fmt.Sprintf("遊戲 %s 已成功創建", game.Title),
	}, nil
}

// GetGameByID 獲取單個遊戲
func (s *GameServiceImpl) GetGameByID(ctx context.Context, gameID uuid.UUID) (*models.GameResponse, error) {
	var game entity.Game
	if err := s.db.First(&game, "game_id = ?", gameID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("遊戲不存在")
		}
		return nil, err
	}

	response := models.ConvertToGameResponse(game)
	return &response, nil
}

// validateAndConvertFeatures 驗證並轉換特性JSON
func validateAndConvertFeatures(features string) (datatypes.JSON, error) {
	if features == "" {
		// 如果沒有提供特性，則使用默認值
		defaultFeatures := map[string]bool{
			"free_spins":   false,
			"bonus_rounds": false,
			"multipliers":  false,
		}
		b, err := json.Marshal(defaultFeatures)
		if err != nil {
			return nil, err
		}
		return datatypes.JSON(b), nil
	}

	// 驗證 JSON 格式是否正確
	var temp interface{}
	if err := json.Unmarshal([]byte(features), &temp); err != nil {
		return nil, errors.New("特性 JSON 格式不正確")
	}

	return datatypes.JSON(features), nil
}
