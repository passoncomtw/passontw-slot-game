import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppDispatch from './useAppDispatch';
import useAppSelector from './useAppSelector';
import { loginRequest, logoutRequest, clearError } from '../store/slices/authSlice';
import { LoginRequest } from '../types';
import authService from '../services/authService';

/**
 * 認證相關的 Hook
 */
const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading, error } = useAppSelector(state => state.auth);

  /**
   * 登入處理
   */
  const login = useCallback((data: LoginRequest) => {
    dispatch(loginRequest(data));
  }, [dispatch]);

  /**
   * 登出處理
   */
  const logout = useCallback(() => {
    dispatch(logoutRequest());
  }, [dispatch]);

  /**
   * 清除錯誤
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * 獲取本地存儲的用戶信息
   */
  const getStoredUser = useCallback(() => {
    return authService.getStoredUser();
  }, []);

  /**
   * 檢查用戶是否已登入
   */
  const checkAuth = useCallback(() => {
    return authService.isAuthenticated();
  }, []);

  /**
   * 導航到登入頁面
   */
  const redirectToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  /**
   * 導航到儀表板
   */
  const redirectToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    clearAuthError,
    getStoredUser,
    checkAuth,
    redirectToLogin,
    redirectToDashboard
  };
};

export default useAuth; 