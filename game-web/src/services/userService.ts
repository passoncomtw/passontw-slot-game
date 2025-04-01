import api from './api';
import { PaginatedRequest } from '../types';

// 後端用戶數據類型
export interface ApiUser {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  balance: number;
  status: string;
  created_at: string;
}

// API 響應類型
export interface ApiResponse<T> {
  users: T[];
  total: number;
  current_page: number;
  page_size: number;
  total_pages: number;
}

// 用戶相關接口
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'vip' | 'admin';
  is_verified?: boolean;
  is_active?: boolean;
}

// 用戶服務
const userService = {
  /**
   * 獲取用戶列表
   * @param params 分頁參數
   */
  getUserList: (params: PaginatedRequest): Promise<ApiResponse<ApiUser>> => {
    return api.get(`/admin/users`, { params });
  },

  /**
   * 獲取單個用戶信息
   * @param userId 用戶ID
   */
  getUserById: (userId: string): Promise<{ data: ApiUser }> => {
    return api.get(`/admin/users/${userId}`);
  },

  /**
   * 創建新用戶
   * @param userData 用戶數據
   */
  createUser: (userData: CreateUserRequest): Promise<{ success: boolean; data: ApiUser; message?: string }> => {
    return api.post(`/admin/users`, userData);
  },

  /**
   * 更新用戶狀態（啟用/禁用）
   * @param userId 用戶ID
   * @param isActive 是否活躍
   */
  updateUserStatus: (userId: string, isActive: boolean): Promise<{ success: boolean; message?: string }> => {
    return api.put(`/admin/users/${userId}/status`, { status: isActive ? 'active' : 'inactive' });
  },

  /**
   * 更新用戶信息
   * @param userId 用戶ID
   * @param userData 用戶數據
   */
  updateUser: (userId: string, userData: Partial<CreateUserRequest>): Promise<{ success: boolean; data: ApiUser; message?: string }> => {
    return api.put(`/admin/users/${userId}`, userData);
  },

  /**
   * 為用戶錢包增加餘額
   * @param userId 用戶ID
   * @param amount 金額
   * @param note 備註
   */
  addUserBalance: (userId: string, amount: number, note?: string): Promise<{ success: boolean; message?: string }> => {
    return api.post(`/admin/users/${userId}/wallet/deposit`, { amount, note });
  }
};

export default userService; 