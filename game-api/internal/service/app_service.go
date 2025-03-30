package service

import (
	"context"
	"errors"
	"fmt"
	"game-api/internal/domain/entity"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type AppServiceImpl struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewAppService 創建應用服務實例
func NewAppService(
	db *gorm.DB,
	logger logger.Logger,
) interfaces.AppService {
	return &AppServiceImpl{
		db:     db,
		logger: logger,
	}
}

// GetGameList 獲取遊戲列表
func (s *AppServiceImpl) GetGameList(ctx context.Context, req models.AppGameListRequest) (*models.AppGameListResponse, error) {
	var games []entity.Game
	var total int64

	// 設置默認值
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}

	// 設置排序
	orderBy := "created_at DESC"
	if req.SortBy != "" {
		orderBy = req.SortBy
		if req.SortOrder == "desc" {
			orderBy += " DESC"
		} else {
			orderBy += " ASC"
		}
	}

	// 構建查詢
	query := s.db.Model(&entity.Game{}).Where("is_active = ?", true)

	// 應用過濾條件
	if req.Type != "" {
		query = query.Where("game_type = ?", req.Type)
	}
	if req.Featured {
		query = query.Where("is_featured = ?", req.Featured)
	}
	if req.New {
		query = query.Where("is_new = ?", req.New)
	}

	// 計算總數
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// 分頁查詢
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order(orderBy).Offset(offset).Limit(req.PageSize).Find(&games).Error; err != nil {
		return nil, err
	}

	// 構建響應
	var gameResponses []models.AppGameResponse
	for _, game := range games {
		var features map[string]interface{}
		if len(game.Features) > 0 {
			// 解析JSON字符串，實際應用中應處理可能的錯誤
			// 簡化操作，直接返回原始JSON
			features = map[string]interface{}{}
		}

		gameResponses = append(gameResponses, models.AppGameResponse{
			GameID:          game.ID.String(),
			Title:           game.Title,
			Description:     game.Description,
			GameType:        string(game.GameType),
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
			ReleaseDate:     game.ReleaseDate,
		})
	}

	// 計算總頁數
	totalPages := (int(total) + req.PageSize - 1) / req.PageSize

	return &models.AppGameListResponse{
		Games:      gameResponses,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, nil
}

// GetGameDetail 獲取遊戲詳情
func (s *AppServiceImpl) GetGameDetail(ctx context.Context, gameID string) (*models.AppGameResponse, error) {
	var game entity.Game

	// 將字符串轉換為UUID
	id, err := uuid.Parse(gameID)
	if err != nil {
		return nil, fmt.Errorf("無效的遊戲ID格式: %w", err)
	}

	// 查詢遊戲
	if err := s.db.Where("game_id = ? AND is_active = ?", id, true).First(&game).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("找不到該遊戲")
		}
		return nil, err
	}

	// 構建響應
	var features map[string]interface{}
	if len(game.Features) > 0 {
		// 這裡簡化處理，實際應用中應解析JSON
		features = map[string]interface{}{}
	}

	// 獲取遊戲評分（可選）
	var avgRating float64
	s.db.Table("game_ratings").
		Select("COALESCE(AVG(rating), 0) as avg_rating").
		Where("game_id = ?", id).
		Scan(&avgRating)

	return &models.AppGameResponse{
		GameID:          game.ID.String(),
		Title:           game.Title,
		Description:     game.Description,
		GameType:        string(game.GameType),
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
		Rating:          avgRating,
		ReleaseDate:     game.ReleaseDate,
	}, nil
}

// StartGameSession 開始遊戲會話
func (s *AppServiceImpl) StartGameSession(ctx context.Context, userID string, req models.GameSessionRequest) (*models.GameSessionResponse, error) {
	// 將字符串轉換為UUID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("無效的用戶ID格式: %w", err)
	}

	// 檢查遊戲是否存在
	var game entity.Game
	gameID, err := uuid.Parse(req.GameID)
	if err != nil {
		return nil, fmt.Errorf("無效的遊戲ID格式: %w", err)
	}

	if err := s.db.Where("game_id = ? AND is_active = ?", gameID, true).First(&game).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("找不到該遊戲或遊戲已停用")
		}
		return nil, err
	}

	// 獲取用戶錢包信息
	var wallet entity.UserWallet
	if err := s.db.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 找不到錢包時，自動創建一個新錢包
			s.logger.Info("用戶錢包不存在，正在創建新錢包", zap.String("userId", userID))

			newWalletID := uuid.New().String()
			// 創建一個新的用戶錢包
			if err := s.db.Exec(
				"INSERT INTO user_wallets (wallet_id, user_id, balance, total_deposit, total_withdraw, total_bet, total_win, created_at, updated_at) VALUES (?, ?, 0, 0, 0, 0, 0, ?, ?)",
				newWalletID, uid, time.Now(), time.Now(),
			).Error; err != nil {
				return nil, fmt.Errorf("創建用戶錢包失敗: %w", err)
			}

			// 獲取新創建的錢包
			if err := s.db.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
				return nil, fmt.Errorf("獲取新創建的錢包失敗: %w", err)
			}
		} else {
			return nil, fmt.Errorf("獲取用戶錢包信息失敗: %w", err)
		}
	}

	// 檢查餘額是否足夠最小投注額
	if wallet.Balance < game.MinBet {
		return nil, fmt.Errorf("餘額不足，無法開始遊戲，最小投注額為 %.2f", game.MinBet)
	}

	// 創建新的遊戲會話
	sessionID := uuid.New()
	now := time.Now()
	session := struct {
		SessionID      uuid.UUID  `gorm:"column:session_id;type:uuid;primaryKey"`
		UserID         uuid.UUID  `gorm:"column:user_id;type:uuid;not null"`
		GameID         uuid.UUID  `gorm:"column:game_id;type:uuid;not null"`
		StartTime      time.Time  `gorm:"column:start_time;not null"`
		EndTime        *time.Time `gorm:"column:end_time"`
		InitialBalance float64    `gorm:"column:initial_balance;not null"`
		FinalBalance   *float64   `gorm:"column:final_balance"`
		TotalBets      float64    `gorm:"column:total_bets;not null;default:0"`
		TotalWins      float64    `gorm:"column:total_wins;not null;default:0"`
		SpinCount      int        `gorm:"column:spin_count;not null;default:0"`
		WinCount       int        `gorm:"column:win_count;not null;default:0"`
		DeviceInfo     *string    `gorm:"column:device_info;type:jsonb"`
		IPAddress      *string    `gorm:"column:ip_address;type:varchar(45)"`
	}{
		SessionID:      sessionID,
		UserID:         uid,
		GameID:         gameID,
		StartTime:      now,
		InitialBalance: wallet.Balance,
		TotalBets:      0,
		TotalWins:      0,
		SpinCount:      0,
		WinCount:       0,
	}

	// 保存會話
	if err := s.db.Table("game_sessions").Create(&session).Error; err != nil {
		return nil, fmt.Errorf("創建遊戲會話失敗: %w", err)
	}

	// 構建響應
	var features map[string]interface{}
	if len(game.Features) > 0 {
		features = map[string]interface{}{}
	}

	// 獲取遊戲評分（可選）
	var avgRating float64
	s.db.Table("game_ratings").
		Select("COALESCE(AVG(rating), 0) as avg_rating").
		Where("game_id = ?", gameID).
		Scan(&avgRating)

	return &models.GameSessionResponse{
		SessionID:      sessionID.String(),
		GameID:         gameID.String(),
		StartTime:      now,
		InitialBalance: wallet.Balance,
		GameInfo: models.AppGameResponse{
			GameID:          game.ID.String(),
			Title:           game.Title,
			Description:     game.Description,
			GameType:        string(game.GameType),
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
			Rating:          avgRating,
			ReleaseDate:     game.ReleaseDate,
		},
	}, nil
}

// PlaceBet 進行投注
func (s *AppServiceImpl) PlaceBet(ctx context.Context, userID string, req models.BetRequest) (*models.BetResponse, error) {
	// 將字符串轉換為UUID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("無效的用戶ID格式: %w", err)
	}

	// 獲取會話資訊
	sessionID, err := uuid.Parse(req.SessionID)
	if err != nil {
		return nil, fmt.Errorf("無效的會話ID格式: %w", err)
	}

	var session struct {
		SessionID uuid.UUID  `gorm:"column:session_id"`
		UserID    uuid.UUID  `gorm:"column:user_id"`
		GameID    uuid.UUID  `gorm:"column:game_id"`
		EndTime   *time.Time `gorm:"column:end_time"`
	}

	if err := s.db.Table("game_sessions").Where("session_id = ? AND user_id = ?", sessionID, uid).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("找不到該遊戲會話或會話不屬於當前用戶")
		}
		return nil, err
	}

	// 檢查會話是否已結束
	if session.EndTime != nil {
		return nil, fmt.Errorf("該遊戲會話已結束")
	}

	// 獲取遊戲信息
	var game entity.Game
	if err := s.db.Where("game_id = ?", session.GameID).First(&game).Error; err != nil {
		return nil, fmt.Errorf("獲取遊戲信息失敗: %w", err)
	}

	// 檢查投注額是否在遊戲限制範圍內
	if req.BetAmount < game.MinBet || req.BetAmount > game.MaxBet {
		return nil, fmt.Errorf("投注額必須在 %.2f 到 %.2f 之間", game.MinBet, game.MaxBet)
	}

	// 獲取用戶錢包信息
	var wallet entity.UserWallet
	if err := s.db.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
		return nil, fmt.Errorf("獲取用戶錢包信息失敗: %w", err)
	}

	// 檢查餘額是否足夠
	if wallet.Balance < req.BetAmount {
		return nil, fmt.Errorf("餘額不足，當前餘額 %.2f，需要 %.2f", wallet.Balance, req.BetAmount)
	}

	// 開始交易
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("開始交易失敗: %w", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 獲取錢包餘額前的餘額
	balanceBefore := wallet.Balance

	// 從用戶錢包中扣除投注額
	if err := tx.Model(&wallet).Updates(map[string]interface{}{
		"balance":   gorm.Expr("balance - ?", req.BetAmount),
		"total_bet": gorm.Expr("total_bet + ?", req.BetAmount),
	}).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("扣除投注額失敗: %w", err)
	}

	// 刷新錢包數據
	if err := tx.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("刷新錢包數據失敗: %w", err)
	}

	// 創建交易記錄 (投注)
	betTransactionID := uuid.New()
	betTransaction := struct {
		TransactionID string    `gorm:"column:transaction_id;type:uuid;primaryKey"`
		UserID        uuid.UUID `gorm:"column:user_id;type:uuid;not null"`
		WalletID      string    `gorm:"column:wallet_id;type:uuid;not null"`
		Amount        float64   `gorm:"column:amount;type:decimal(15,2);not null"`
		Type          string    `gorm:"column:type;type:transaction_type;not null"`
		Status        string    `gorm:"column:status;type:varchar(20);not null;default:'completed'"`
		GameID        uuid.UUID `gorm:"column:game_id;type:uuid"`
		SessionID     uuid.UUID `gorm:"column:session_id;type:uuid"`
		RoundID       uuid.UUID `gorm:"column:round_id;type:uuid"`
		BalanceBefore float64   `gorm:"column:balance_before;type:decimal(15,2);not null"`
		BalanceAfter  float64   `gorm:"column:balance_after;type:decimal(15,2);not null"`
		CreatedAt     time.Time `gorm:"column:created_at;not null;default:now()"`
		UpdatedAt     time.Time `gorm:"column:updated_at;not null;default:now()"`
	}{
		TransactionID: betTransactionID.String(),
		UserID:        uid,
		WalletID:      wallet.ID,
		Amount:        req.BetAmount,
		Type:          "bet",
		Status:        "completed",
		GameID:        session.GameID,
		SessionID:     session.SessionID,
		BalanceBefore: balanceBefore,
		BalanceAfter:  wallet.Balance,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := tx.Table("transactions").Create(&betTransaction).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("創建交易記錄失敗: %w", err)
	}

	// 更新會話統計
	if err := tx.Table("game_sessions").Where("session_id = ?", session.SessionID).Updates(map[string]interface{}{
		"total_bets": gorm.Expr("total_bets + ?", req.BetAmount),
		"spin_count": gorm.Expr("spin_count + ?", 1),
	}).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("更新會話統計失敗: %w", err)
	}

	// 生成遊戲結果 (這裡應該調用遊戲邏輯服務)
	// 為簡化，我們模擬一個隨機結果
	roundID := uuid.New()
	now := time.Now()

	// 模擬遊戲結果，這裡應該有實際的遊戲邏輯
	// 75%概率贏，投注額的1.1到2.5倍
	var winAmount float64 = 0
	var multiplier float64 = 0
	var isWin bool = false

	// 隨機概率贏得獎金 (實際應用中應有更複雜的遊戲邏輯)
	// 使用當前時間的納秒來模擬隨機數
	if now.UnixNano()%4 != 0 { // 75%概率贏
		minMultiplier := 1.1
		maxMultiplier := 2.5
		multiplier = minMultiplier + (float64(now.UnixNano()%100)/100)*(maxMultiplier-minMultiplier)
		winAmount = req.BetAmount * multiplier
		isWin = true
	}

	// 如果贏了，增加用戶錢包餘額
	var winTransaction *struct {
		TransactionID string    `gorm:"column:transaction_id;type:uuid;primaryKey"`
		UserID        uuid.UUID `gorm:"column:user_id;type:uuid;not null"`
		WalletID      string    `gorm:"column:wallet_id;type:uuid;not null"`
		Amount        float64   `gorm:"column:amount;type:decimal(15,2);not null"`
		Type          string    `gorm:"column:type;type:transaction_type;not null"`
		Status        string    `gorm:"column:status;type:varchar(20);not null;default:'completed'"`
		GameID        uuid.UUID `gorm:"column:game_id;type:uuid"`
		SessionID     uuid.UUID `gorm:"column:session_id;type:uuid"`
		RoundID       uuid.UUID `gorm:"column:round_id;type:uuid"`
		BalanceBefore float64   `gorm:"column:balance_before;type:decimal(15,2);not null"`
		BalanceAfter  float64   `gorm:"column:balance_after;type:decimal(15,2);not null"`
		CreatedAt     time.Time `gorm:"column:created_at;not null;default:now()"`
		UpdatedAt     time.Time `gorm:"column:updated_at;not null;default:now()"`
	}

	if isWin {
		balanceBefore = wallet.Balance

		// 增加用戶錢包餘額
		if err := tx.Model(&wallet).Updates(map[string]interface{}{
			"balance":   gorm.Expr("balance + ?", winAmount),
			"total_win": gorm.Expr("total_win + ?", winAmount),
		}).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("增加獎金失敗: %w", err)
		}

		// 刷新錢包數據
		if err := tx.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("刷新錢包數據失敗: %w", err)
		}

		// 創建交易記錄 (贏錢)
		winTransactionID := uuid.New()
		winTransaction = &struct {
			TransactionID string    `gorm:"column:transaction_id;type:uuid;primaryKey"`
			UserID        uuid.UUID `gorm:"column:user_id;type:uuid;not null"`
			WalletID      string    `gorm:"column:wallet_id;type:uuid;not null"`
			Amount        float64   `gorm:"column:amount;type:decimal(15,2);not null"`
			Type          string    `gorm:"column:type;type:transaction_type;not null"`
			Status        string    `gorm:"column:status;type:varchar(20);not null;default:'completed'"`
			GameID        uuid.UUID `gorm:"column:game_id;type:uuid"`
			SessionID     uuid.UUID `gorm:"column:session_id;type:uuid"`
			RoundID       uuid.UUID `gorm:"column:round_id;type:uuid"`
			BalanceBefore float64   `gorm:"column:balance_before;type:decimal(15,2);not null"`
			BalanceAfter  float64   `gorm:"column:balance_after;type:decimal(15,2);not null"`
			CreatedAt     time.Time `gorm:"column:created_at;not null;default:now()"`
			UpdatedAt     time.Time `gorm:"column:updated_at;not null;default:now()"`
		}{
			TransactionID: winTransactionID.String(),
			UserID:        uid,
			WalletID:      wallet.ID,
			Amount:        winAmount,
			Type:          "win",
			Status:        "completed",
			GameID:        session.GameID,
			SessionID:     session.SessionID,
			RoundID:       roundID,
			BalanceBefore: balanceBefore,
			BalanceAfter:  wallet.Balance,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		if err := tx.Table("transactions").Create(winTransaction).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("創建獎金交易記錄失敗: %w", err)
		}

		// 更新會話統計
		if err := tx.Table("game_sessions").Where("session_id = ?", session.SessionID).Updates(map[string]interface{}{
			"total_wins": gorm.Expr("total_wins + ?", winAmount),
			"win_count":  gorm.Expr("win_count + ?", 1),
		}).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("更新會話統計失敗: %w", err)
		}
	}

	// 創建遊戲回合記錄
	gameRound := struct {
		RoundID         uuid.UUID `gorm:"column:round_id;type:uuid;primaryKey"`
		SessionID       uuid.UUID `gorm:"column:session_id;type:uuid;not null"`
		UserID          uuid.UUID `gorm:"column:user_id;type:uuid;not null"`
		GameID          uuid.UUID `gorm:"column:game_id;type:uuid;not null"`
		BetAmount       float64   `gorm:"column:bet_amount;type:decimal(15,2);not null"`
		WinAmount       float64   `gorm:"column:win_amount;type:decimal(15,2);not null;default:0"`
		Multiplier      float64   `gorm:"column:multiplier;type:decimal(10,2);not null;default:1"`
		Symbols         string    `gorm:"column:symbols;type:jsonb;not null"`
		PayLines        string    `gorm:"column:paylines;type:jsonb"`
		FeaturesTrigger string    `gorm:"column:features_triggered;type:jsonb"`
		BalanceBefore   float64   `gorm:"column:balance_before;type:decimal(15,2);not null"`
		BalanceAfter    float64   `gorm:"column:balance_after;type:decimal(15,2);not null"`
		CreatedAt       time.Time `gorm:"column:created_at;not null;default:now()"`
	}{
		RoundID:         roundID,
		SessionID:       session.SessionID,
		UserID:          uid,
		GameID:          session.GameID,
		BetAmount:       req.BetAmount,
		WinAmount:       winAmount,
		Multiplier:      multiplier,
		Symbols:         `{"symbols": [["7", "A", "B"], ["7", "7", "7"], ["C", "A", "B"]]}`, // 模擬
		PayLines:        `{"paylines": [{"line": 2, "symbols": "7", "count": 3}]}`,
		FeaturesTrigger: `{"free_spins": 0, "bonus_round": false}`,
		BalanceBefore:   betTransaction.BalanceBefore,
		BalanceAfter:    wallet.Balance,
		CreatedAt:       now,
	}

	if err := tx.Table("game_rounds").Create(&gameRound).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("創建遊戲回合記錄失敗: %w", err)
	}

	// 提交交易
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("提交交易失敗: %w", err)
	}

	// 構建響應
	symbols := [][]string{{"7", "A", "B"}, {"7", "7", "7"}, {"C", "A", "B"}}
	payLines := []map[string]interface{}{
		{"line": 2, "symbols": "7", "count": 3},
	}
	features := map[string]interface{}{
		"free_spins":  0,
		"bonus_round": false,
	}

	response := &models.BetResponse{
		RoundID:       roundID.String(),
		SessionID:     session.SessionID.String(),
		BetAmount:     req.BetAmount,
		WinAmount:     winAmount,
		Multiplier:    multiplier,
		Symbols:       symbols,
		PayLines:      payLines,
		Features:      features,
		BalanceBefore: betTransaction.BalanceBefore,
		BalanceAfter:  wallet.Balance,
		TransactionID: betTransactionID.String(),
		CreatedAt:     now,
	}

	return response, nil
}

// EndGameSession 結束遊戲會話
func (s *AppServiceImpl) EndGameSession(ctx context.Context, userID string, req models.EndSessionRequest) (*models.EndSessionResponse, error) {
	// 將字符串轉換為UUID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("無效的用戶ID格式: %w", err)
	}

	// 獲取會話資訊
	sessionID, err := uuid.Parse(req.SessionID)
	if err != nil {
		return nil, fmt.Errorf("無效的會話ID格式: %w", err)
	}

	var session struct {
		SessionID      uuid.UUID  `gorm:"column:session_id"`
		UserID         uuid.UUID  `gorm:"column:user_id"`
		GameID         uuid.UUID  `gorm:"column:game_id"`
		StartTime      time.Time  `gorm:"column:start_time"`
		EndTime        *time.Time `gorm:"column:end_time"`
		InitialBalance float64    `gorm:"column:initial_balance"`
		FinalBalance   *float64   `gorm:"column:final_balance"`
		TotalBets      float64    `gorm:"column:total_bets"`
		TotalWins      float64    `gorm:"column:total_wins"`
		SpinCount      int        `gorm:"column:spin_count"`
		WinCount       int        `gorm:"column:win_count"`
	}

	if err := s.db.Table("game_sessions").Where("session_id = ? AND user_id = ?", sessionID, uid).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("找不到該遊戲會話或會話不屬於當前用戶")
		}
		return nil, err
	}

	// 檢查會話是否已結束
	if session.EndTime != nil {
		return nil, fmt.Errorf("該遊戲會話已結束")
	}

	// 獲取用戶錢包信息
	var wallet entity.UserWallet
	if err := s.db.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
		return nil, fmt.Errorf("獲取用戶錢包信息失敗: %w", err)
	}

	// 結束會話
	now := time.Now()
	duration := int(now.Sub(session.StartTime).Seconds())
	finalBalance := wallet.Balance

	// 更新會話
	if err := s.db.Table("game_sessions").Where("session_id = ?", sessionID).Updates(map[string]interface{}{
		"end_time":      now,
		"final_balance": finalBalance,
	}).Error; err != nil {
		return nil, fmt.Errorf("更新會話失敗: %w", err)
	}

	// 計算淨利
	netGain := session.TotalWins - session.TotalBets

	// 構建響應
	response := &models.EndSessionResponse{
		SessionID:    sessionID.String(),
		EndTime:      now,
		Duration:     duration,
		TotalBets:    session.TotalBets,
		TotalWins:    session.TotalWins,
		NetGain:      netGain,
		SpinCount:    session.SpinCount,
		WinCount:     session.WinCount,
		FinalBalance: finalBalance,
	}

	return response, nil
}

// GetTransactionHistory 獲取用戶交易歷史
func (s *AppServiceImpl) GetTransactionHistory(ctx context.Context, userID string, req models.TransactionHistoryRequest) (*models.TransactionHistoryResponse, error) {
	// 將字符串轉換為UUID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("無效的用戶ID格式: %w", err)
	}

	// 構建查詢
	query := s.db.Table("transactions").Where("user_id = ?", uid)

	// 根據交易類型篩選
	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}

	// 根據日期篩選
	if !req.StartDate.IsZero() {
		query = query.Where("created_at >= ?", req.StartDate)
	}

	if !req.EndDate.IsZero() {
		query = query.Where("created_at <= ?", req.EndDate)
	}

	// 計算總數
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("計算交易總數失敗: %w", err)
	}

	// 分頁
	pageSize := 10
	offset := 0

	if req.PageSize > 0 {
		pageSize = req.PageSize
	}

	if req.Page > 1 {
		offset = (req.Page - 1) * pageSize
	}

	// 排序和分頁
	query = query.Order("created_at DESC").Limit(pageSize).Offset(offset)

	// 執行查詢
	var records []struct {
		TransactionID string     `gorm:"column:transaction_id"`
		Amount        float64    `gorm:"column:amount"`
		Type          string     `gorm:"column:type"`
		Status        string     `gorm:"column:status"`
		GameID        *uuid.UUID `gorm:"column:game_id"`
		Description   *string    `gorm:"column:description"`
		BalanceBefore float64    `gorm:"column:balance_before"`
		BalanceAfter  float64    `gorm:"column:balance_after"`
		CreatedAt     time.Time  `gorm:"column:created_at"`
	}

	if err := query.Find(&records).Error; err != nil {
		return nil, fmt.Errorf("獲取交易記錄失敗: %w", err)
	}

	// 構建響應
	transactions := make([]models.TransactionResponse, 0, len(records))
	for _, record := range records {
		var gameTitle, gameID string
		if record.GameID != nil && *record.GameID != uuid.Nil {
			var game entity.Game
			if err := s.db.Where("game_id = ?", record.GameID).First(&game).Error; err == nil {
				gameTitle = game.Title
				gameID = record.GameID.String()
			}
		}

		var description string
		if record.Description != nil {
			description = *record.Description
		}

		transactions = append(transactions, models.TransactionResponse{
			TransactionID: record.TransactionID,
			Amount:        record.Amount,
			Type:          record.Type,
			Status:        record.Status,
			GameID:        gameID,
			GameTitle:     gameTitle,
			Description:   description,
			BalanceBefore: record.BalanceBefore,
			BalanceAfter:  record.BalanceAfter,
			CreatedAt:     record.CreatedAt,
		})
	}

	// 計算總頁數
	totalPages := (int(total) + pageSize - 1) / pageSize

	// 構建總響應
	response := &models.TransactionHistoryResponse{
		Transactions: transactions,
		Total:        total,
		Page:         req.Page,
		PageSize:     pageSize,
		TotalPages:   totalPages,
	}

	return response, nil
}

// GetWalletBalance 獲取用戶錢包餘額
func (s *AppServiceImpl) GetWalletBalance(ctx context.Context, userID string) (*models.WalletBalanceResponse, error) {
	// 將字符串轉換為UUID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("無效的用戶ID格式: %w", err)
	}

	// 獲取用戶錢包信息
	var wallet entity.UserWallet
	if err := s.db.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("找不到用戶錢包")
		}
		return nil, fmt.Errorf("獲取用戶錢包信息失敗: %w", err)
	}

	// 獲取最近的交易
	var recentTransactions []struct {
		TransactionID string    `gorm:"column:transaction_id"`
		Amount        float64   `gorm:"column:amount"`
		Type          string    `gorm:"column:type"`
		Status        string    `gorm:"column:status"`
		CreatedAt     time.Time `gorm:"column:created_at"`
	}

	if err := s.db.Table("transactions").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Limit(5).
		Find(&recentTransactions).Error; err != nil {
		// 忽略獲取最近交易的錯誤，不影響獲取餘額
		s.logger.Error("獲取最近交易記錄失敗", zap.Error(err))
	}

	// 構建響應
	response := &models.WalletBalanceResponse{
		WalletID:      wallet.ID,
		Balance:       wallet.Balance,
		TotalDeposit:  wallet.TotalDeposit,
		TotalWithdraw: wallet.TotalWithdraw,
		TotalBet:      wallet.TotalBet,
		TotalWin:      wallet.TotalWin,
		UpdatedAt:     wallet.UpdatedAt,
	}

	return response, nil
}

// RequestDeposit 請求存款
func (s *AppServiceImpl) RequestDeposit(ctx context.Context, userID string, req models.AppDepositRequest) (*models.TransactionResponse, error) {
	// 將字符串轉換為UUID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("無效的用戶ID格式: %w", err)
	}

	// 檢查請求
	if req.Amount <= 0 {
		return nil, fmt.Errorf("存款金額必須大於零")
	}

	// 獲取用戶錢包信息
	var wallet entity.UserWallet
	if err := s.db.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 找不到錢包時，檢查用戶是否存在
			var userExists int64
			if err := s.db.Table("users").Where("user_id = ?", uid).Count(&userExists).Error; err != nil {
				s.logger.Error("檢查用戶是否存在失敗", zap.Error(err), zap.String("userId", userID))
				return nil, fmt.Errorf("檢查用戶是否存在失敗: %w", err)
			}

			// 如果用戶不存在，返回錯誤
			if userExists == 0 {
				s.logger.Warn("用戶不存在", zap.String("userId", userID))
				return nil, fmt.Errorf("用戶不存在")
			}

			// 用戶存在但錢包不存在，創建錢包
			s.logger.Info("用戶錢包不存在，正在創建新錢包", zap.String("userId", userID))

			newWalletID := uuid.New().String()
			wallet = entity.UserWallet{
				ID:            newWalletID,
				UserID:        userID,
				Balance:       0,
				TotalDeposit:  0,
				TotalWithdraw: 0,
				TotalBet:      0,
				TotalWin:      0,
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
			}

			// 創建一個新的用戶錢包
			if err := s.db.Create(&wallet).Error; err != nil {
				s.logger.Error("創建用戶錢包失敗", zap.Error(err), zap.String("userId", userID))
				return nil, fmt.Errorf("創建用戶錢包失敗: %w", err)
			}

			// 新創建的錢包餘額為 0，肯定不足提款金額
			return nil, fmt.Errorf("餘額不足，當前餘額 %.2f，需要 %.2f", wallet.Balance, req.Amount)
		} else {
			s.logger.Error("獲取用戶錢包信息失敗", zap.Error(err), zap.String("userId", userID))
			return nil, fmt.Errorf("獲取用戶錢包信息失敗: %w", err)
		}
	}

	// 開始交易
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("開始交易失敗: %w", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 獲取存款前的餘額
	balanceBefore := wallet.Balance

	// 增加用戶錢包餘額
	if err := tx.Model(&wallet).Updates(map[string]interface{}{
		"balance":       gorm.Expr("balance + ?", req.Amount),
		"total_deposit": gorm.Expr("total_deposit + ?", req.Amount),
	}).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("增加存款失敗: %w", err)
	}

	// 刷新錢包數據
	if err := tx.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("刷新錢包數據失敗: %w", err)
	}

	// 創建交易記錄
	transactionID := uuid.New().String()
	now := time.Now()
	description := "信用卡充值"
	if req.PaymentType == "bank_transfer" {
		description = "銀行轉帳"
	} else if req.PaymentType == "e-wallet" {
		description = "電子錢包充值"
	}

	tx_record := struct {
		TransactionID string    `gorm:"column:transaction_id;type:uuid;primaryKey"`
		UserID        uuid.UUID `gorm:"column:user_id;type:uuid;not null"`
		WalletID      string    `gorm:"column:wallet_id;type:uuid;not null"`
		Amount        float64   `gorm:"column:amount;type:decimal(15,2);not null"`
		Type          string    `gorm:"column:type;type:transaction_type;not null"`
		Status        string    `gorm:"column:status;type:varchar(20);not null;default:'completed'"`
		Description   string    `gorm:"column:description;type:text"`
		ReferenceID   string    `gorm:"column:reference_id;type:varchar(255)"`
		BalanceBefore float64   `gorm:"column:balance_before;type:decimal(15,2);not null"`
		BalanceAfter  float64   `gorm:"column:balance_after;type:decimal(15,2);not null"`
		CreatedAt     time.Time `gorm:"column:created_at;not null;default:now()"`
		UpdatedAt     time.Time `gorm:"column:updated_at;not null;default:now()"`
	}{
		TransactionID: transactionID,
		UserID:        uid,
		WalletID:      wallet.ID,
		Amount:        req.Amount,
		Type:          "deposit",
		Status:        "completed",
		Description:   description,
		ReferenceID:   req.ReferenceID,
		BalanceBefore: balanceBefore,
		BalanceAfter:  wallet.Balance,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := tx.Table("transactions").Create(&tx_record).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("創建存款交易記錄失敗: %w", err)
	}

	// 提交交易
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("提交交易失敗: %w", err)
	}

	// 構建響應
	response := &models.TransactionResponse{
		TransactionID: transactionID,
		Type:          "deposit",
		Amount:        req.Amount,
		Status:        "completed",
		Description:   description,
		BalanceBefore: balanceBefore,
		BalanceAfter:  wallet.Balance,
		CreatedAt:     now,
	}

	return response, nil
}

// RequestWithdraw 請求提款
func (s *AppServiceImpl) RequestWithdraw(ctx context.Context, userID string, req models.WithdrawRequest) (*models.TransactionResponse, error) {
	// 將字符串轉換為UUID
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("無效的用戶ID格式: %w", err)
	}

	// 檢查請求
	if req.Amount <= 0 {
		return nil, fmt.Errorf("提款金額必須大於零")
	}

	// 獲取用戶錢包信息
	var wallet entity.UserWallet
	if err := s.db.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 找不到錢包時，檢查用戶是否存在
			var userExists int64
			if err := s.db.Table("users").Where("user_id = ?", uid).Count(&userExists).Error; err != nil {
				s.logger.Error("檢查用戶是否存在失敗", zap.Error(err), zap.String("userId", userID))
				return nil, fmt.Errorf("檢查用戶是否存在失敗: %w", err)
			}

			// 如果用戶不存在，返回錯誤
			if userExists == 0 {
				s.logger.Warn("用戶不存在", zap.String("userId", userID))
				return nil, fmt.Errorf("用戶不存在")
			}

			// 用戶存在但錢包不存在，創建錢包
			s.logger.Info("用戶錢包不存在，正在創建新錢包", zap.String("userId", userID))

			newWalletID := uuid.New().String()
			wallet = entity.UserWallet{
				ID:            newWalletID,
				UserID:        userID,
				Balance:       0,
				TotalDeposit:  0,
				TotalWithdraw: 0,
				TotalBet:      0,
				TotalWin:      0,
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
			}

			// 創建一個新的用戶錢包
			if err := s.db.Create(&wallet).Error; err != nil {
				s.logger.Error("創建用戶錢包失敗", zap.Error(err), zap.String("userId", userID))
				return nil, fmt.Errorf("創建用戶錢包失敗: %w", err)
			}

			// 新創建的錢包餘額為 0，肯定不足提款金額
			return nil, fmt.Errorf("餘額不足，當前餘額 %.2f，需要 %.2f", wallet.Balance, req.Amount)
		} else {
			s.logger.Error("獲取用戶錢包信息失敗", zap.Error(err), zap.String("userId", userID))
			return nil, fmt.Errorf("獲取用戶錢包信息失敗: %w", err)
		}
	}

	// 檢查餘額是否足夠
	if wallet.Balance < req.Amount {
		return nil, fmt.Errorf("餘額不足，當前餘額 %.2f，需要 %.2f", wallet.Balance, req.Amount)
	}

	// 開始交易
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("開始交易失敗: %w", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 獲取提款前的餘額
	balanceBefore := wallet.Balance

	// 減少用戶錢包餘額
	if err := tx.Model(&wallet).Updates(map[string]interface{}{
		"balance":        gorm.Expr("balance - ?", req.Amount),
		"total_withdraw": gorm.Expr("total_withdraw + ?", req.Amount),
	}).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("扣除提款金額失敗: %w", err)
	}

	// 刷新錢包數據
	if err := tx.Where("user_id = ?", uid).First(&wallet).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("刷新錢包數據失敗: %w", err)
	}

	// 創建交易記錄
	transactionID := uuid.New().String()
	now := time.Now()
	description := "提款至銀行帳戶"
	if req.BankAccount != "" {
		description = "提款至銀行帳戶 " + req.BankAccount
		if req.BankName != "" {
			description = "提款至 " + req.BankName + " 帳戶 " + req.BankAccount
		}
	}

	tx_record := struct {
		TransactionID string    `gorm:"column:transaction_id;type:uuid;primaryKey"`
		UserID        uuid.UUID `gorm:"column:user_id;type:uuid;not null"`
		WalletID      string    `gorm:"column:wallet_id;type:uuid;not null"`
		Amount        float64   `gorm:"column:amount;type:decimal(15,2);not null"`
		Type          string    `gorm:"column:type;type:transaction_type;not null"`
		Status        string    `gorm:"column:status;type:varchar(20);not null;default:'pending'"`
		Description   string    `gorm:"column:description;type:text"`
		BalanceBefore float64   `gorm:"column:balance_before;type:decimal(15,2);not null"`
		BalanceAfter  float64   `gorm:"column:balance_after;type:decimal(15,2);not null"`
		CreatedAt     time.Time `gorm:"column:created_at;not null;default:now()"`
		UpdatedAt     time.Time `gorm:"column:updated_at;not null;default:now()"`
	}{
		TransactionID: transactionID,
		UserID:        uid,
		WalletID:      wallet.ID,
		Amount:        req.Amount,
		Type:          "withdraw",
		Status:        "pending", // 提款通常需要審核，所以狀態為pending
		Description:   description,
		BalanceBefore: balanceBefore,
		BalanceAfter:  wallet.Balance,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := tx.Table("transactions").Create(&tx_record).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("創建提款交易記錄失敗: %w", err)
	}

	// 提交交易
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("提交交易失敗: %w", err)
	}

	// 構建響應
	response := &models.TransactionResponse{
		TransactionID: transactionID,
		Type:          "withdraw",
		Amount:        req.Amount,
		Status:        "pending",
		Description:   description,
		BalanceBefore: balanceBefore,
		BalanceAfter:  wallet.Balance,
		CreatedAt:     now,
	}

	return response, nil
}
