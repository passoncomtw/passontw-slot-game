import React from 'react';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  title?: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const location = useLocation();
  
  // 根據路徑獲取頁面標題
  const getPageTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    
    if (path.includes('/dashboard')) return '儀表板';
    if (path.includes('/games')) return '遊戲列表';
    if (path.includes('/users')) return '用戶列表';
    if (path.includes('/transactions')) return '交易列表';
    if (path.includes('/logs')) return '操作日誌';
    if (path.includes('/settings')) return '系統設置';
    
    return '頁面標題';
  };
  
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="text-xl font-semibold">{getPageTitle()}</div>
      
      <div className="flex items-center gap-4">
        <button className="btn btn-outline btn-icon">
          <i className="fas fa-bell"></i>
        </button>
        <button className="btn btn-outline btn-icon">
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </div>
  );
};

export default Navbar; 