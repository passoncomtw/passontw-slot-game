import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'text-blue-600' 
}) => {
  // 根據尺寸設定寬高
  const sizeClass = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }[size];

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full ${sizeClass} border-2 border-solid ${color} border-t-transparent`}></div>
    </div>
  );
};

export default LoadingSpinner; 