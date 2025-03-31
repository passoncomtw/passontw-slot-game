import { LoginRequest, LoginResponse, RegisterRequest, User } from '../types';
import api from './api';

/**
 * 認證相關的 API 服務
 */
export const authService = {
  /**
   * 用戶登入
   * @param data 登入請求參數
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/admin/auth/login', data);
    
    // 保存 token 和用戶信息到 localStorage
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_info', JSON.stringify(response.user));
    
    return response;
  },
  
  /**
   * 用戶註冊
   * @param data 註冊請求參數
   */
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/admin/auth/register', data);
    
    // 保存 token 和用戶信息到 localStorage
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_info', JSON.stringify(response.user));
    
    return response;
  },
  
  /**
   * 登出用戶
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/admin/auth/logout');
    } catch (error) {
      console.error('登出時發生錯誤:', error);
    } finally {
      // 無論請求成功與否，都清除本地存儲
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
    }
  },
  
  /**
   * 獲取當前登入用戶資訊
   */
  getCurrentUser: async (): Promise<User> => {
    return api.get<User>('/admin/auth/profile');
  },
  
  /**
   * 從 localStorage 獲取當前用戶
   */
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user_info');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error('解析用戶信息時發生錯誤:', error);
      return null;
    }
  },
  
  /**
   * 檢查用戶是否已登入
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};

export default authService; 