import { takeLatest, put, call } from 'redux-saga/effects';
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
  fetchUserRequest,
  fetchUserSuccess,
  fetchUserFailure,
  LoginRequest,
  RegisterRequest,
  User
} from '../slices/authSlice';
import apiClient from '../api/apiClient';

// API 響應類型
interface AuthResponse {
  token: string;
  user: User;
}

// 登入 API 調用
const loginApi = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    console.log('調用登入 API:', data);
    const response = await apiClient.post('/auth/login', data);
    console.log('登入 API 響應:', response.data);
    return response.data;
  } catch (error) {
    console.error('登入 API 錯誤:', error);
    throw error;
  }
};

// 註冊 API 調用
const registerApi = async (data: RegisterRequest): Promise<AuthResponse> => {
  try {
    console.log('調用註冊 API:', data);
    const response = await apiClient.post('/users', data);
    console.log('註冊 API 響應:', response.data);
    return response.data;
  } catch (error) {
    console.error('註冊 API 錯誤:', error);
    throw error;
  }
};

// 獲取用戶信息 API 調用
const fetchUserApi = async (): Promise<{user: User}> => {
  try {
    console.log('調用獲取用戶信息 API');
    const response = await apiClient.get('/users/profile');
    console.log('獲取用戶信息 API 響應:', response.data);
    return response.data;
  } catch (error) {
    console.error('獲取用戶信息 API 錯誤:', error);
    throw error;
  }
};

// 登入 Saga
function* loginSaga(action: ReturnType<typeof loginRequest>) {
  try {
    console.log('開始登入流程:', action.payload);
    // 調用 API
    const response: AuthResponse = yield call(loginApi, action.payload);
    
    // 保存 token 到 AsyncStorage
    if (response.token) {
      yield call([AsyncStorage, 'setItem'], 'auth_token', response.token);
      console.log('Token 已儲存');
    }
    
    // 成功後派發 action
    yield put(loginSuccess(response.user));
    console.log('登入成功');
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
    const response: AuthResponse = yield call(registerApi, action.payload);
    
    // 保存 token 到 AsyncStorage
    if (response.token) {
      yield call([AsyncStorage, 'setItem'], 'auth_token', response.token);
      console.log('Token 已儲存');
    }
    
    // 成功後派發 action
    yield put(registerSuccess(response.user));
    console.log('註冊成功');
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
    // 從 AsyncStorage 中移除 token
    yield call([AsyncStorage, 'removeItem'], 'auth_token');
    
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

// 獲取用戶信息 Saga
function* fetchUserSaga() {
  try {
    console.log('開始獲取用戶信息流程');
    // 檢查是否有 token
    const token: string | null = yield call([AsyncStorage, 'getItem'], 'auth_token');
    
    if (!token) {
      console.error('無效的驗證：沒有 token');
      yield put(fetchUserFailure('無效的驗證'));
      return;
    }
    
    // 調用 API
    const response: {user: User} = yield call(fetchUserApi);
    
    // 成功後派發 action
    yield put(fetchUserSuccess(response.user));
    console.log('獲取用戶信息成功');
  } catch (error) {
    // 失敗後派發 action
    const errorMessage = error instanceof Error ? error.message : '獲取用戶信息失敗';
    console.error('獲取用戶信息錯誤:', errorMessage);
    yield put(fetchUserFailure(errorMessage));
  }
}

// Auth Root Saga
export function* authSaga() {
  yield takeLatest(loginRequest.type, loginSaga);
  yield takeLatest(registerRequest.type, registerSaga);
  yield takeLatest(logoutRequest.type, logoutSaga);
  yield takeLatest(fetchUserRequest.type, fetchUserSaga);
} 