package service

import (
	"context"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/databaseManager"
	"game-api/pkg/logger"

	"github.com/google/uuid"
)

type betService struct {
	db     databaseManager.DatabaseManager
	logger logger.Logger
}

func NewBetService(db databaseManager.DatabaseManager, logger logger.Logger) interfaces.BetService {
	return &betService{
		db:     db,
		logger: logger,
	}
}

func (s *betService) GetBetHistory(ctx context.Context, userID string, req *models.BetHistoryRequest) (*models.BetHistoryResponse, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	// 使用 GetDB 獲取原始的 GORM DB 對象
	db := s.db.GetDB().WithContext(ctx)

	// 構建查詢
	query := db.Model(&models.GameSession{}).Where("user_id = ?", uid)

	if !req.StartDate.IsZero() {
		query = query.Where("start_time >= ?", req.StartDate)
	}

	if !req.EndDate.IsZero() {
		query = query.Where("start_time <= ?", req.EndDate)
	}

	if req.GameID != uuid.Nil {
		query = query.Where("game_id = ?", req.GameID)
	}

	// 獲取總數
	var totalCount int64
	if err := query.Count(&totalCount).Error; err != nil {
		return nil, err
	}

	// 獲取分頁數據
	var sessions []models.GameSession
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("start_time DESC").
		Limit(req.PageSize).
		Offset(offset).
		Find(&sessions).Error; err != nil {
		return nil, err
	}

	return &models.BetHistoryResponse{
		TotalCount: totalCount,
		Items:      sessions,
	}, nil
}

func (s *betService) GetBetDetail(ctx context.Context, sessionID string) ([]*models.GameRound, error) {
	uid, err := uuid.Parse(sessionID)
	if err != nil {
		return nil, err
	}

	var rounds []*models.GameRound
	db := s.db.GetDB().WithContext(ctx)
	if err := db.Where("session_id = ?", uid).
		Order("created_at DESC").
		Find(&rounds).Error; err != nil {
		return nil, err
	}

	return rounds, nil
}
