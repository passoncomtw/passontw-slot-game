import { takeLatest, put, call, all } from 'redux-saga/effects';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  loginRequest, 
  loginSuccess, 
  loginFailure, 
  registerRequest, 
  registerSuccess, 
  registerFailure, 
  logoutRequest, 
  logoutSuccess, 
  logoutFailure,
  LoginRequest,
  RegisterRequest,
  User
} from '../slices/authSlice';
import { apiService, AUTH_TOKEN_KEY, USER_PROFILE_KEY } from '../api/apiClient';
import userService, { TokenResponse, UserProfile } from '../api/userService';

// 登入 Saga
function* loginSaga(action: ReturnType<typeof loginRequest>) {
  try {
    console.log('開始登入流程:', action.payload);
    
    // 調用 API
    const tokenResponse: TokenResponse = yield call(userService.login, {
      email: action.payload.email,
      password: action.payload.password
    });
    
    // 保存 token 到 AsyncStorage
    if (tokenResponse.token) {
      yield call(AsyncStorage.setItem, AUTH_TOKEN_KEY, tokenResponse.token);
      console.log('Token 已儲存');
      
      try {
        // 獲取用戶資料
        const profileData: UserProfile = yield call(userService.getProfile);
        
        // 映射 API 用戶資料到應用程式用戶模型
        const user: User = {
          id: profileData.userId,
          username: profileData.username,
          email: profileData.email,
          balance: profileData.wallet?.balance || 0,
          points: profileData.points || 0,
          vipLevel: profileData.vipLevel || 1,
          avatar: profileData.avatarUrl
        };
        
        // 如果要記住登入狀態，也保存用戶資料
        if (action.payload.rememberMe) {
          yield call(AsyncStorage.setItem, USER_PROFILE_KEY, JSON.stringify(user));
          console.log('用戶資料已儲存到本地');
        }
        
        // 成功後派發 action
        yield put(loginSuccess(user));
        console.log('登入成功');
      } catch (profileError) {
        console.error('獲取用戶資料失敗:', profileError);
        
        // 創建一個基本用戶對象，使用已知的電子郵件
        const basicUser: User = {
          id: 'temp-id',
          username: action.payload.email.split('@')[0], // 使用郵箱前綴作為用戶名
          email: action.payload.email,
          balance: 0,
          points: 0,
          vipLevel: 1
        };
        
        // 派發登入成功 action，即使無法獲取完整用戶資料
        yield put(loginSuccess(basicUser));
        console.log('登入成功 (使用基本用戶資料)');
      }
    } else {
      throw new Error('登入失敗：沒有收到有效的 token');
    }
  } catch (error) {
    // 失敗後派發 action
    const errorMessage = error instanceof Error ? error.message : '登入失敗，請稍後再試';
    console.error('登入錯誤:', errorMessage);
    yield put(loginFailure(errorMessage));
  }
}

// 註冊 Saga
function* registerSaga(action: ReturnType<typeof registerRequest>) {
  try {
    console.log('開始註冊流程:', action.payload);
    
    // 調用 API
    const tokenResponse: TokenResponse = yield call(userService.register, action.payload);
    
    // 保存 token 到 AsyncStorage
    if (tokenResponse.token) {
      yield call(AsyncStorage.setItem, AUTH_TOKEN_KEY, tokenResponse.token);
      console.log('Token 已儲存');
      
      try {
        // 獲取用戶資料
        const profileData: UserProfile = yield call(userService.getProfile);
        
        // 映射 API 用戶資料到應用程式用戶模型
        const user: User = {
          id: profileData.userId,
          username: profileData.username,
          email: profileData.email,
          balance: profileData.wallet?.balance || 0,
          points: profileData.points || 0,
          vipLevel: profileData.vipLevel || 1,
          avatar: profileData.avatarUrl
        };
        
        // 保存用戶資料到本地
        yield call(AsyncStorage.setItem, USER_PROFILE_KEY, JSON.stringify(user));
        
        // 成功後派發 action
        yield put(registerSuccess(user));
        console.log('註冊成功');
      } catch (profileError) {
        console.error('獲取用戶資料失敗:', profileError);
        
        // 基本用戶數據
        const basicUser: User = {
          id: 'temp-id',
          username: action.payload.username,
          email: action.payload.email,
          balance: 0,
          points: 0,
          vipLevel: 1
        };
        
        yield put(registerSuccess(basicUser));
        console.log('註冊成功 (使用基本用戶資料)');
      }
    } else {
      throw new Error('註冊失敗：沒有收到有效的 token');
    }
  } catch (error) {
    // 失敗後派發 action
    const errorMessage = error instanceof Error ? error.message : '註冊失敗，請稍後再試';
    console.error('註冊錯誤:', errorMessage);
    yield put(registerFailure(errorMessage));
  }
}

// 登出 Saga
function* logoutSaga() {
  try {
    console.log('開始登出流程');
    // 從 AsyncStorage 中移除 token 和用戶資料
    yield all([
      call(AsyncStorage.removeItem, AUTH_TOKEN_KEY),
      call(AsyncStorage.removeItem, USER_PROFILE_KEY)
    ]);
    
    // 成功後派發 action
    yield put(logoutSuccess());
    console.log('登出成功');
  } catch (error) {
    // 失敗後派發 action
    const errorMessage = error instanceof Error ? error.message : '登出失敗，請稍後再試';
    console.error('登出錯誤:', errorMessage);
    yield put(logoutFailure(errorMessage));
  }
}

// Auth Root Saga
export default function* authSaga() {
  yield all([
    takeLatest(loginRequest.type, loginSaga),
    takeLatest(registerRequest.type, registerSaga),
    takeLatest(logoutRequest.type, logoutSaga)
  ]);
} 