import React, { createContext, useState, useContext } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  points: number;
  vipLevel: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const initialUser = null;

const AuthContext = createContext<AuthContextType>({
  user: initialUser,
  isLoading: false,
  login: async () => false,
  register: async () => false,
  logout: () => {},
});

/**
 * 提供身份驗證相關功能的上下文
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 用戶登入
   * @param email - 使用者電子郵件
   * @param password - 使用者密碼
   * @returns 登入是否成功
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // 模擬API調用延遲
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 在實際應用中，這裡應該是API調用
    if (email && password) {
      setUser({
        id: '1',
        username: '張小明',
        email: email,
        balance: 1000,
        points: 250,
        vipLevel: 2,
      });
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  /**
   * 用戶註冊
   * @param username - 使用者名稱
   * @param email - 使用者電子郵件
   * @param password - 使用者密碼
   * @returns 註冊是否成功
   */
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // 模擬API調用延遲
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 在實際應用中，這裡應該是API調用
    if (username && email && password) {
      setUser({
        id: '1',
        username: username,
        email: email,
        balance: 1000,
        points: 0,
        vipLevel: 1,
      });
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  /**
   * 用戶登出
   */
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 使用身份驗證上下文的鉤子
 */
export const useAuth = () => useContext(AuthContext); 