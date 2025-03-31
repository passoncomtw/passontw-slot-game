import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from '../types';

// 設定 API 的基本 URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3010';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || 30000);

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API 響應錯誤數據結構
interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    // 從 localStorage 或 sessionStorage 獲取 token
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // 如果有 token，將其加入到請求頭中
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // 當 token 無效或過期時，清除本地存儲並重定向到登錄頁面
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_info');
      window.location.href = '/login';
    }
    
    // 創建標準化的錯誤對象
    const apiError: ApiError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || '發生未知錯誤',
      errors: error.response?.data?.errors,
    };
    
    console.error('API 錯誤:', apiError);
    return Promise.reject(apiError);
  }
);

// 通用 API 請求函數
export const api = {
  /**
   * 發送 GET 請求
   */
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get(url, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  /**
   * 發送 POST 請求
   */
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post(url, data, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  /**
   * 發送 PUT 請求
   */
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.put(url, data, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  /**
   * 發送 DELETE 請求
   */
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete(url, config).then((response: AxiosResponse<T>) => response.data);
  },
};

export default api; 