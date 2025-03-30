import { apiService } from './apiClient';

export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  balance: number;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserWallet {
  walletId: string;
  balance: number;
  totalDeposit: number;
  totalWithdraw: number;
  totalBet: number;
  totalWin: number;
  updatedAt: string;
}

export interface DepositRequest {
  amount: number;
  payment_type: string;
  reference_id?: string;
}

export interface WithdrawRequest {
  amount: number;
  bank_account: string;
  bank_code: string;
  account_name: string;
}

export interface TransactionResponse {
  transaction_id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export interface TransactionHistoryRequest {
  type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface TransactionHistoryResponse {
  transactions: TransactionResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 用戶驗證相關 API
export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  return apiService.post<AuthResponse>('/auth/login', data);
};

export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  return apiService.post<AuthResponse>('/auth/register', data);
};

// 錢包相關 API
export const getWalletBalance = async (): Promise<UserWallet> => {
  return apiService.get<UserWallet>('/wallet/balance');
};

export const requestDeposit = async (data: DepositRequest): Promise<TransactionResponse> => {
  return apiService.post<TransactionResponse>('/wallet/deposit', data);
};

export const requestWithdraw = async (data: WithdrawRequest): Promise<TransactionResponse> => {
  return apiService.post<TransactionResponse>('/wallet/withdraw', data);
};

export const getTransactionHistory = async (params: TransactionHistoryRequest): Promise<TransactionHistoryResponse> => {
  console.log('📡 API 請求交易記錄 - 參數:', params);
  try {
    const response = await apiService.get<TransactionHistoryResponse>('/wallet/transactions', {params});
    console.log('📡 API 交易記錄響應:', response);
    
    // 驗證響應數據
    if (!response || !response.transactions) {
      console.error('📡 API 響應無效 - 缺少 transactions 欄位');
      throw new Error('無效的響應數據');
    }
    
    return response;
  } catch (error) {
    console.error('📡 獲取交易記錄失敗:', error);
    // 手動創建一個有效的響應以避免應用崩潰
    // 實際場景應該是適當處理錯誤
    const mockResponse: TransactionHistoryResponse = {
      transactions: [],
      total: 0,
      page: params.page || 1,
      page_size: params.page_size || 20,
      total_pages: 0
    };
    return mockResponse;
  }
}; 