import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LoginRequest, RegisterRequest, User } from '../../types';

// 認證狀態
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// 初始狀態
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

// 創建 auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 登入請求
    loginRequest: {
      reducer: (state) => {
        state.loading = true;
        state.error = null;
      },
      prepare: (payload: LoginRequest) => ({ payload })
    },
    
    // 登入成功
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    
    // 登入失敗
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    // 註冊請求
    registerRequest: {
      reducer: (state) => {
        state.loading = true;
        state.error = null;
      },
      prepare: (payload: RegisterRequest) => ({ payload })
    },
    
    // 註冊成功
    registerSuccess: (state, action: PayloadAction<User>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
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
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    
    // 獲取用戶資料請求
    fetchUserRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    
    // 獲取用戶資料成功
    fetchUserSuccess: (state, action: PayloadAction<User>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    
    // 獲取用戶資料失敗
    fetchUserFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    // 清除錯誤
    clearError: (state) => {
      state.error = null;
    },
  },
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
  fetchUserRequest,
  fetchUserSuccess,
  fetchUserFailure,
  clearError,
} = authSlice.actions;

// 導出 reducer
export default authSlice.reducer; 