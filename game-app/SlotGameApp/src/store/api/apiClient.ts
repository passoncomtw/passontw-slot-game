import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// 獲取環境變數中的 API URL，如果沒有設置則使用默認值
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3010/api/v1';

// Token 存儲鍵
export const AUTH_TOKEN_KEY = '@SlotGame:auth_token';
export const USER_PROFILE_KEY = '@SlotGame:user_profile';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 添加日誌
console.log('Loading apiClient...');

// 請求攔截器
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // 從 AsyncStorage 獲取 token
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      // 如果 token 存在，添加到請求頭
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      console.log(`API 請求: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    } catch (error) {
      console.error('獲取 token 失敗', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API 響應: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    // 處理 401 錯誤 (身份驗證失敗)
    if (error.response && error.response.status === 401) {
      try {
        // 移除 token 和用戶資料
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_PROFILE_KEY);
        console.log('已移除無效的身份認證資料');
      } catch (e) {
        console.error('移除身份認證資料失敗', e);
      }
    }
    
    console.error('API 請求錯誤:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API 服務包裝器，負責處理 axios 響應體
export const apiService = {
  get: async <T>(url: string, config = {}) => {
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`GET ${url} 請求失敗:`, error);
      throw error;
    }
  },
  
  post: async <T>(url: string, data = {}, config = {}) => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`POST ${url} 請求失敗:`, error);
      throw error;
    }
  },
  
  put: async <T>(url: string, data = {}, config = {}) => {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PUT ${url} 請求失敗:`, error);
      throw error;
    }
  },
  
  delete: async <T>(url: string, config = {}) => {
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${url} 請求失敗:`, error);
      throw error;
    }
  }
};

export default apiClient; 