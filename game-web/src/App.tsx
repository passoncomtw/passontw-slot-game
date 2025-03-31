import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAppDispatch from './hooks/useAppDispatch';
import useAppSelector from './hooks/useAppSelector';
import { fetchUserRequest } from './store/slices/authSlice';
import authService from './services/authService';

// 布局
import MainLayout from './components/layout/MainLayout';

// 頁面
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/login/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import GamesPage from './pages/games/GamesPage';
import UsersPage from './pages/users/UsersPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import LogsPage from './pages/logs/LogsPage';
import SettingsPage from './pages/settings/SettingsPage';
import NotFoundPage from './pages/errors/NotFoundPage';

// 受保護的路由元件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);
  
  // 如果正在加載，顯示載入中
  if (loading) {
    return <div>載入中...</div>;
  }
  
  // 如果未認證，重定向到登入頁面
  if (!isAuthenticated && !authService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  // 否則，顯示子元件
  return <>{children}</>;
};

// 應用程序入口
const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  
  // 在應用加載時檢查用戶登入狀態
  useEffect(() => {
    if (authService.isAuthenticated() && !isAuthenticated) {
      dispatch(fetchUserRequest());
    }
  }, [dispatch, isAuthenticated]);
  
  return (
    <BrowserRouter>
      <Routes>
        {/* 公開路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 受保護的路由 */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        {/* 404 頁面 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
