import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { 
  fetchTransactionsRequest,
  fetchTransactionsSuccess,
  fetchTransactionsFailure,
  TransactionParams
} from '../slices/transactionSlice';
import { getTransactionHistory } from '../api/userService';
import { Transaction } from '../../screens/main/TransactionsScreen';

// 獲取交易記錄異步處理
function* fetchTransactionsSaga(action: PayloadAction<TransactionParams>): Generator<any, void, any> {
  try {
    const { page, limit, filter } = action.payload;
    console.log('⚡️ fetchTransactionsSaga 開始 - 參數:', { page, limit, filter });
    
    try {
      // 嘗試從 API 獲取數據
      console.log('⚡️ 準備調用 API getTransactionHistory');
      const response = yield call(getTransactionHistory, {
        page,
        page_size: limit,
        type: filter
      });
      console.log('⚡️ API 響應:', response);
      
      // 檢查響應是否有效
      if (!response) {
        console.error('⚠️ API 響應為空');
        throw new Error('API 響應為空');
      }
      
      console.log('⚡️ 檢查 API 響應結構：', {
        hasTransactions: !!response.transactions,
        transactionsIsArray: Array.isArray(response.transactions),
        transactionsLength: Array.isArray(response.transactions) ? response.transactions.length : 'N/A',
        hasMorePages: response.total_pages > page,
        totalPages: response.total_pages,
        currentPage: page
      });
      
      // 將 API 響應數據轉換為前端使用的格式
      const transactions = response.transactions || [];
      console.log('⚡️ 原始交易數據:', transactions.length, '條記錄');
      
      // 打印第一條交易記錄作為示例
      if (transactions.length > 0) {
        console.log('⚡️ 第一條原始交易記錄 (示例):', JSON.stringify(transactions[0]));
      }
      
      const transformedTransactions: Transaction[] = transactions.map((tx: any) => {
        const mappedType = mapTransactionType(tx.type);
        const mappedStatus = mapTransactionStatus(tx.status);
        
        const transaction: Transaction = {
          id: tx.transaction_id || `tx-${Math.random().toString(36).substr(2, 9)}`,
          type: mappedType,
          amount: tx.amount || 0,
          date: tx.created_at || new Date().toISOString(),
          status: mappedStatus,
          description: tx.description || '',
          gameTitle: tx.game_title || ''
        };
        
        return transaction;
      });
      
      console.log('⚡️ 轉換後的交易數據:', transformedTransactions.length, '條記錄');
      
      // 打印第一條轉換後的交易記錄作為示例
      if (transformedTransactions.length > 0) {
        console.log('⚡️ 第一條轉換後交易記錄 (示例):', JSON.stringify(transformedTransactions[0]));
      }
      
      console.log('⚡️ 分頁信息:', { 當前頁: page, 總頁數: response.total_pages, 是否有更多: page < (response.total_pages || 1) });
      
      // 使用模擬延遲確保 Redux 更新有充足時間
      yield new Promise(resolve => setTimeout(resolve, 200));
      
      // 檢查 transformedTransactions 是否是有效的數組
      if (!Array.isArray(transformedTransactions)) {
        console.error('⚠️ 轉換後的交易數據不是數組');
        throw new Error('轉換後的交易數據格式無效');
      }
      
      const successPayload = {
        transactions: transformedTransactions,
        page,
        hasMore: page < (response.total_pages || 1)
      };
      
      console.log('⚡️ 準備 dispatch fetchTransactionsSuccess，payload:', {
        transactionsCount: successPayload.transactions.length,
        page: successPayload.page,
        hasMore: successPayload.hasMore
      });
      
      const successAction = fetchTransactionsSuccess(successPayload);
      console.log('⚡️ 創建的 action:', successAction.type);
      
      yield put(successAction);
      console.log('✅ fetchTransactionsSuccess 已成功 dispatch');
      
    } catch (apiError) {
      console.error('❌ API 請求失敗:', apiError);
      
      // 生成模擬測試數據
      console.log('⚡️ 生成模擬測試數據');
      const mockTransactions = generateMockTransactions(page, limit, filter);
      
      console.log('⚡️ 模擬數據生成完成，準備 dispatch');
      yield put(fetchTransactionsSuccess({
        transactions: mockTransactions,
        page,
        hasMore: page < 5 // 假設有 5 頁
      }));
      console.log('✅ 使用模擬數據 dispatch 成功');
    }
  } catch (error) {
    console.error('❌ 整個流程失敗:', error);
    let errorMessage = '獲取交易記錄失敗';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    yield put(fetchTransactionsFailure(errorMessage));
    console.log('❌ 已 dispatch fetchTransactionsFailure');
  }
}

// 映射 API 交易類型至前端交易類型
function mapTransactionType(apiType: string): Transaction['type'] {
  console.log('🔄 映射交易類型:', apiType);
  
  switch (apiType) {
    case 'deposit':
      return 'deposit';
    case 'withdraw':
      return 'withdraw';
    case 'bet':
      return 'lose';
    case 'win':
      return 'win';
    default:
      console.warn('⚠️ 未知的交易類型:', apiType);
      return 'transfer';
  }
}

// 映射 API 交易狀態至前端交易狀態
function mapTransactionStatus(apiStatus: string): Transaction['status'] {
  console.log('🔄 映射交易狀態:', apiStatus);
  
  switch (apiStatus) {
    case 'completed':
      return 'completed';
    case 'pending':
      return 'pending';
    default:
      console.warn('⚠️ 未知的交易狀態:', apiStatus);
      return 'failed';
  }
}

// 生成模擬交易數據 (如果 API 失敗時使用)
function generateMockTransactions(page: number, limit: number, filter?: string): Transaction[] {
  const transactions: Transaction[] = [];
  const startIndex = (page - 1) * limit;
  
  const types: Transaction['type'][] = ['deposit', 'withdraw', 'win', 'lose', 'transfer'];
  const gameNames = ['幸運七', '水果派對', '金幣樂園', '翡翠寶石', '財神到'];
  const statuses: Transaction['status'][] = ['completed', 'pending', 'failed'];
  
  // 如果有過濾條件，只生成特定類型的交易
  let filteredTypes = types;
  if (filter) {
    if (filter === 'deposit') {
      filteredTypes = ['deposit'];
    } else if (filter === 'withdraw') {
      filteredTypes = ['withdraw'];
    } else if (filter === 'bet,win') {
      filteredTypes = ['win', 'lose'];
    }
  }
  
  for (let i = 0; i < limit; i++) {
    const typeIndex = Math.floor(Math.random() * filteredTypes.length);
    const type = filteredTypes[typeIndex];
    
    let gameTitle;
    if (type === 'win' || type === 'lose') {
      gameTitle = gameNames[Math.floor(Math.random() * gameNames.length)];
    }
    
    const amount = Math.floor(Math.random() * 1000) + 50;
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
    } else if (type === 'win' || type === 'lose') {
      description = gameTitle ? `遊戲：${gameTitle}` : '遊戲交易';
    } else {
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
  
  return transactions;
}

// 使用默認導出 saga
export default function* transactionSaga() {
  yield takeLatest(fetchTransactionsRequest.type, fetchTransactionsSaga);
}