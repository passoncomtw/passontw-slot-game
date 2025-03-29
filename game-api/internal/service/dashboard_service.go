package service

import (
	"context"
	"fmt"
	"game-api/internal/domain/entity"
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DashboardServiceImpl struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewDashboardService 創建儀表板服務實例
func NewDashboardService(
	db *gorm.DB,
	logger logger.Logger,
) interfaces.DashboardService {
	return &DashboardServiceImpl{
		db:     db,
		logger: logger,
	}
}

// GetDashboardData 獲取儀表板數據
func (s *DashboardServiceImpl) GetDashboardData(ctx context.Context, req models.DashboardRequest) (*models.DashboardResponse, error) {
	// 設置時間範圍
	var startTime, endTime time.Time
	now := time.Now()
	endTime = now

	switch req.TimeRange {
	case "today":
		startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "week":
		startTime = now.AddDate(0, 0, -7)
	case "month":
		startTime = now.AddDate(0, -1, 0)
	case "year":
		startTime = now.AddDate(-1, 0, 0)
	default:
		// 默認今天
		startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	}

	// 從請求上下文中獲取管理員信息
	adminID, adminName, adminRole := getAdminInfo(ctx)

	// 創建響應
	response := &models.DashboardResponse{
		Summary: models.DashboardSummary{
			CurrentDate: now.Format("2006/01/02"),
			AdminName:   adminName,
			AdminRole:   adminRole,
		},
		Income:        make([]models.TimeSeriesData, 0),
		PopularGames:  make([]models.GameStatistic, 0),
		Transactions:  make([]models.RecentTransaction, 0),
		Notifications: make([]models.SystemNotification, 0),
	}

	// 獲取各項數據
	s.getSummaryData(ctx, &response.Summary, startTime, endTime)
	s.getIncomeData(ctx, &response.Income, req.TimeRange, startTime, endTime)
	s.getPopularGamesData(ctx, &response.PopularGames, startTime, endTime)
	s.getRecentTransactionsData(ctx, &response.Transactions)
	s.getNotificationsData(ctx, &response.Notifications, adminID)

	return response, nil
}

// MarkAllNotificationsAsRead 將所有通知標記為已讀
func (s *DashboardServiceImpl) MarkAllNotificationsAsRead(ctx context.Context, adminID string) error {
	// 將指定管理員的所有未讀通知標記為已讀
	// 此處應查詢 notifications 表並更新 is_read 字段
	// 為簡化，這裡假設有一個通知表

	// 檢查 adminID 是否有效
	if adminID == "" {
		return fmt.Errorf("無效的管理員ID")
	}

	// 將通知標記為已讀
	// 實際實現中，應該查詢通知表並更新通知狀態
	// result := s.db.Model(&entity.Notification{}).
	//    Where("admin_id = ? AND is_read = ?", adminID, false).
	//    Update("is_read", true)
	// return result.Error

	// 由於尚未實現通知表，暫時返回成功
	return nil
}

// 以下是輔助方法

// 從上下文中獲取管理員信息
func getAdminInfo(ctx context.Context) (string, string, string) {
	// 這裡應該從上下文或請求中提取管理員信息
	// 實際應用中應根據 JWT token 或 session 獲取

	// 假數據，實際應用中應該從 ctx 獲取
	return "admin-123", "陳管理員", "超級管理員"
}

// 獲取摘要數據
func (s *DashboardServiceImpl) getSummaryData(ctx context.Context, summary *models.DashboardSummary, startTime, endTime time.Time) {
	// 總收入 (從交易表中計算)
	var totalIncome float64
	s.db.Table("transactions").
		Where("created_at BETWEEN ? AND ?", startTime, endTime).
		Where("type = ?", "deposit").
		Select("COALESCE(SUM(amount), 0) as total_income").
		Scan(&totalIncome)
	summary.TotalIncome = totalIncome

	// 收入百分比變化 (與上個同比時間段比較)
	var previousIncome float64
	previousStartTime := startTime.AddDate(0, -1, 0) // 上月同期
	previousEndTime := endTime.AddDate(0, -1, 0)
	s.db.Table("transactions").
		Where("created_at BETWEEN ? AND ?", previousStartTime, previousEndTime).
		Where("type = ?", "deposit").
		Select("COALESCE(SUM(amount), 0) as total_income").
		Scan(&previousIncome)

	if previousIncome > 0 {
		summary.IncomePercentage = (totalIncome - previousIncome) / previousIncome * 100
	} else {
		summary.IncomePercentage = 100 // 上期為0時，增長100%
	}

	// 活躍用戶數
	var activeUsers int64
	s.db.Table("user_sessions").
		Where("last_active_at BETWEEN ? AND ?", startTime, endTime).
		Select("COUNT(DISTINCT user_id) as active_users").
		Scan(&activeUsers)
	summary.ActiveUsers = int(activeUsers)

	// 用戶百分比變化
	var previousActiveUsers int64
	s.db.Table("user_sessions").
		Where("last_active_at BETWEEN ? AND ?", previousStartTime, previousEndTime).
		Select("COUNT(DISTINCT user_id) as active_users").
		Scan(&previousActiveUsers)

	if previousActiveUsers > 0 {
		summary.UsersPercentage = float64(activeUsers-previousActiveUsers) / float64(previousActiveUsers) * 100
	} else {
		summary.UsersPercentage = 100
	}

	// 遊戲總數
	var totalGames int64
	s.db.Model(&entity.Game{}).Count(&totalGames)
	summary.TotalGames = int(totalGames)

	// 本月新增遊戲
	var newGames int64
	firstDayOfMonth := time.Date(endTime.Year(), endTime.Month(), 1, 0, 0, 0, 0, endTime.Location())
	s.db.Model(&entity.Game{}).
		Where("created_at >= ?", firstDayOfMonth).
		Count(&newGames)
	summary.NewGames = int(newGames)

	// AI 推薦效果和提升率
	// 這些數據可能需要從單獨的AI分析服務或表格中獲取
	// 這裡使用假數據
	summary.AIEffectiveness = 92.7
	summary.AIImprovement = 5.3
}

// 獲取收入數據
func (s *DashboardServiceImpl) getIncomeData(ctx context.Context, incomeData *[]models.TimeSeriesData, timeRange string, startTime, endTime time.Time) {
	// 根據時間範圍確定數據點間隔和格式
	var interval time.Duration
	var format string

	switch timeRange {
	case "today":
		interval = time.Hour
		format = "15:04" // 時:分
	case "week":
		interval = 24 * time.Hour
		format = "01-02" // 月-日
	case "month":
		interval = 24 * time.Hour
		format = "01-02" // 月-日
	case "year":
		interval = 30 * 24 * time.Hour
		format = "2006-01" // 年-月
	default:
		interval = time.Hour
		format = "15:04"
	}

	// 生成時間數據點
	currentTime := startTime
	for currentTime.Before(endTime) {
		nextTime := currentTime.Add(interval)

		// 計算這個時間段的收入
		var income float64
		s.db.Table("transactions").
			Where("created_at BETWEEN ? AND ?", currentTime, nextTime).
			Where("type = ?", "deposit").
			Select("COALESCE(SUM(amount), 0) as income").
			Scan(&income)

		// 添加數據點
		*incomeData = append(*incomeData, models.TimeSeriesData{
			Time:  currentTime.Format(format),
			Value: income,
		})

		currentTime = nextTime
	}

	// 如果沒有實際數據，生成假數據
	if len(*incomeData) == 0 {
		// 生成一些模擬數據點
		for i := 0; i < 24; i++ {
			dataPoint := models.TimeSeriesData{
				Time:  startTime.Add(time.Duration(i) * interval).Format(format),
				Value: 5000 + float64(i*1000) + float64(time.Now().UnixNano()%1000),
			}
			*incomeData = append(*incomeData, dataPoint)
		}
	}
}

// 獲取熱門遊戲數據
func (s *DashboardServiceImpl) getPopularGamesData(ctx context.Context, games *[]models.GameStatistic, startTime, endTime time.Time) {
	// 查詢熱門遊戲
	var topGames []struct {
		GameID    string
		Name      string
		Icon      string
		BetAmount float64
	}

	// 使用 GORM 查詢 - 實際 SQL 會與數據結構相關
	// 這裡假設從遊戲回合表和遊戲表聯合查詢
	s.db.Table("game_rounds gr").
		Select("g.game_id, g.title as name, g.icon, COALESCE(SUM(gr.bet_amount), 0) as bet_amount").
		Joins("JOIN games g ON gr.game_id = g.game_id").
		Where("gr.created_at BETWEEN ? AND ?", startTime, endTime).
		Group("g.game_id, g.title, g.icon").
		Order("bet_amount DESC").
		Limit(4).
		Scan(&topGames)

	// 計算最大值，用於百分比計算
	var maxBetAmount float64
	for _, game := range topGames {
		if game.BetAmount > maxBetAmount {
			maxBetAmount = game.BetAmount
		}
	}

	// 如果查詢結果為空，使用模擬數據
	if len(topGames) == 0 {
		// 前端需要的遊戲顏色和圖標映射
		colorMap := map[int]string{
			0: "#6200EA", // primary-color
			1: "#FF9100", // accent-color
			2: "#F44336", // error-color
			3: "#2196F3", // info-color
		}

		iconMap := map[int]string{
			0: "dice",
			1: "coins",
			2: "fire",
			3: "gem",
		}

		gameData := []struct {
			Name  string
			Value float64
		}{
			{"幸運七", 42580},
			{"金幣樂園", 35210},
			{"水果派對", 28760},
			{"寶石迷情", 21880},
		}

		// 最大值用於計算百分比
		maxValue := gameData[0].Value

		for i, game := range gameData {
			// 生成UUID
			gameID := uuid.New()

			*games = append(*games, models.GameStatistic{
				GameID:     gameID.String(),
				Name:       game.Name,
				Icon:       iconMap[i],
				IconColor:  colorMap[i],
				Value:      game.Value,
				Percentage: game.Value / maxValue * 100,
			})
		}
	} else {
		// 處理實際數據
		for i, game := range topGames {
			// 處理顏色映射
			colorMap := map[int]string{
				0: "#6200EA", // primary-color
				1: "#FF9100", // accent-color
				2: "#F44336", // error-color
				3: "#2196F3", // info-color
			}

			// 如果沒有圖標，使用默認圖標
			icon := game.Icon
			if icon == "" {
				icon = "gamepad"
			}

			*games = append(*games, models.GameStatistic{
				GameID:     game.GameID,
				Name:       game.Name,
				Icon:       icon,
				IconColor:  colorMap[i%len(colorMap)],
				Value:      game.BetAmount,
				Percentage: game.BetAmount / maxBetAmount * 100,
			})
		}
	}
}

// 獲取最近交易數據
func (s *DashboardServiceImpl) getRecentTransactionsData(ctx context.Context, transactions *[]models.RecentTransaction) {
	// 查詢最近交易
	var recentTxs []struct {
		ID       string
		Type     string
		Amount   float64
		UserID   string
		Username string
		Time     time.Time
	}

	// 執行查詢 - 實際SQL會與數據結構相關
	s.db.Table("transactions t").
		Select("t.transaction_id as id, t.type, t.amount, u.user_id, u.username, t.created_at as time").
		Joins("JOIN users u ON t.user_id = u.user_id").
		Where("t.type IN ('deposit', 'withdraw')").
		Order("t.created_at DESC").
		Limit(4).
		Scan(&recentTxs)

	// 如果沒有實際數據，使用假數據
	if len(recentTxs) == 0 {
		now := time.Now()

		mockData := []struct {
			Type     string
			Amount   float64
			Username string
			UserID   string
			Minutes  int
		}{
			{"deposit", 200, "王小明", "U001", 10},
			{"withdraw", 350, "李小華", "U002", 30},
			{"deposit", 500, "張三豐", "U003", 60},
			{"deposit", 100, "趙小姐", "U004", 120},
		}

		for i, tx := range mockData {
			txTime := now.Add(time.Duration(-tx.Minutes) * time.Minute)

			*transactions = append(*transactions, models.RecentTransaction{
				ID:          fmt.Sprintf("T%s%04d", now.Format("20060102"), i+1),
				Type:        tx.Type,
				Amount:      tx.Amount,
				Username:    tx.Username,
				UserID:      tx.UserID,
				Time:        txTime,
				TimeDisplay: formatTimeAgo(txTime),
			})
		}
	} else {
		// 處理實際數據
		for _, tx := range recentTxs {
			*transactions = append(*transactions, models.RecentTransaction{
				ID:          tx.ID,
				Type:        tx.Type,
				Amount:      tx.Amount,
				Username:    tx.Username,
				UserID:      tx.UserID,
				Time:        tx.Time,
				TimeDisplay: formatTimeAgo(tx.Time),
			})
		}
	}
}

// 獲取系統通知數據
func (s *DashboardServiceImpl) getNotificationsData(ctx context.Context, notifications *[]models.SystemNotification, adminID string) {
	// 查詢系統通知
	// 這裡應該從通知表中查詢最近的未讀通知
	// 由於可能尚未有通知表，使用模擬數據

	now := time.Now()

	notificationData := []struct {
		Type    string
		Title   string
		Content string
		Icon    string
		Minutes int
	}{
		{
			"info",
			"系統更新通知",
			"系統將於明日凌晨2點進行維護更新，預計2小時完成。",
			"bell",
			5,
		},
		{
			"warning",
			"異常登入警告",
			"系統檢測到多次異常登入嘗試，請檢查安全設置。",
			"exclamation-triangle",
			20,
		},
		{
			"success",
			"AI模型訓練完成",
			"新的AI推薦模型訓練已完成，準確率提升15%。",
			"check-circle",
			120,
		},
		{
			"accent",
			"新遊戲上線",
			"新遊戲「神龍寶藏」已上線，請檢查並設置相關參數。",
			"star",
			1440, // 1天前
		},
	}

	for i, notification := range notificationData {
		notificationTime := now.Add(time.Duration(-notification.Minutes) * time.Minute)

		*notifications = append(*notifications, models.SystemNotification{
			ID:          fmt.Sprintf("N%03d", i+1),
			Type:        notification.Type,
			Title:       notification.Title,
			Content:     notification.Content,
			Icon:        notification.Icon,
			Time:        notificationTime,
			TimeDisplay: formatTimeAgo(notificationTime),
			IsRead:      false,
		})
	}
}

// 格式化時間為"幾分鐘前"、"幾小時前"等
func formatTimeAgo(t time.Time) string {
	now := time.Now()
	diff := now.Sub(t)

	minutes := int(diff.Minutes())
	hours := int(diff.Hours())
	days := int(diff.Hours() / 24)

	if minutes < 60 {
		return fmt.Sprintf("%d分鐘前", minutes)
	} else if hours < 24 {
		return fmt.Sprintf("%d小時前", hours)
	} else {
		return fmt.Sprintf("%d天前", days)
	}
}
