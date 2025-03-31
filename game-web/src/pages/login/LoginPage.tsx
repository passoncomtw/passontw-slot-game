import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  
  const { isAuthenticated, loading, error, login, clearAuthError, redirectToDashboard } = useAuth();
  
  // 當認證狀態變化時重定向到儀表板
  useEffect(() => {
    if (isAuthenticated) {
      redirectToDashboard();
    }
  }, [isAuthenticated, redirectToDashboard]);

  // 如果已經有儲存的 token，自動導向儀表板
  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      redirectToDashboard();
    }
  }, [redirectToDashboard]);
  
  // 輸入變更處理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    
    if (!formTouched) {
      setFormTouched(true);
    }
    
    if (error) {
      clearAuthError();
    }
    
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    } else if (name === 'rememberMe') {
      setRememberMe(checked);
    }
  };
  
  // 表單提交處理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched(true);
    
    if (!email.trim() || !password.trim()) {
      return;
    }
    
    login({
      email,
      password,
      remember_me: rememberMe
    });
  };
  
  // 切換密碼可見性
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // 自動填充示範帳號
  const fillDemoAccount = () => {
    setEmail('admin@example.com');
    setPassword('admin123');
    setFormTouched(true);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-700 rounded-lg flex items-center justify-center">
              <i className="material-icons text-white text-2xl">admin_panel_settings</i>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">AI 老虎機後台管理系統</h1>
          <p className="text-gray-600 mt-2">請登入以繼續</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <i className="material-icons mr-2 text-sm">error</i>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              電子郵件
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="admin@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
              required
            />
            {formTouched && !email.trim() && (
              <p className="text-red-500 text-sm mt-1">請輸入電子郵件</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              密碼
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <span className="material-icons text-sm">visibility_off</span>
                ) : (
                  <span className="material-icons text-sm">visibility</span>
                )}
              </button>
            </div>
            {formTouched && !password.trim() && (
              <p className="text-red-500 text-sm mt-1">請輸入密碼</p>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-gray-700">
                記住我
              </label>
            </div>
            
            <a href="#" className="text-purple-600 hover:text-purple-800 text-sm">
              忘記密碼？
            </a>
          </div>
          
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登入中...
              </span>
            ) : '登入管理系統'}
          </button>

          <div className="mt-4">
            <button
              type="button"
              onClick={fillDemoAccount}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md focus:outline-none transition duration-200"
            >
              使用示範帳號
            </button>
          </div>
        </form>
        
        <div className="text-center mt-6 text-sm text-gray-600">
          &copy; {new Date().getFullYear()} AI 老虎機遊戲管理系統
          <div className="mt-2 text-xs text-gray-500">
            <span>Version 1.0.0</span>
            <span className="mx-2">|</span>
            <span>Server: {import.meta.env.VITE_API_URL || 'http://localhost:3010'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 