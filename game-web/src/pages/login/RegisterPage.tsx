import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppDispatch from '../../hooks/useAppDispatch';
import useAppSelector from '../../hooks/useAppSelector';
import { registerRequest, clearError } from '../../store/slices/authSlice';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    full_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useAppSelector(state => state.auth);
  
  // 當認證狀態變化時重定向到儀表板
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // 輸入變更處理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (error) {
      dispatch(clearError());
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除對應的錯誤
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // 表單驗證
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = '請輸入用戶名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用戶名至少需要3個字符';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '請輸入郵箱地址';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的郵箱地址';
    }
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = '請輸入真實姓名';
    }
    
    if (!formData.password) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼至少需要6個字符';
    }
    
    if (!formData.password_confirm) {
      newErrors.password_confirm = '請確認密碼';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = '兩次輸入的密碼不一致';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 表單提交處理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    dispatch(registerRequest(formData));
  };
  
  // 切換密碼可見性
  const togglePasswordVisibility = (field: 'password' | 'password_confirm') => {
    if (field === 'password') {
      setShowPassword(prev => !prev);
    } else {
      setShowPasswordConfirm(prev => !prev);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">創建管理員帳號</h1>
          <p className="text-gray-600 mt-2">請填寫以下信息註冊帳號</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* 用戶名 */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
              用戶名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={loading}
            />
            {errors.username && (
              <p className="mt-1 text-red-500 text-sm">{errors.username}</p>
            )}
          </div>
          
          {/* 郵箱 */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              郵箱 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-red-500 text-sm">{errors.email}</p>
            )}
          </div>
          
          {/* 真實姓名 */}
          <div className="mb-4">
            <label htmlFor="full_name" className="block text-gray-700 font-medium mb-2">
              真實姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.full_name ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={loading}
            />
            {errors.full_name && (
              <p className="mt-1 text-red-500 text-sm">{errors.full_name}</p>
            )}
          </div>
          
          {/* 密碼 */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              密碼 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('password')}
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
            {errors.password && (
              <p className="mt-1 text-red-500 text-sm">{errors.password}</p>
            )}
          </div>
          
          {/* 確認密碼 */}
          <div className="mb-6">
            <label htmlFor="password_confirm" className="block text-gray-700 font-medium mb-2">
              確認密碼 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswordConfirm ? "text" : "password"}
                id="password_confirm"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.password_confirm ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('password_confirm')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                tabIndex={-1}
              >
                {showPasswordConfirm ? (
                  <span className="material-icons text-sm">visibility_off</span>
                ) : (
                  <span className="material-icons text-sm">visibility</span>
                )}
              </button>
            </div>
            {errors.password_confirm && (
              <p className="mt-1 text-red-500 text-sm">{errors.password_confirm}</p>
            )}
          </div>
          
          {/* 註冊按鈕 */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? '註冊中...' : '註冊帳號'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            已有帳號？ 
            <Link to="/login" className="text-blue-600 hover:underline ml-1">
              登入
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 