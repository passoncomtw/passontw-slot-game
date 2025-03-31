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
function* loginSaga(action: PayloadAction<LoginRequest>): Generator<any, void, LoginResponse> {
  try {
    // 呼叫登入 API
    const response = yield call(authService.login, action.payload);
    
    // 登入成功，發送成功 action
    yield put(loginSuccess(response.user));
  } catch (error) {
    // 登入失敗，發送失敗 action
    const apiError = error as ApiError;
    yield put(loginFailure(apiError.message));
  }
}

/**
 * 處理註冊請求
 */
function* registerSaga(action: PayloadAction<RegisterRequest>): Generator<any, void, LoginResponse> {
  try {
    // 呼叫註冊 API
    const response = yield call(authService.register, action.payload);
    
    // 註冊成功，發送成功 action
    yield put(registerSuccess(response.user));
  } catch (error) {
    // 註冊失敗，發送失敗 action
    const apiError = error as ApiError;
    yield put(registerFailure(apiError.message));
  }
}

/**
 * 處理登出請求
 */
function* logoutSaga(): Generator<any, void, void> {
  try {
    // 呼叫登出 API
    yield call(authService.logout);
    
    // 登出成功，發送成功 action
    yield put(logoutSuccess());
  } catch (error) {
    // 登出失敗，仍然視為登出成功（清除本地狀態）
    console.error('登出錯誤:', error);
    yield put(logoutSuccess());
  }
}

/**
 * 處理獲取用戶資料請求
 */
function* fetchUserSaga(): Generator<any, void, User> {
  try {
    // 呼叫獲取用戶資料 API
    const user: User = yield call(authService.getCurrentUser);
    
    // 獲取成功，發送成功 action
    yield put(fetchUserSuccess(user));
  } catch (error) {
    // 獲取失敗，發送失敗 action
    const apiError = error as ApiError;
    yield put(fetchUserFailure(apiError.message));
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