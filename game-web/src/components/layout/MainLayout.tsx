import React, { ReactNode, useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * 主要布局組件
 */
const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // 獲取當前頁面標題
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return '儀表板';
    if (path.includes('/games')) return '遊戲管理';
    if (path.includes('/users')) return '用戶管理';
    if (path.includes('/transactions')) return '交易管理';
    if (path.includes('/logs')) return '操作日誌';
    if (path.includes('/settings')) return '系統設置';
    return '後台管理系統';
  };
  
  // 處理登出事件
  const handleLogout = () => {
    if (window.confirm('確定要登出系統嗎？')) {
      logout();
    }
  };
  
  // 獲取當前用戶初始資訊
  useEffect(() => {
    // 這裡可以做一些額外的用戶資訊初始化
    document.title = `${getPageTitle()} - AI 老虎機遊戲管理系統`;
  }, [location]);
  
  // 處理移動設備響應式導航
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 側邊欄 */}
      <aside 
        className={`bg-white border-r border-gray-200 w-64 fixed inset-y-0 z-20 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo部分 */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white text-lg"></i>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">AI 老虎機</h2>
            <p className="text-xs text-gray-500">管理系統 v1.0</p>
          </div>
        </div>
        
        {/* 用戶資訊 */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
            <i className="fas fa-user"></i>
          </div>
          <div>
            <p className="font-medium text-sm">{user?.full_name || '管理員'}</p>
            <p className="text-xs text-gray-500">
              {user?.role === 'super_admin' ? '超級管理員' : 
               user?.role === 'admin' ? '管理員' : 
               user?.role === 'operator' ? '操作員' : '觀察者'}
            </p>
          </div>
        </div>
        
        {/* 導航菜單 */}
        <nav className="p-4 flex-grow overflow-y-auto">
          <div className="text-xs uppercase font-semibold text-gray-500 mb-2">主要功能</div>
          <ul className="space-y-1">
            <NavItem to="/dashboard" icon="fa-chart-line">儀表板</NavItem>
            <NavItem to="/games" icon="fa-gamepad">遊戲管理</NavItem>
            <NavItem to="/users" icon="fa-users">用戶管理</NavItem>
            <NavItem to="/transactions" icon="fa-money-bill-transfer">交易管理</NavItem>
          </ul>
          
          <div className="text-xs uppercase font-semibold text-gray-500 mb-2 mt-6">系統管理</div>
          <ul className="space-y-1">
            <NavItem to="/logs" icon="fa-clipboard-list">操作日誌</NavItem>
            <NavItem to="/settings" icon="fa-cog">系統設置</NavItem>
          </ul>
        </nav>
        
        {/* 登出按鈕 */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>登出系統</span>
          </button>
        </div>
      </aside>
      
      {/* 主要內容區 */}
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col overflow-hidden">
        {/* 頂部工具欄 */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center">
            {/* 移動端菜單按鈕 */}
            <button
              onClick={toggleSidebar}
              className="text-gray-600 lg:hidden mr-4"
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100">
              <i className="fas fa-bell"></i>
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100">
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </header>
        
        {/* 內容區 */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
      
      {/* 遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden" 
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

/**
 * 導航項目組件
 */
interface NavItemProps {
  to: string;
  icon: string;
  children: ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, children }) => {
  return (
    <li className="rounded-lg">
      <NavLink
        to={to}
        className={({ isActive }) => 
          `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-700 hover:bg-gray-100'
          }`
        }
      >
        <i className={`fas ${icon} w-5 text-center`}></i>
        <span>{children}</span>
      </NavLink>
    </li>
  );
};

export default MainLayout; 