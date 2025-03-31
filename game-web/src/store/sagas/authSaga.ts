import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { 
  loginRequest, 
  loginSuccess, 
  loginFailure, 
  logoutRequest, 
  logoutSuccess,
  fetchUserRequest,
  fetchUserSuccess,
  fetchUserFailure,
  registerRequest,
  registerSuccess,
  registerFailure
} from '../slices/authSlice';
import authService from '../../services/authService';
import { LoginRequest, RegisterRequest, ApiError, User, LoginResponse } from '../../types';

/**
 * 處理登入請求
 */
function* loginSaga(action: PayloadAction<LoginRequest>) {
  try {
    // 顯示登入中的狀態 (可以通過 UI 元件提示用戶)

    // 呼叫登入 API
    const response: LoginResponse = yield call(authService.login, action.payload);
    
    // 登入成功，發送成功 action
    yield put(loginSuccess(response.user));

    // 可以在這裡添加額外的成功處理邏輯，如顯示通知
    console.log('登入成功');
    
    // 登入成功後跳轉到儀表板頁面
    window.location.href = '/dashboard';
  } catch (error) {
    // 登入失敗，發送失敗 action
    console.error('登入失敗:', error);
    
    if (typeof error === 'object' && error !== null) {
      const apiError = error as ApiError;
      yield put(loginFailure(apiError.message || '登入失敗，請稍後再試'));
    } else {
      yield put(loginFailure('登入過程中發生未知錯誤'));
    }
    
    // 可以在這裡添加額外的失敗處理邏輯，如日誌記錄
  }
}

/**
 * 處理註冊請求
 */
function* registerSaga(action: PayloadAction<RegisterRequest>) {
  try {
    // 呼叫註冊 API
    const response: LoginResponse = yield call(authService.register, action.payload);
    
    // 註冊成功，發送成功 action
    yield put(registerSuccess(response.user));
    
    // 註冊成功後跳轉到儀表板頁面
    window.location.href = '/dashboard';
  } catch (error) {
    // 註冊失敗，發送失敗 action
    console.error('註冊失敗:', error);
    
    if (typeof error === 'object' && error !== null) {
      const apiError = error as ApiError;
      yield put(registerFailure(apiError.message || '註冊失敗，請稍後再試'));
    } else {
      yield put(registerFailure('註冊過程中發生未知錯誤'));
    }
  }
}

/**
 * 處理登出請求
 */
function* logoutSaga() {
  try {
    // 呼叫登出 API
    yield call(authService.logout);
    
    // 登出成功，發送成功 action
    yield put(logoutSuccess());
    
    // 重定向到登入頁面
    window.location.href = '/login';
  } catch (error) {
    // 登出失敗，仍然視為登出成功（清除本地狀態）
    console.error('登出錯誤:', error);
    yield put(logoutSuccess());
    
    // 重定向到登入頁面
    window.location.href = '/login';
  }
}

/**
 * 處理獲取用戶資料請求
 */
function* fetchUserSaga() {
  try {
    // 呼叫獲取用戶資料 API
    const user: User = yield call(authService.getCurrentUser);
    
    // 獲取成功，發送成功 action
    yield put(fetchUserSuccess(user));
  } catch (error) {
    // 獲取失敗，發送失敗 action
    console.error('獲取用戶資料失敗:', error);
    
    if (typeof error === 'object' && error !== null) {
      const apiError = error as ApiError;
      yield put(fetchUserFailure(apiError.message || '獲取用戶資料失敗'));
    } else {
      yield put(fetchUserFailure('獲取用戶資料過程中發生未知錯誤'));
    }
  }
}

/**
 * Auth Saga
 */
export default function* authSaga() {
  // 監聽登入請求
  yield takeLatest(loginRequest.type, loginSaga);
  
  // 監聽註冊請求
  yield takeLatest(registerRequest.type, registerSaga);
  
  // 監聽登出請求
  yield takeLatest(logoutRequest.type, logoutSaga);
  
  // 監聽獲取用戶資料請求
  yield takeLatest(fetchUserRequest.type, fetchUserSaga);
} 