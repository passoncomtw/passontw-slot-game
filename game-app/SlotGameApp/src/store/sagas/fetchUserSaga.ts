import { takeLatest, put, call, all } from 'redux-saga/effects';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  fetchUserRequest,
  fetchUserSuccess,
  fetchUserFailure,
  User
} from '../slices/authSlice';
import userService, { UserProfile } from '../api/userService';
import { AUTH_TOKEN_KEY, USER_PROFILE_KEY } from '../api/apiClient';

// 獲取用戶信息 Saga
function* fetchUserSaga() {
  try {
    console.log('開始獲取用戶信息流程');
    // 檢查是否有 token
    const token: string | null = yield call(AsyncStorage.getItem, AUTH_TOKEN_KEY);
    
    if (!token) {
      // 檢查是否有本地存儲的用戶資料（用於自動登入）
      const savedUserData: string | null = yield call(AsyncStorage.getItem, USER_PROFILE_KEY);
      
      if (savedUserData) {
        console.log('從本地存儲讀取用戶資料');
        try {
          const user: User = JSON.parse(savedUserData);
          yield put(fetchUserSuccess(user));
          console.log('成功從本地存儲讀取用戶資料');
          return;
        } catch (parseError) {
          console.error('解析本地用戶資料失敗:', parseError);
          yield call(AsyncStorage.removeItem, USER_PROFILE_KEY);
        }
      }
      
      console.error('無效的驗證：沒有 token 和本地用戶資料');
      yield put(fetchUserFailure('無效的驗證'));
      return;
    }
    
    try {
      // 調用 API 獲取最新用戶資料
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
      
      // 更新本地存儲的用戶資料
      yield call(AsyncStorage.setItem, USER_PROFILE_KEY, JSON.stringify(user));
      
      // 成功後派發 action
      yield put(fetchUserSuccess(user));
      console.log('獲取用戶信息成功');
    } catch (apiError) {
      console.error('API 獲取用戶資料失敗:', apiError);
      
      // 嘗試使用本地資料作為後備
      const savedUserData: string | null = yield call(AsyncStorage.getItem, USER_PROFILE_KEY);
      
      if (savedUserData) {
        try {
          console.log('使用本地存儲資料作為後備');
          const user: User = JSON.parse(savedUserData);
          yield put(fetchUserSuccess(user));
          return;
        } catch (parseError) {
          console.error('解析本地用戶資料失敗:', parseError);
        }
      }
      
      // 如果無法從 API 或本地獲取資料，則報告失敗
      const errorMessage = apiError instanceof Error ? apiError.message : '獲取用戶信息失敗';
      yield put(fetchUserFailure(errorMessage));
    }
  } catch (error) {
    // 失敗後派發 action
    const errorMessage = error instanceof Error ? error.message : '獲取用戶信息失敗';
    console.error('獲取用戶信息錯誤:', errorMessage);
    
    // 清除無效的登入資料
    yield all([
      call(AsyncStorage.removeItem, AUTH_TOKEN_KEY),
      call(AsyncStorage.removeItem, USER_PROFILE_KEY)
    ]);
    
    yield put(fetchUserFailure(errorMessage));
  }
}

// Fetch User Root Saga
export default function* fetchUserRootSaga() {
  yield takeLatest(fetchUserRequest.type, fetchUserSaga);
} 