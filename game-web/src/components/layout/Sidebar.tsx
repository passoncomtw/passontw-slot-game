import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAppDispatch from '../../hooks/useAppDispatch';
import useAppSelector from '../../hooks/useAppSelector';
import { logoutRequest } from '../../store/slices/authSlice';

// 導航項目類型
interface NavItem {
  id: string;
  title: string;
  icon: string;
  path: string;
}

// 導航菜單配置
const mainNavItems: NavItem[] = [
  { id: 'dashboard', title: '儀表板', icon: 'fa-chart-line', path: '/dashboard' },
  { id: 'games', title: '遊戲列表', icon: 'fa-gamepad', path: '/games' },
  { id: 'users', title: '用戶列表', icon: 'fa-users', path: '/users' },
  { id: 'transactions', title: '交易列表', icon: 'fa-money-bill-transfer', path: '/transactions' },
];

const systemNavItems: NavItem[] = [
  { id: 'logs', title: '操作日誌', icon: 'fa-clipboard-list', path: '/logs' },
  { id: 'settings', title: '系統設置', icon: 'fa-cog', path: '/settings' },
];

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  
  // 處理登出
  const handleLogout = () => {
    if (window.confirm('確定要登出系統嗎？')) {
      dispatch(logoutRequest());
      navigate('/login');
    }
  };
  
  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-30 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
          <i className="fas fa-robot text-lg"></i>
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-base">AI老虎機</div>
          <div className="text-xs text-gray-500">管理系統 v1.0</div>
        </div>
      </div>
      
      {/* 管理員資訊 */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
          <i className="fas fa-user"></i>
        </div>
        <div className="flex flex-col">
          <div className="font-medium">{user?.full_name || '管理員'}</div>
          <div className="text-xs text-gray-500">
            {user?.role === 'super_admin' 
              ? '超級管理員' 
              : user?.role === 'admin'
                ? '管理員'
                : user?.role === 'operator'
                  ? '操作員'
                  : '訪客'}
          </div>
        </div>
      </div>
      
      {/* 導航菜單 */}
      <div className="py-4 flex-grow overflow-y-auto">
        <div className="px-4 mb-2 text-xs uppercase text-gray-500 font-semibold tracking-wider">
          主要功能
        </div>
        <ul className="list-none">
          {mainNavItems.map(item => (
            <li key={item.id} className="mx-2 my-1 rounded-lg">
              <NavLink 
                to={item.path}
                className={({isActive}) => 
                  `flex items-center py-3 px-4 gap-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <i className={`fas ${item.icon} w-5 text-center`}></i>
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        
        <div className="px-4 mt-6 mb-2 text-xs uppercase text-gray-500 font-semibold tracking-wider">
          系統管理
        </div>
        <ul className="list-none">
          {systemNavItems.map(item => (
            <li key={item.id} className="mx-2 my-1 rounded-lg">
              <NavLink 
                to={item.path}
                className={({isActive}) => 
                  `flex items-center py-3 px-4 gap-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <i className={`fas ${item.icon} w-5 text-center`}></i>
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      
      {/* 登出按鈕 */}
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <i className="fas fa-sign-out-alt"></i>
          <span>登出系統</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 