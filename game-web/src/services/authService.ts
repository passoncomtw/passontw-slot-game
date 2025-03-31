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
    try {
      // 實際連接到 API 進行登入
      const apiResponse = await api.post<{token: string, token_type: string, expires_in: number}>('/admin/login', data);
      
      // 解析 JWT token 取得用戶資訊
      const tokenParts = apiResponse.token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        
        // 構建標準化的回應格式
        const response: LoginResponse = {
          token: apiResponse.token,
          user: {
            admin_id: payload.admin_id || '',
            username: payload.username || '',
            email: payload.email || '',
            full_name: payload.full_name || '',
            role: payload.role || 'viewer',
            is_active: true,
            last_login_at: new Date().toISOString()
          },
          expires_at: new Date(payload.exp * 1000).toISOString()
        };
        
        // 根據 remember_me 選項決定存儲方式
        if (data.remember_me) {
          // 長期保存到 localStorage
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_info', JSON.stringify(response.user));
        } else {
          // 會話期間保存到 sessionStorage
          sessionStorage.setItem('auth_token', response.token);
          sessionStorage.setItem('user_info', JSON.stringify(response.user));
        }
        
        return response;
      } else {
        throw new Error('無效的 JWT token 格式');
      }
    } catch (error) {
      console.error('登入失敗:', error);
      // 重新拋出錯誤以便在 saga 中處理
      throw error;
    }
  },
  
  /**
   * 用戶註冊
   * @param data 註冊請求參數
   */
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/admin/auth/register', data);
      
      // 保存認證信息
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_info', JSON.stringify(response.user));
      
      return response;
    } catch (error) {
      console.error('註冊失敗:', error);
      throw error;
    }
  },
  
  /**
   * 登出用戶
   */
  logout: async (): Promise<void> => {
    try {
      // 呼叫登出 API
      await api.post('/admin/auth/logout');
    } catch (error) {
      console.error('登出時發生錯誤:', error);
    } finally {
      // 無論請求成功與否，都清除本地存儲
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_info');
    }
  },
  
  /**
   * 獲取當前登入用戶資訊
   */
  getCurrentUser: async (): Promise<User> => {
    // 嘗試從本地存儲獲取用戶信息
    const userStr = localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
    if (userStr) {
      return JSON.parse(userStr) as User;
    }
    
    // 如果本地沒有，則從 API 獲取
    return api.get<User>('/admin/auth/profile');
  },
  
  /**
   * 從 localStorage 或 sessionStorage 獲取當前用戶
   */
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
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
    return !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
  },
};

export default authService; 