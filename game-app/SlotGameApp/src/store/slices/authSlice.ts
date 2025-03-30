import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 使用者類型
export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  vipLevel?: number;
  points?: number;
  avatar?: string;
}

// 認證狀態類型
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// 登入請求參數
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

// 註冊請求參數
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// 初始狀態
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

// 創建 auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 登入請求
    loginRequest: (state, action: PayloadAction<LoginRequest>) => {
      state.loading = true;
      state.error = null;
    },
    // 登入成功
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    // 登入失敗
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // 註冊請求
    registerRequest: (state, action: PayloadAction<RegisterRequest>) => {
      state.loading = true;
      state.error = null;
    },
    // 註冊成功
    registerSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    // 註冊失敗
    registerFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // 登出請求
    logoutRequest: (state) => {
      state.loading = true;
    },
    // 登出成功
    logoutSuccess: (state) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
    // 登出失敗
    logoutFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // 獲取用戶請求
    fetchUserRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    // 獲取用戶成功
    fetchUserSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    // 獲取用戶失敗
    fetchUserFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // 更新用戶餘額
    updateUserBalance: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.balance = action.payload;
      }
    }
  }
});

// 導出 actions
export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  registerRequest,
  registerSuccess,
  registerFailure,
  logoutRequest,
  logoutSuccess,
  logoutFailure,
  fetchUserRequest,
  fetchUserSuccess,
  fetchUserFailure,
  updateUserBalance
} = authSlice.actions;

// 導出 reducer
export default authSlice.reducer; 