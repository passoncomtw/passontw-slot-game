import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';
import userService, { ApiUser } from '../../services/userService';
import { FilterParams } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';
import AddUserModal, { CreateUserData } from './components/AddUserModal';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';

// 定義 API 錯誤類型，用於處理 axios 錯誤響應
interface AxiosError {
  response?: {
    status: number;
    data?: {
      message?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  };
  message?: string;
}

const UsersPage: React.FC = () => {
  // 狀態變量
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const navigate = useNavigate();

  // 分頁狀態
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    page_size: 10,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // 獲取用戶列表
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 檢查是否已登錄
      if (!authService.isAuthenticated()) {
        toast.error('請先登入管理員帳號');
        navigate('/login');
        return;
      }

      const response = await userService.getUserList(filters);
      
      // 確保從 API 正確獲取用戶數據
      if (response && response.users) {
        setUsers(response.users);
        setTotalPages(response.total_pages);
        setTotalRecords(response.total);
        
        // 計算活躍和非活躍用戶數量
        const active = response.users.filter(user => user.status === 'active').length;
        const inactive = response.users.filter(user => user.status === 'inactive').length;
        
        setActiveCount(active);
        setInactiveCount(inactive);
      } else {
        console.warn('API 響應格式不符合預期:', response);
        setUsers([]);
        setTotalPages(0);
        setTotalRecords(0);
        setActiveCount(0);
        setInactiveCount(0);
      }
    } catch (err) {
      console.error('獲取用戶失敗', err);
      const errorMsg = (err as AxiosError).message || '獲取用戶數據時發生錯誤';
      setError(errorMsg);
      
      // 處理後端的錯誤響應
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.data?.message) {
        setError(axiosErr.response.data.message);
      }
      
      // 檢查是否是授權錯誤
      if ((err as AxiosError).response?.status === 401) {
        toast.error('授權已過期，請重新登入');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化和過濾變化時獲取數據
  useEffect(() => {
    fetchUsers();
  }, [filters]);

  // 處理狀態切換（啟用/禁用用戶）
  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      // 檢查是否已登錄
      if (!authService.isAuthenticated()) {
        toast.error('請先登入管理員帳號');
        navigate('/login');
        return;
      }

      const newStatus = currentStatus === 'active' ? false : true;
      const response = await userService.updateUserStatus(userId, newStatus);
      
      if (response.success) {
        toast.success(`用戶狀態已更新`);
        // 更新用戶列表
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, status: newStatus ? 'active' : 'inactive' } : user
          )
        );
        // 重新獲取用戶列表以更新計數
        fetchUsers();
      } else {
        toast.error(response.message || '更新用戶狀態失敗');
      }
    } catch (err) {
      console.error('更新用戶狀態失敗', err);
      
      // 從回應中獲取錯誤訊息
      const axiosErr = err as AxiosError;
      let errorMsg = '更新用戶狀態時發生錯誤';
      if (axiosErr.response?.data?.message) {
        errorMsg = axiosErr.response.data.message;
      } else if (axiosErr.message) {
        errorMsg = axiosErr.message;
      }
      
      toast.error(errorMsg);
      
      // 檢查是否是授權錯誤
      if ((err as AxiosError).response?.status === 401) {
        toast.error('授權已過期，請重新登入');
        navigate('/login');
      }
    }
  };

  // 添加新用戶
  const handleAddUser = async (userData: CreateUserData) => {
    try {
      // 檢查是否已登錄
      if (!authService.isAuthenticated()) {
        toast.error('請先登入管理員帳號');
        navigate('/login');
        return;
      }

      const response = await userService.createUser(userData);
      
      if (response.success) {
        toast.success('用戶創建成功');
        setShowAddModal(false);
        // 重新獲取用戶列表
        fetchUsers();
      } else {
        toast.error(response.message || '創建用戶失敗');
      }
    } catch (err) {
      console.error('創建用戶失敗', err);
      
      // 從回應中獲取錯誤訊息
      const axiosErr = err as AxiosError;
      let errorMsg = '創建用戶時發生錯誤';
      if (axiosErr.response?.data?.message) {
        errorMsg = axiosErr.response.data.message;
      } else if (axiosErr.message) {
        errorMsg = axiosErr.message;
      }
      
      toast.error(errorMsg);
      
      // 檢查是否是授權錯誤
      if ((err as AxiosError).response?.status === 401) {
        toast.error('授權已過期，請重新登入');
        navigate('/login');
      }
    }
  };

  // 處理頁面更改
  const handlePageChange = (newPage: number) => {
    setFilters({
      ...filters,
      page: newPage
    });
  };

  // 處理頁面大小更改
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      page: 1, // 更改頁面大小時重置為第一頁
      page_size: parseInt(e.target.value)
    });
  };

  // 處理狀態過濾
  const handleStatusFilter = (status: string) => {
    setFilters({
      ...filters,
      page: 1, // 更改過濾條件時重置為第一頁
      status
    });
  };

  // 處理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };

  // 計算分頁信息
  const startRecord = (filters.page - 1) * filters.page_size + 1;
  const endRecord = Math.min(filters.page * filters.page_size, totalRecords);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">用戶管理</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          disabled={isLoading}
        >
          <FiPlus className="mr-2" /> 新增用戶
        </button>
      </div>

      {/* 狀態過濾和搜索 */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusFilter('')}
            className={`px-4 py-2 rounded-md ${filters.status === '' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            全部 ({totalRecords})
          </button>
          <button
            onClick={() => handleStatusFilter('active')}
            className={`px-4 py-2 rounded-md ${filters.status === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            已啟用 ({activeCount})
          </button>
          <button
            onClick={() => handleStatusFilter('inactive')}
            className={`px-4 py-2 rounded-md ${filters.status === 'inactive' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            已禁用 ({inactiveCount})
          </button>
        </div>
        <div className="flex-grow">
          <input
            type="text"
            placeholder="搜索用戶名或電子郵件..."
            className="px-4 py-2 border rounded-md w-full"
            value={filters.search || ''}
            onChange={handleSearch}
          />
        </div>
        <div>
          <select
            value={filters.page_size}
            onChange={handlePageSizeChange}
            className="px-4 py-2 border rounded-md"
            disabled={isLoading}
          >
            <option value="10">10 筆/頁</option>
            <option value="20">20 筆/頁</option>
            <option value="50">50 筆/頁</option>
            <option value="100">100 筆/頁</option>
          </select>
        </div>
      </div>

      {/* 錯誤信息 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* 用戶列表 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用戶名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                電子郵件
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                餘額
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                註冊日期
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                  沒有找到用戶
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id || `user-${Math.random()}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.id && typeof user.id === 'string' 
                      ? user.id.substring(0, 8) + '...' 
                      : user.id || '無 ID'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white text-xl">
                            {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username || '未命名'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email || '無郵箱'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${(user.balance || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? '啟用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? formatDate(user.created_at) : '無日期'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        className={`p-1 rounded-md ${
                          user.status === 'active' ? 'text-red-600 hover:bg-red-100' : 'text-green-600 hover:bg-green-100'
                        }`}
                        title={user.status === 'active' ? '禁用用戶' : '啟用用戶'}
                      >
                        {user.status === 'active' ? <FiUserX size={18} /> : <FiUserCheck size={18} />}
                      </button>
                      <button
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-md"
                        title="編輯用戶"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        className="p-1 text-red-600 hover:bg-red-100 rounded-md"
                        title="刪除用戶"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁控件 */}
      {!isLoading && users.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            顯示 {startRecord} 到 {endRecord} 筆，共 {totalRecords} 筆記錄
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className={`px-3 py-1 rounded-md ${
                filters.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white'
              }`}
            >
              上一頁
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md ${
                  filters.page === page ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === totalPages}
              className={`px-3 py-1 rounded-md ${
                filters.page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white'
              }`}
            >
              下一頁
            </button>
          </div>
        </div>
      )}

      {/* 添加用戶模態窗 */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddUser}
        />
      )}
    </div>
  );
};

export default UsersPage;