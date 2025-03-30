import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { fetchUserRequest, logoutRequest } from '../store/slices/authSlice';
import { AUTH_TOKEN_KEY, USER_PROFILE_KEY } from '../store/api/apiClient';
import * as userService from '../store/api/userService';

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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
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
        console.log('檢查持久化登入狀態...');
        // 檢查本地存儲中是否有令牌和用戶資料
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        const userJson = await AsyncStorage.getItem(USER_PROFILE_KEY);
        
        if (token && userJson) {
          console.log('找到已保存的登入資料，正在恢復會話');
          try {
            const userData = JSON.parse(userJson);
            setUser(userData);
            setIsAuthenticated(true);
            
            // 觸發從 API 獲取最新用戶數據的操作
            dispatch(fetchUserRequest());
            console.log('已恢復用戶會話並請求最新數據');
          } catch (parseError) {
            console.error('解析本地用戶資料失敗:', parseError);
            await AsyncStorage.removeItem(USER_PROFILE_KEY);
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          }
        } else {
          console.log('沒有找到持久化登入資料');
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
  const login = async (email: string, password: string, rememberMe: boolean = true): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`開始登入: ${email}, 記住登入狀態: ${rememberMe}`);
      
      // 調用 API 登入
      const response = await userService.loginUser({ email, password });
      
      if (response && response.token) {
        // 保存 token - 無論 rememberMe 設置如何，都需要保存 token
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
        console.log('Token 已保存到本地存儲');
        
        try {
          // 嘗試獲取用戶資料
          const userProfile = await userService.getWalletBalance();
          
          // 建立用戶對象
          const userData: User = {
            id: userProfile.walletId || 'temp-id',
            username: email.split('@')[0], // 使用郵箱名作為用戶名
            email: email,
            balance: userProfile.balance || 0,
            points: 0,
            vipLevel: 1,
          };
          
          // 設置用戶狀態
          setUser(userData);
          setIsAuthenticated(true);
          
          // 始終保存用戶資料到本地存儲，以支持持久化登入
          await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userData));
          console.log(`用戶資料已保存到本地存儲，持久化登入已啟用`);
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
          
          // 即使使用基本用戶資料，也保存到本地存儲
          await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(basicUser));
          console.log('基本用戶資料已保存到本地存儲');
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
      
      // 調用 API 進行註冊
      const response = await userService.registerUser({
        username,
        email,
        password
      });
      
      if (response && response.token) {
        // 保存 token
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
        
        try {
          // 嘗試獲取用戶資料
          const userProfile = await userService.getWalletBalance();
          
          // 建立用戶對象
          const userData: User = {
            id: userProfile.walletId || 'temp-id',
            username,
            email,
            balance: userProfile.balance || 0,
            points: 0,
            vipLevel: 1,
          };
          
          // 設置用戶狀態
          setUser(userData);
          setIsAuthenticated(true);
          
          // 保存用戶資料到本地存儲
          await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userData));
          console.log('註冊成功，用戶資料已保存');
        } catch (profileError) {
          console.error('獲取用戶資料失敗:', profileError);
          
          // 使用基本用戶信息
          const basicUser: User = {
            id: 'temp-id',
            username,
            email,
            balance: 0,
            points: 0,
            vipLevel: 1
          };
          
          setUser(basicUser);
          setIsAuthenticated(true);
          
          // 保存基本用戶資料
          await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(basicUser));
          console.log('註冊成功，基本用戶資料已保存');
        }
      } else {
        throw new Error('註冊失敗：無法獲取身份認證令牌');
      }
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
      
      // 透過 Redux 觸發登出操作，讓 Redux 控制導航
      dispatch(logoutRequest());
      
      // 清除本地狀態
      setUser(null);
      setIsAuthenticated(false);
      console.log('用戶已成功登出');
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
        .then(() => console.log('用戶資料已更新並保存'))
        .catch(error => console.error('更新用戶資料時出錯:', error));
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