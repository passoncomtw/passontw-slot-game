import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// 獲取環境變數中的 API URL，如果沒有設置則使用默認值
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3010/api/v1';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 請求攔截器
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // 從 AsyncStorage 獲取 token
      const token = await AsyncStorage.getItem('auth_token');
      
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
        // 移除 token
        await AsyncStorage.removeItem('auth_token');
        console.log('已移除無效的 token');
      } catch (e) {
        console.error('移除 token 失敗', e);
      }
    }
    
    console.error('API 請求錯誤:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient; 