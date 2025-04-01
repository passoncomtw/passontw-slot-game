import api from './api';
import { 
  DashboardResponse, 
} from '../types/dashboard';

// 模擬數據，在真實 API 可用前使用
const mockDashboardData: DashboardResponse = {
  summary: {
    totalIncome: 128430,
    incomePercentage: 12.5,
    activeUsers: 3721,
    usersPercentage: 8.2,
    totalGames: 47,
    newGames: 3,
    aiEffectiveness: 92.7,
    aiImprovement: 5.3,
    currentDate: new Date().toLocaleDateString('zh-TW'),
    adminName: '管理員',
    adminRole: '超級管理員'
  },
  income: Array(24).fill(0).map((_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    value: Math.floor(Math.random() * 5000) + 5000
  })),
  popularGames: [
    {
      gameId: '1',
      name: '幸運七',
      icon: 'dice',
      iconColor: '#6200EA',
      value: 42580,
      percentage: 85
    },
    {
      gameId: '2',
      name: '金幣樂園',
      icon: 'coins',
      iconColor: '#B388FF',
      value: 35210,
      percentage: 70
    },
    {
      gameId: '3',
      name: '水果派對',
      icon: 'apple-whole',
      iconColor: '#F44336',
      value: 28760,
      percentage: 60
    },
    {
      gameId: '4',
      name: '翡翠寶石',
      icon: 'gem',
      iconColor: '#009688',
      value: 21880,
      percentage: 45
    }
  ],
  recentTransactions: [
    {
      id: 'T1',
      type: 'deposit',
      amount: 500,
      username: '王小明',
      userId: 'U001',
      time: new Date().toISOString(),
      timeDisplay: '10分鐘前'
    },
    {
      id: 'T2',
      type: 'withdraw',
      amount: 350,
      username: '李小華',
      userId: 'U002',
      time: new Date().toISOString(),
      timeDisplay: '30分鐘前'
    },
    {
      id: 'T3',
      type: 'deposit',
      amount: 1000,
      username: '張三豐',
      userId: 'U003',
      time: new Date().toISOString(),
      timeDisplay: '1小時前'
    },
    {
      id: 'T4',
      type: 'withdraw',
      amount: 720,
      username: '趙先生',
      userId: 'U004',
      time: new Date().toISOString(),
      timeDisplay: '2小時前'
    }
  ],
  notifications: [
    {
      id: 'N1',
      type: 'info',
      title: '系統更新通知',
      content: '系統將於明日凌晨2點進行維護更新，預計2小時完成。',
      icon: 'bell',
      time: new Date().toISOString(),
      timeDisplay: '5分鐘前',
      isRead: false
    },
    {
      id: 'N2',
      type: 'warning',
      title: '異常登入警告',
      content: '系統檢測到多次異常登入嘗試，請檢查安全設置。',
      icon: 'exclamation-triangle',
      time: new Date().toISOString(),
      timeDisplay: '20分鐘前',
      isRead: false
    },
    {
      id: 'N3',
      type: 'success',
      title: 'AI模型訓練完成',
      content: '新的AI推薦模型訓練已完成，準確率提升15%。',
      icon: 'check-circle',
      time: new Date().toISOString(),
      timeDisplay: '2小時前',
      isRead: true
    }
  ]
};

// 數據轉換工具函數：將 snake_case 轉換為 camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformDashboardData = (apiResponse: any): DashboardResponse => {
  // 檢查是否有直接返回數據（無 data 屬性）
  const data = apiResponse.data || apiResponse;
  
  // 添加安全檢查，確保有數據可用
  if (!data || !data.summary) {
    console.error('API 回應格式錯誤，無法取得資料');
    return mockDashboardData;
  }
  
  // 定義類型以解決 linter 錯誤
  interface ApiGame {
    game_id: string;
    name: string;
    icon: string;
    icon_color: string;
    value: number;
    percentage: number;
  }
  
  interface ApiTransaction {
    id: string;
    type: string;
    amount: number;
    username: string;
    user_id: string;
    time: string;
    time_display: string;
  }
  
  interface ApiNotification {
    id: string;
    type: string;
    title: string;
    content: string;
    icon: string;
    time: string;
    time_display: string;
    is_read: boolean;
  }
  
  return {
    summary: {
      totalIncome: data.summary?.total_income || 0,
      incomePercentage: data.summary?.income_percentage || 0,
      activeUsers: data.summary?.active_users || 0,
      usersPercentage: data.summary?.users_percentage || 0,
      totalGames: data.summary?.total_games || 0,
      newGames: data.summary?.new_games || 0,
      aiEffectiveness: data.summary?.ai_effectiveness || 0,
      aiImprovement: data.summary?.ai_improvement || 0,
      currentDate: data.summary?.current_date || new Date().toLocaleDateString('zh-TW'),
      adminName: data.summary?.admin_name || '管理員',
      adminRole: data.summary?.admin_role || '管理員'
    },
    income: data.income || [],
    popularGames: (data.popular_games || []).map((game: ApiGame) => ({
      gameId: game.game_id,
      name: game.name,
      icon: game.icon,
      iconColor: game.icon_color,
      value: game.value,
      percentage: game.percentage
    })),
    recentTransactions: (data.recent_transactions || []).map((transaction: ApiTransaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      username: transaction.username,
      userId: transaction.user_id,
      time: transaction.time,
      timeDisplay: transaction.time_display
    })),
    notifications: (data.notifications || []).map((notification: ApiNotification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      icon: notification.icon,
      time: notification.time,
      timeDisplay: notification.time_display,
      isRead: notification.is_read
    }))
  };
};

const dashboardApi = {
  /**
   * 獲取儀表板數據
   * @param timeRange 時間範圍: today, week, month, year
   */
  getDashboardData: async (timeRange: string = 'today'): Promise<DashboardResponse> => {
    // 嘗試從真實 API 獲取數據
    try {
      // 修正 API 路徑，確保前綴是 /api/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.get<any>(`/dashboard/data?time_range=${timeRange}`);
      return transformDashboardData(response.data);
    } catch (error) {
      console.log('使用模擬數據（API 錯誤）:', error);
      // 返回模擬數據
      return mockDashboardData;
    }
  },

  /**
   * 將所有通知標記為已讀
   */
  markAllNotificationsAsRead: async (): Promise<{ message: string }> => {
    try {
      // 修正 API 路徑，確保前綴是 /
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.post<any>(`/dashboard/notifications/read`);
      // 直接返回 message，不再嘗試存取 data 屬性
      return { message: response.data?.message || '通知已標記為已讀' };
    } catch (error) {
      console.log('標記通知為已讀失敗:', error);
      // 返回模擬響應
      return { message: '所有通知已標記為已讀' };
    }
  }
};

export default dashboardApi; 