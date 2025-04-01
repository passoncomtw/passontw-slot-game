import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

// 設定 API 的基本 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3010';

// API 回應型別
interface APIResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  transactions?: TransactionData[];
  total?: number;
  total_pages?: number;
  current_page?: number;
}

// 定義交易列表回應型別
interface TransactionListResponse {
  current_page: number;
  page_size: number;
  total_pages: number;
  total: number;
  transactions: TransactionData[];
  data?: TransactionData[]; // 添加可選的 data 屬性以支持不同的 API 回應結構
}

// 定義交易資料型別
interface TransactionData {
  transaction_id: string;
  user_id: string;
  username: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  game_name?: string;
  reference_id?: string;
  description?: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

// 定義過濾條件型別
interface FilterParams {
  page: number;
  page_size: number;
  search?: string;
  type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

const TransactionsPage: React.FC = () => {
  // 狀態管理
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 分頁和過濾狀態
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    page_size: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  
  // 搜尋和過濾狀態
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loadingExport, setLoadingExport] = useState<boolean>(false);

  // 處理匯出報表
  const handleExport = async () => {
    try {
      setLoadingExport(true);
      
      // 建立匯出的查詢參數
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      // 發送匯出請求，使用 Blob 處理返回的 CSV 數據
      const response = await api.get(`${API_BASE_URL}/admin/transactions/export?${params.toString()}`, 
        { responseType: 'blob' });
      
      // 建立一個 Blob URL
      const url = window.URL.createObjectURL(new Blob([response as BlobPart]));
      
      // 建立一個臨時連結並觸發下載
      const link = document.createElement('a');
      link.href = url;
      const fileName = `交易報表_${startDate || format(new Date(), 'yyyy-MM-dd')}_${endDate || format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // 清理
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('匯出報表失敗:', err);
      setError('匯出報表時發生錯誤，請稍後再試');
    } finally {
      setLoadingExport(false);
    }
  };

  // 應用過濾器並獲取數據
  const applyFilters = () => {
    const newFilters: FilterParams = {
      ...filters,
      search: searchTerm,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      page: 1, // 重置到第一頁
    };
    
    setFilters(newFilters);
  };

  // 處理分頁變更
  const handlePageChange = (page: number) => {
    setFilters({
      ...filters,
      page,
    });
  };

  // 初始加載和過濾變化時獲取交易數據
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        // 建立查詢參數
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
        
        console.log('發送交易列表請求，參數:', Object.fromEntries(params));
        
        const response = await api.get<APIResponse<TransactionListResponse>>(`${API_BASE_URL}/admin/transactions/list?${params.toString()}`);
        
        console.log('API回應:', response);
        
        // 處理不同結構的API回應
        if (response) {
          let transactionsList: TransactionData[] = [];
          let totalItems = 0;
          let totalPageCount = 1;
          
          // 檢查API回應的結構，支持多種可能的數據結構
          if (response.data?.transactions && Array.isArray(response.data.transactions)) {
            // 標準格式: response.data.transactions
            transactionsList = response.data.transactions;
            totalItems = response.data.total || 0;
            totalPageCount = response.data.total_pages || 1;
          } else if (response.transactions && Array.isArray(response.transactions)) {
            // 替代格式1: response.transactions
            transactionsList = response.transactions;
            totalItems = response.total || 0;
            totalPageCount = response.total_pages || 1;
          } else if (response.data && Array.isArray(response.data)) {
            // 替代格式2: response.data (數組)
            transactionsList = response.data as unknown as TransactionData[];
            totalItems = response.total || filters.page * filters.page_size + transactionsList.length;
            totalPageCount = response.total_pages || Math.ceil(totalItems / filters.page_size);
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            // 替代格式3: response.data.data
            transactionsList = response.data.data;
            totalItems = response.data.total || filters.page * filters.page_size + transactionsList.length;
            totalPageCount = response.data.total_pages || Math.ceil(totalItems / filters.page_size);
          }
          
          if (transactionsList.length > 0) {
            setTransactions(transactionsList);
            setTotalPages(totalPageCount);
            setTotalRecords(totalItems);
            setError(null); // 清除任何先前的錯誤
            console.log('處理後的交易數據:', {
              交易列表: transactionsList,
              總筆數: totalItems,
              總頁數: totalPageCount
            });
          } else {
            console.log('沒有找到交易數據或格式不符', response);
            setTransactions([]);
            setTotalPages(1);
            setTotalRecords(0);
            // 不顯示錯誤，而是顯示空數據的提示
          }
        } else {
          console.error('API回應無效:', response);
          setError('無法獲取交易資料，回應格式不正確');
        }
      } catch (err) {
        console.error('獲取交易列表失敗:', err);
        // 顯示更詳細的錯誤信息
        if (err && typeof err === 'object' && 'response' in err) {
          const errorObj = err as {response?: {data?: {error?: string, message?: string}, statusText?: string}};
          const errorMessage = errorObj.response?.data?.error || 
                              errorObj.response?.data?.message || 
                              errorObj.response?.statusText || 
                              '未知錯誤';
          setError(`獲取交易列表失敗: ${errorMessage}`);
        } else {
          setError('獲取交易列表失敗，請稍後再試');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [filters]);

  // 獲取類型顯示文字
  const getTypeText = (type: string) => {
    switch (type) {
      case 'deposit': return '儲值';
      case 'withdraw': return '提現';
      case 'bet': return '下注';
      case 'win': return '獲獎';
      case 'bonus': return '獎勵';
      case 'refund': return '退款';
      default: return type;
    }
  };

  // 獲取狀態顯示文字
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '成功';
      case 'pending': return '處理中';
      case 'failed': return '失敗';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  // 格式化金額函數，正數前添加"+"，負數前添加"-"
  const formatAmount = (amount: number, type: string): string => {
    if (['deposit', 'win', 'bonus', 'refund'].includes(type)) {
      return `+$${Math.abs(amount).toFixed(2)}`;
    } else if (['withdraw', 'bet'].includes(type)) {
      return `-$${Math.abs(amount).toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // 格式化日期時間
  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy/MM/dd HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      {/* 錯誤通知 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span className="block sm:inline">{error}</span>
          <button 
            className="float-right"
            onClick={() => setError(null)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {/* 搜尋和功能區 */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="搜尋交易ID、用戶名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg ${
              loadingExport ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700'
            }`}
            onClick={handleExport}
            disabled={loadingExport}
          >
            {loadingExport ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>匯出中...</span>
              </>
            ) : (
              <>
                <i className="fas fa-file-export"></i>
                <span>匯出報表</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* 過濾選項 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              typeFilter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
            }`}
            onClick={() => setTypeFilter('all')}
          >
            所有類型
          </button>
          <button 
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              typeFilter === 'deposit' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
            }`}
            onClick={() => setTypeFilter('deposit')}
          >
            儲值
          </button>
          <button 
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              typeFilter === 'bet' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
            }`}
            onClick={() => setTypeFilter('bet')}
          >
            下注
          </button>
          <button 
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              typeFilter === 'withdraw' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
            }`}
            onClick={() => setTypeFilter('withdraw')}
          >
            提現
          </button>
          <button 
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              typeFilter === 'win' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
            }`}
            onClick={() => setTypeFilter('win')}
          >
            獲獎
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="date" 
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-primary"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-gray-500">至</span>
          <input 
            type="date" 
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-primary"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button 
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            onClick={applyFilters}
          >
            篩選
          </button>
        </div>
      </div>
      
      {/* 交易列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">交易ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用戶</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">類型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">相關遊戲</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <i className="fas fa-spinner fa-spin text-primary"></i>
                      <span>載入中...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map(transaction => (
                  <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-700">{transaction.transaction_id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {transaction.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                        transaction.type === 'deposit' 
                          ? 'bg-green-100 text-success' 
                          : transaction.type === 'bet'
                            ? 'bg-blue-100 text-info'
                            : transaction.type === 'withdraw'
                              ? 'bg-red-100 text-error'
                              : transaction.type === 'win'
                                ? 'bg-yellow-100 text-warning'
                                : transaction.type === 'bonus'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getTypeText(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        ['deposit', 'win', 'bonus', 'refund'].includes(transaction.type)
                          ? 'text-success' 
                          : 'text-error'
                      }`}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {transaction.game_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                        transaction.status === 'completed' 
                          ? 'bg-green-100 text-success' 
                          : transaction.status === 'pending'
                            ? 'bg-blue-100 text-info'
                            : transaction.status === 'cancelled'
                              ? 'bg-yellow-100 text-warning'
                              : 'bg-red-100 text-error'
                      }`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    沒有找到符合條件的交易記錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* 分頁 */}
        {!loading && transactions.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-500">
              顯示 <span className="font-medium">{(filters.page - 1) * filters.page_size + 1}</span> 到 <span className="font-medium">{Math.min(filters.page * filters.page_size, totalRecords)}</span> 項結果，共 <span className="font-medium">{totalRecords}</span> 項
            </div>
            <div className="flex gap-1">
              <button 
                className={`px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 ${filters.page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => filters.page > 1 && handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              {/* 生成頁碼按鈕 */}
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                let pageNum: number;
                
                // 顯示當前頁和相鄰的頁碼
                if (totalPages <= 5) {
                  // 如果總頁數少於等於5，直接顯示所有頁碼
                  pageNum = index + 1;
                } else if (filters.page <= 3) {
                  // 如果當前頁小於等於3，顯示1-5頁
                  pageNum = index + 1;
                } else if (filters.page >= totalPages - 2) {
                  // 如果當前頁接近尾頁，顯示最後5頁
                  pageNum = totalPages - 4 + index;
                } else {
                  // 否則顯示當前頁及前後各2頁
                  pageNum = filters.page - 2 + index;
                }
                
                return (
                  <button 
                    key={pageNum}
                    className={`px-3 py-1 border border-gray-300 rounded-md ${
                      pageNum === filters.page 
                        ? 'bg-primary text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {/* 如果總頁數大於5且當前不是接近尾頁，顯示省略號和最後一頁 */}
              {totalPages > 5 && filters.page < totalPages - 2 && (
                <>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600">...</button>
                  <button 
                    className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button 
                className={`px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 ${filters.page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => filters.page < totalPages && handlePageChange(filters.page + 1)}
                disabled={filters.page >= totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage; 