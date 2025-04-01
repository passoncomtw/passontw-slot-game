// Auth 相關類型
export interface User {
  admin_id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'operator' | 'viewer';
  avatar_url?: string;
  is_active: boolean;
  last_login_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expires_at: string;
}

// 儀表板相關類型
export interface DashboardStats {
  total_users: number;
  new_users: number;
  active_users: number;
  total_deposits: number;
  total_withdrawals: number;
  total_bets: number;
  total_wins: number;
  gross_gaming_revenue: number;
  game_performance: Record<string, {
    bets: number;
    wins: number;
    unique_players: number;
  }>;
  user_retention: Record<string, number>;
}

// 遊戲相關類型
export interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 用戶相關類型
export interface UserData {
  user_id: string;
  username: string;
  email: string;
  role: 'user' | 'vip' | 'admin';
  vip_level: number;
  points: number;
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  wallet?: {
    balance: number;
    total_deposit: number;
    total_withdraw: number;
    total_bet: number;
    total_win: number;
  };
}

// 交易相關類型
export interface Transaction {
  transaction_id: string;
  user_id: string;
  user_name?: string;
  wallet_id: string;
  amount: number;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  game_id?: string;
  game_name?: string;
  session_id?: string;
  round_id?: string;
  reference_id?: string;
  description?: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
  updated_at: string;
}

// 日誌相關類型
export interface OperationLog {
  log_id: string;
  admin_id?: string;
  admin_name?: string;
  operation: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'other';
  entity_type: 'user' | 'game' | 'transaction' | 'setting' | 'admin' | 'system';
  entity_id?: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  request_data?: Record<string, unknown>;
  response_data?: Record<string, unknown>;
  status: 'success' | 'failure' | 'warning';
  executed_at: string;
}

// API 請求參數
export interface PaginatedRequest {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// 表格過濾參數
export interface FilterParams {
  page: number;
  page_size: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// API 錯誤類型
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
} 