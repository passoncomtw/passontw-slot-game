import { OperationLog } from '../types';
import { LogEntry } from '../pages/logs/LogsPage';

/**
 * 將 API 返回的操作日誌轉換為前端顯示的日誌條目
 */
export const convertOperationLogToLogEntry = (log: OperationLog): LogEntry => {
  // 格式化時間
  const date = new Date(log.executed_at);
  const formattedTime = date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '/');
  
  // 決定日誌類型
  let logType: 'game' | 'user' | 'transaction' | 'system';
  switch (log.entity_type) {
    case 'game':
      logType = 'game';
      break;
    case 'user':
      logType = 'user';
      break;
    case 'transaction':
      logType = 'transaction';
      break;
    default:
      logType = 'system';
      break;
  }
  
  // 構建目標信息
  let target = '';
  if (log.entity_id) {
    target += `${capitalizeFirstLetter(log.entity_type)}ID: ${log.entity_id}`;
  }
  
  if (log.ip_address) {
    target += target ? ` | IP: ${log.ip_address}` : `IP: ${log.ip_address}`;
  }
  
  if (!target) {
    target = '系統操作';
  }
  
  return {
    id: log.log_id,
    time: formattedTime,
    operator: log.admin_name || '系統',
    type: logType,
    detail: log.description,
    target: target
  };
};

/**
 * 將字符串首字母大寫
 */
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * 生成用於下載的檔案名稱
 */
export const generateExportFileName = (format: string): string => {
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0];
  return `operation_logs_${formattedDate}.${format}`;
};

/**
 * 下載 blob 數據為文件
 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}; 