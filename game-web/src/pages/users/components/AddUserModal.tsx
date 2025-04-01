import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'vip' | 'admin';
  is_verified?: boolean;
  is_active?: boolean;
}

interface AddUserModalProps {
  onClose: () => void;
  onSubmit: (userData: CreateUserData) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSubmit }) => {
  // 表單狀態
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    role: 'user',
    is_verified: false,
    is_active: true
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證表單
    if (!formData.username || !formData.email || !formData.password) {
      setError('請填寫所有必填欄位');
      return;
    }
    
    if (formData.password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }
    
    // 表單驗證通過
    setIsLoading(true);
    setError(null);
    
    try {
      onSubmit(formData);
    } catch (err) {
      console.error('提交表單失敗', err);
      setError('創建用戶失敗，請稍後再試');
      setIsLoading(false);
    }
  };

  // 處理表單變化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        {/* 標題和關閉按鈕 */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">新增用戶</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isLoading}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* 錯誤消息 */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* 表單 */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              用戶名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入用戶名"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              電子郵件 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入電子郵件"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              密碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入密碼"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              確認密碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請再次輸入密碼"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              角色
            </label>
            <select
              name="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.role}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="user">普通用戶</option>
              <option value="vip">VIP用戶</option>
              <option value="admin">管理員</option>
            </select>
          </div>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={isLoading}
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              啟用帳號
            </label>
          </div>

          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="is_verified"
              name="is_verified"
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.is_verified}
              onChange={handleChange}
              disabled={isLoading}
            />
            <label htmlFor="is_verified" className="ml-2 text-sm text-gray-700">
              已驗證電子郵件
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="small" color="text-white" />
              ) : (
                '創建用戶'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal; 