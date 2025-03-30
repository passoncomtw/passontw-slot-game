import { apiService } from './apiClient';
import { Transaction } from '../../screens/main/TransactionsScreen';

// 交易記錄 API 返回類型
export interface TransactionResponse {
  data: Transaction[];
  hasMore: boolean;
  total: number;
}

// 模擬交易數據生成
function generateMockTransactions(page: number, limit: number, filter?: string): TransactionResponse {
  const transactions: Transaction[] = [];
  const startIndex = (page - 1) * limit;
  const totalItems = 95; // 假設總共有 95 條記錄
  
  // 計算本頁要生成的項目數
  const itemsToGenerate = Math.min(limit, totalItems - startIndex);
  
  if (itemsToGenerate <= 0) {
    return {
      data: [],
      hasMore: false,
      total: totalItems
    };
  }
  
  const types: Transaction['type'][] = ['deposit', 'withdraw', 'win', 'lose', 'transfer'];
  const gameNames = ['幸運七', '水果派對', '金幣樂園', '翡翠寶石', '財神到'];
  const statuses: Transaction['status'][] = ['completed', 'pending', 'failed'];
  
  for (let i = 0; i < itemsToGenerate; i++) {
    const typeIndex = Math.floor(Math.random() * types.length);
    const type = types[typeIndex];
    
    let gameTitle;
    if (type === 'win' || type === 'lose') {
      gameTitle = gameNames[Math.floor(Math.random() * gameNames.length)];
    }
    
    const amount = Math.floor(Math.random() * 500) + 10;
    const statusIndex = Math.floor(Math.random() * 10) < 8 ? 0 : Math.floor(Math.random() * 3); // 80% 完成，20% 其他狀態
    const status = statuses[statusIndex];
    
    // 生成過去 30 天內的隨機日期
    const randomDays = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    const date = new Date();
    date.setDate(date.getDate() - randomDays);
    date.setHours(date.getHours() - randomHours);
    date.setMinutes(date.getMinutes() - randomMinutes);
    
    let description;
    if (type === 'deposit') {
      const methods = ['信用卡充值', '銀行轉賬', '電子錢包'];
      description = methods[Math.floor(Math.random() * methods.length)];
    } else if (type === 'withdraw') {
      description = '提現至銀行賬戶';
    } else if (type === 'transfer') {
      description = '賬戶間轉賬';
    }
    
    transactions.push({
      id: `tx-${startIndex + i + 1}`,
      type,
      amount,
      date: date.toISOString(),
      status,
      gameTitle,
      description
    });
  }
  
  // 如果有過濾條件，應用過濾
  let filteredTransactions = transactions;
  if (filter) {
    if (filter === 'deposit') {
      filteredTransactions = transactions.filter(tx => tx.type === 'deposit');
    } else if (filter === 'withdraw') {
      filteredTransactions = transactions.filter(tx => tx.type === 'withdraw');
    } else if (filter === 'game') {
      filteredTransactions = transactions.filter(tx => tx.type === 'win' || tx.type === 'lose');
    }
  }
  
  return {
    data: filteredTransactions,
    hasMore: startIndex + itemsToGenerate < totalItems,
    total: totalItems
  };
}

// 交易記錄 API 服務
export const transactionService = {
  /**
   * 獲取交易記錄
   * @param page 頁碼
   * @param limit 每頁數量
   * @param filter 過濾條件
   * @returns 交易記錄響應
   */
  getTransactions: async (page: number, limit: number, filter?: string): Promise<TransactionResponse> => {
    try {
      // 實際應用中，應該調用真實的 API
      // return await apiService.get(`/transactions?page=${page}&limit=${limit}${filter ? `&filter=${filter}` : ''}`);
      
      // 目前使用模擬數據
      return generateMockTransactions(page, limit, filter);
    } catch (error) {
      console.error('獲取交易記錄失敗:', error);
      throw error;
    }
  },
  
  /**
   * 獲取交易記錄詳情
   * @param id 交易 ID
   * @returns 交易詳情
   */
  getTransactionDetail: async (id: string): Promise<Transaction> => {
    try {
      // 實際應用中，應該調用真實的 API
      // return await apiService.get(`/transactions/${id}`);
      
      // 目前返回模擬數據
      return {
        id,
        type: 'deposit',
        amount: 100,
        date: new Date().toISOString(),
        status: 'completed',
        description: '信用卡充值'
      };
    } catch (error) {
      console.error('獲取交易詳情失敗:', error);
      throw error;
    }
  }
}; 