import { apiService } from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
}

export interface UserProfileSettings {
  userId: string;
  sound: boolean;
  music: boolean;
  vibration: boolean;
  highQuality: boolean;
  aiAssistant: boolean;
  gameRecommendation: boolean;
  dataCollection: boolean;
  updatedAt: string;
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

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  vipLevel: number;
  points: number;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  wallet?: UserWallet;
}

export interface UpdateProfileRequest {
  username?: string;
  avatarUrl?: string;
}

export interface UpdateSettingsRequest {
  sound?: boolean;
  music?: boolean;
  vibration?: boolean;
  highQuality?: boolean;
  aiAssistant?: boolean;
  gameRecommendation?: boolean;
  dataCollection?: boolean;
}

export interface DepositRequest {
  amount: number;
  paymentType: string;
  referenceId?: string;
}

export interface WithdrawRequest {
  amount: number;
  bankAccount?: string;
  bankCode?: string;
  bankName?: string;
}

export interface TransactionResponse {
  transactionId: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  gameId?: string;
  gameTitle?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

const userService = {
  // 登錄
  login: (data: LoginRequest): Promise<TokenResponse> => {
    return apiService.post<TokenResponse>('/auth/login', data);
  },

  // 註冊
  register: (data: RegisterRequest): Promise<TokenResponse> => {
    return apiService.post<TokenResponse>('/users', data);
  },

  // 獲取用戶個人資料
  getProfile: (): Promise<UserProfile> => {
    return apiService.get<UserProfile>('/users/profile');
  },

  // 更新用戶個人資料
  updateProfile: (data: UpdateProfileRequest): Promise<void> => {
    return apiService.put<void>('/users/profile', data);
  },

  // 更新用戶設定
  updateSettings: (data: UpdateSettingsRequest): Promise<void> => {
    return apiService.put<void>('/users/settings', data);
  },

  // 獲取錢包餘額
  getWalletBalance: (): Promise<UserWallet> => {
    return apiService.get<UserWallet>('/wallet/balance');
  },

  // 請求充值
  requestDeposit: (data: DepositRequest): Promise<TransactionResponse> => {
    return apiService.post<TransactionResponse>('/wallet/deposit', data);
  },

  // 請求提款
  requestWithdraw: (data: WithdrawRequest): Promise<TransactionResponse> => {
    return apiService.post<TransactionResponse>('/wallet/withdraw', data);
  },
};

export default userService; 