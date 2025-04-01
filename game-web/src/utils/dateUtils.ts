/**
 * 格式化日期為本地格式
 * @param dateString 日期字符串
 * @returns 格式化後的日期字符串
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化錯誤:', error);
    return dateString;
  }
};

/**
 * 獲取相對時間描述（例如：3分鐘前、2小時前）
 * @param dateString 日期字符串
 * @returns 相對時間描述
 */
export const getRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒前`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分鐘前`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}小時前`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}天前`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}個月前`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}年前`;
  } catch (error) {
    console.error('相對時間計算錯誤:', error);
    return dateString;
  }
}; 