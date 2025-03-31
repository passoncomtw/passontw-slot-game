import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">頁面未找到</h1>
        <p className="text-gray-600 mb-6">
          您請求的頁面不存在或已被移除。
        </p>
        <Link 
          to="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          返回首頁
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage; 