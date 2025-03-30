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
  return apiService.post<AuthResponse>('/api/api//v1/auth/login', data);
};

export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  return apiService.post<AuthResponse>('/api/v1/auth/register', data);
};

// 錢包相關 API
export const getWalletBalance = async (): Promise<UserWallet> => {
  return apiService.get<UserWallet>('/api/v1/wallet/balance');
};

export const requestDeposit = async (data: DepositRequest): Promise<TransactionResponse> => {
  return apiService.post<TransactionResponse>('/api/v1/wallet/deposit', data);
};

export const requestWithdraw = async (data: WithdrawRequest): Promise<TransactionResponse> => {
  return apiService.post<TransactionResponse>('/api/v1/wallet/withdraw', data);
};

export const getTransactionHistory = async (params: TransactionHistoryRequest): Promise<TransactionHistoryResponse> => {
  return apiService.get<TransactionHistoryResponse>('/api/v1/wallet/transactions', {params});
}; 