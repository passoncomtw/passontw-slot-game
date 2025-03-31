import React, { useState } from 'react';

// 定義用戶類型
interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  registeredAt: string;
  balance: string;
  status: 'active' | 'inactive' | 'pending';
}

const UsersPage: React.FC = () => {
  // 模擬用戶數據
  const [users, setUsers] = useState<User[]>([
    { 
      id: 'U001', 
      name: '王小明', 
      email: 'wangxiaoming@example.com', 
      initials: 'WM',
      registeredAt: '2024/04/15', 
      balance: '$3,250', 
      status: 'active' 
    },
    { 
      id: 'U002', 
      name: '張三', 
      email: 'zhangsan@example.com', 
      initials: 'ZS',
      registeredAt: '2024/05/02', 
      balance: '$1,800', 
      status: 'active' 
    },
    { 
      id: 'U003', 
      name: '李四', 
      email: 'lisi@example.com', 
      initials: 'LS',
      registeredAt: '2024/03/10', 
      balance: '$5,680', 
      status: 'inactive' 
    },
    { 
      id: 'U004', 
      name: '陳麗', 
      email: 'chenli@example.com', 
      initials: 'CL',
      registeredAt: '2024/06/01', 
      balance: '$120', 
      status: 'pending' 
    },
  ]);

  // 搜尋和過濾狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // 新增用戶表單狀態
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('');
  const [newUserBalance, setNewUserBalance] = useState('0');
  const [newUserStatus, setNewUserStatus] = useState('active');
  
  // 儲值表單狀態
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');

  // 用戶過濾處理
  const getFilteredUsers = () => {
    // 先根據搜尋詞過濾
    let filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // 再根據狀態過濾
    if (activeFilter !== 'all') {
      filtered = filtered.filter(user => user.status === activeFilter);
    }
    
    return filtered;
  };
  
  // 用戶計數
  const getUserCounts = () => {
    const total = users.length;
    const active = users.filter(user => user.status === 'active').length;
    const inactive = users.filter(user => user.status === 'inactive').length;
    const pending = users.filter(user => user.status === 'pending').length;
    
    return { total, active, inactive, pending };
  };
  
  // 用戶操作處理
  const handleUserAction = (action: string, userId: string) => {
    switch (action) {
      case 'freeze':
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'inactive' } : user
        ));
        break;
      case 'unfreeze':
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'active' } : user
        ));
        break;
      case 'verify':
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'active' } : user
        ));
        break;
      case 'deposit':
        setSelectedUserId(userId);
        setShowDepositModal(true);
        break;
      default:
        break;
    }
  };
  
  // 添加新用戶
  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;
    if (newUserPassword !== newUserConfirmPassword) {
      alert('兩次輸入的密碼不一致！');
      return;
    }
    
    const newUser: User = {
      id: `U${Math.floor(1000 + Math.random() * 9000)}`,
      name: newUserName,
      email: newUserEmail,
      initials: newUserName.substring(0, 2),
      registeredAt: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
      balance: `$${parseFloat(newUserBalance).toLocaleString()}`,
      status: newUserStatus as 'active' | 'inactive' | 'pending',
    };
    
    setUsers([...users, newUser]);
    setShowAddModal(false);
    resetAddForm();
  };
  
  // 處理儲值
  const handleDeposit = () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount))) return;
    
    setUsers(users.map(user => {
      if (user.id === selectedUserId) {
        const currentBalance = parseFloat(user.balance.replace(/[$,]/g, ''));
        const newBalance = currentBalance + parseFloat(depositAmount);
        return {
          ...user,
          balance: `$${newBalance.toLocaleString()}`
        };
      }
      return user;
    }));
    
    setShowDepositModal(false);
    resetDepositForm();
  };
  
  // 重設表單
  const resetAddForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserConfirmPassword('');
    setNewUserBalance('0');
    setNewUserStatus('active');
  };
  
  const resetDepositForm = () => {
    setDepositAmount('');
    setDepositNote('');
    setSelectedUserId('');
  };
  
  // 獲取過濾用戶
  const filteredUsers = getFilteredUsers();
  const userCounts = getUserCounts();

  return (
    <div>
      {/* 搜尋和功能區 */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="搜尋用戶名、ID、電子郵件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary w-full md:w-auto"
            onClick={() => setShowAddModal(true)}
          >
            <i className="fas fa-user-plus mr-2"></i> 新增用戶
          </button>
        </div>
      </div>
      
      {/* 過濾選項 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            activeFilter === 'all' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
          }`}
          onClick={() => setActiveFilter('all')}
        >
          所有用戶 ({userCounts.total})
        </button>
        <button 
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            activeFilter === 'active' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
          }`}
          onClick={() => setActiveFilter('active')}
        >
          活躍用戶 ({userCounts.active})
        </button>
        <button 
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            activeFilter === 'inactive' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
          }`}
          onClick={() => setActiveFilter('inactive')}
        >
          已凍結 ({userCounts.inactive})
        </button>
        <button 
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            activeFilter === 'pending' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
          }`}
          onClick={() => setActiveFilter('pending')}
        >
          待驗證 ({userCounts.pending})
        </button>
      </div>
      
      {/* 用戶列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用戶</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">註冊日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">餘額</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                        {user.initials}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.registeredAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.balance}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-success' 
                          : user.status === 'inactive'
                            ? 'bg-red-100 text-error'
                            : 'bg-yellow-100 text-warning'
                      }`}
                    >
                      {user.status === 'active' ? '活躍' : user.status === 'inactive' ? '已凍結' : '待驗證'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                        <i className="fas fa-edit text-xs"></i> 編輯
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                        onClick={() => handleUserAction('deposit', user.id)}
                      >
                        <i className="fas fa-wallet text-xs"></i> 儲值
                      </button>
                      {user.status === 'active' && (
                        <button 
                          className="text-gray-600 hover:text-red-600 flex items-center gap-1"
                          onClick={() => handleUserAction('freeze', user.id)}
                        >
                          <i className="fas fa-ban text-xs"></i> 凍結
                        </button>
                      )}
                      {user.status === 'inactive' && (
                        <button 
                          className="text-gray-600 hover:text-green-600 flex items-center gap-1"
                          onClick={() => handleUserAction('unfreeze', user.id)}
                        >
                          <i className="fas fa-check text-xs"></i> 解凍
                        </button>
                      )}
                      {user.status === 'pending' && (
                        <button 
                          className="text-gray-600 hover:text-green-600 flex items-center gap-1"
                          onClick={() => handleUserAction('verify', user.id)}
                        >
                          <i className="fas fa-check-circle text-xs"></i> 驗證
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    沒有找到符合條件的用戶
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* 分頁 */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-500">
              顯示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredUsers.length}</span> 項結果，共 <span className="font-medium">{userCounts.total}</span> 項
            </div>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                <i className="fas fa-chevron-left"></i>
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md bg-primary text-white">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">2</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">3</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">...</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">10</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 新增用戶模態框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
            {/* 模態框標題 */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">新增用戶</h3>
              <button 
                className="text-gray-600 hover:text-gray-900"
                onClick={() => {
                  setShowAddModal(false);
                  resetAddForm();
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* 表單 */}
            <div className="mb-6">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">用戶名</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="請輸入用戶名"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">電子郵件</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="請輸入電子郵件"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">密碼</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="請輸入密碼"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">確認密碼</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="請再次輸入密碼"
                  value={newUserConfirmPassword}
                  onChange={(e) => setNewUserConfirmPassword(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">初始餘額</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                  min="0"
                  value={newUserBalance}
                  onChange={(e) => setNewUserBalance(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">狀態</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={newUserStatus}
                  onChange={(e) => setNewUserStatus(e.target.value)}
                >
                  <option value="active">活躍</option>
                  <option value="pending">待驗證</option>
                  <option value="inactive">已凍結</option>
                </select>
              </div>
            </div>
            
            {/* 操作按鈕 */}
            <div className="flex justify-end gap-2">
              <button 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  setShowAddModal(false);
                  resetAddForm();
                }}
              >
                取消
              </button>
              <button 
                className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition-colors"
                onClick={handleAddUser}
              >
                確認新增
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 儲值模態框 */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
            {/* 模態框標題 */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">用戶儲值</h3>
              <button 
                className="text-gray-600 hover:text-gray-900"
                onClick={() => {
                  setShowDepositModal(false);
                  resetDepositForm();
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* 表單 */}
            <div className="mb-6">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">用戶</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  value={users.find(u => u.id === selectedUserId)?.name || ''}
                  disabled
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">儲值金額</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="請輸入儲值金額"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">備註</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={3}
                  placeholder="請輸入備註"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                ></textarea>
              </div>
            </div>
            
            {/* 操作按鈕 */}
            <div className="flex justify-end gap-2">
              <button 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  setShowDepositModal(false);
                  resetDepositForm();
                }}
              >
                取消
              </button>
              <button 
                className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition-colors"
                onClick={handleDeposit}
              >
                確認儲值
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;