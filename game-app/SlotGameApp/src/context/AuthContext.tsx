import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { fetchUserRequest } from '../store/slices/authSlice';
import { AUTH_TOKEN_KEY, USER_PROFILE_KEY } from '../store/api/apiClient';
import userService from '../store/api/userService';

// 這是一個假設內容，根據實際文件內容進行修改
// User 類型定義（確保與 store 中的 User 定義一致）
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  balance: number;
  points?: number;
  vipLevel?: number;
}

// 身份驗證上下文類型
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// 創建身份驗證上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 提供身份驗證相關功能的上下文
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  // 在組件掛載時檢查是否有保存的用戶會話
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 檢查本地存儲中是否有令牌和用戶資料
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        const userJson = await AsyncStorage.getItem(USER_PROFILE_KEY);
        
        if (token && userJson) {
          const userData = JSON.parse(userJson);
          setUser(userData);
          setIsAuthenticated(true);
          
          // 觸發從 API 獲取最新用戶數據的操作
          dispatch(fetchUserRequest());
        }
      } catch (error) {
        console.error('檢查身份驗證時出錯:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [dispatch]);

  // 登入方法
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 調用 API 登入
      const response = await userService.login({ email, password });
      
      if (response && response.token) {
        // 保存 token
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
        
        try {
          // 嘗試獲取用戶資料
          const userProfile = await userService.getProfile();
          
          // 建立用戶對象
          const userData: User = {
            id: userProfile.userId,
            username: userProfile.username,
            email: userProfile.email,
            balance: userProfile.wallet?.balance || 0,
            points: userProfile.points || 0,
            vipLevel: userProfile.vipLevel || 1,
            avatar: userProfile.avatarUrl
          };
          
          // 設置用戶狀態
          setUser(userData);
          setIsAuthenticated(true);
        } catch (profileError) {
          console.error('獲取用戶資料失敗:', profileError);
          
          // 使用基本用戶信息
          const basicUser: User = {
            id: 'temp-id',
            username: email.split('@')[0], // 使用郵箱名作為用戶名
            email,
            balance: 0,
            points: 0,
            vipLevel: 1
          };
          
          setUser(basicUser);
          setIsAuthenticated(true);
        }
      } else {
        throw new Error('登入失敗：無法獲取身份認證令牌');
      }
    } catch (error) {
      console.error('登入失敗:', error);
      setError(error instanceof Error ? error.message : '登入失敗，請稍後再試');
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 註冊方法
  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // 這裡模擬 API 調用成功，實際應用中應該使用 Redux Actions
      const mockUser: User = {
        id: '1',
        username: username,
        email: email,
        balance: 100, // 新用戶初始餘額
        points: 0,
        vipLevel: 1
      };
      
      // 保存用戶數據到本地存儲
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(mockUser));
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'mock-jwt-token');
      
      setUser(mockUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('註冊時出錯:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出方法
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // 清除本地存儲
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('登出時出錯:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 更新用戶數據
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // 更新本地存儲
      AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedUser))
        .catch(error => console.error('更新用戶數據時出錯:', error));
    }
  };

  // 提供上下文值
  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 使用身份驗證上下文的鉤子
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必須在 AuthProvider 內使用');
  }
  return context;
}; 