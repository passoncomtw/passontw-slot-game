// API 後端回應的格式（snake_case）
export interface ApiDashboardData {
  summary: {
    total_income: number;
    income_percentage: number;
    active_users: number;
    users_percentage: number;
    total_games: number;
    new_games: number;
    ai_effectiveness: number;
    ai_improvement: number;
    current_date: string;
    admin_name: string;
    admin_role: string;
  };
  income: Array<{
    time: string;
    value: number;
  }>;
  popular_games: Array<{
    game_id: string;
    name: string;
    icon: string;
    icon_color: string;
    value: number;
    percentage: number;
  }>;
  recent_transactions: Array<{
    id: string;
    type: string;
    amount: number;
    username: string;
    user_id: string;
    time: string;
    time_display: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    icon: string;
    time: string;
    time_display: string;
    is_read: boolean;
  }>;
}

export interface ApiDashboardResponse {
  code: number;
  message: string;
  data: ApiDashboardData;
}

// 標記通知為已讀的回應
export interface MarkNotificationsResponse {
  code: number;
  message: string;
}

// 前端使用的格式（camelCase）
export interface DashboardRequest {
  timeRange: string; // today, week, month, year
}

export interface DashboardSummary {
  totalIncome: number;
  incomePercentage: number;
  activeUsers: number;
  usersPercentage: number;
  totalGames: number;
  newGames: number;
  aiEffectiveness: number;
  aiImprovement: number;
  currentDate: string;
  adminName: string;
  adminRole: string;
}

export interface TimeSeriesData {
  time: string;
  value: number;
}

export interface GameStatistic {
  gameId: string;
  name: string;
  icon: string;
  iconColor: string;
  value: number;
  percentage: number;
}

export interface RecentTransaction {
  id: string;
  type: string; // deposit, withdraw
  amount: number;
  username: string;
  userId: string;
  time: string;
  timeDisplay: string;
}

export interface SystemNotification {
  id: string;
  type: string; // info, warning, success, accent
  title: string;
  content: string;
  icon: string;
  time: string;
  timeDisplay: string;
  isRead: boolean;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  income: TimeSeriesData[];
  popularGames: GameStatistic[];
  recentTransactions: RecentTransaction[];
  notifications: SystemNotification[];
} 