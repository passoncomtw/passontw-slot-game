import api from './api';
import { OperationLog, PaginatedRequest } from '../types';

// 日誌列表回應的介面
export interface LogListResponse {
  current_page: number;
  page_size: number;
  total_pages: number;
  total: number;
  logs: Array<OperationLog>;
}

// 日誌統計數據介面
export interface LogStatsResponse {
  start_date: string;
  end_date: string;
  total_logs: number;
  create_operations: number;
  update_operations: number;
  delete_operations: number;
  login_operations: number;
  other_operations: number;
  entity_type_distribution: Record<string, number>;
  admin_activities: Array<{
    admin_id: string;
    admin_name: string;
    operation_count: number;
  }>;
}

// 日誌請求參數擴展介面
export interface LogListRequest extends PaginatedRequest {
  entity_type?: string;
  operation?: string;
  start_date?: string;
  end_date?: string;
}

// 導出日誌請求介面
export interface LogExportRequest extends LogListRequest {
  export_format?: 'csv' | 'excel';
}

/**
 * 日誌服務
 */
const logService = {
  /**
   * 獲取操作日誌列表
   */
  getLogs: async (params: LogListRequest): Promise<LogListResponse> => {
    return api.get('/admin/logs/list', { params });
  },

  /**
   * 獲取日誌統計數據
   */
  getLogStats: async (startDate?: string, endDate?: string): Promise<LogStatsResponse> => {
    const params = { start_date: startDate, end_date: endDate };
    return api.get('/admin/logs/stats', { params });
  },

  /**
   * 匯出日誌
   */
  exportLogs: async (params: LogExportRequest): Promise<Blob> => {
    // 使用 blob 響應類型以處理文件下載
    return api.get('/admin/logs/export', { 
      params,
      responseType: 'blob'
    });
  }
};

export default logService; 