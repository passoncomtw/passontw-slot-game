import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../screens/main/TransactionsScreen';

/**
 * 交易記錄的狀態接口
 */
export interface TransactionState {
  data: Transaction[] | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

/**
 * 請求交易記錄的參數接口
 */
export interface TransactionParams {
  page: number;
  limit: number;
  filter?: string;
}

/**
 * 交易記錄的初始狀態
 */
const initialState: TransactionState = {
  data: null,
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true
};

/**
 * 交易記錄的 Redux Slice
 */
export const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    /**
     * 請求獲取交易記錄
     * 
     * @param state 當前狀態
     * @param action 包含請求參數的 Action
     */
    fetchTransactionsRequest: (state, action: PayloadAction<TransactionParams>) => {
      console.log('🔄 處理 fetchTransactionsRequest action', action.payload);
      state.error = null;
      
      if (action.payload.page === 1) {
        // 如果是第一頁，重置狀態並設置為加載中
        state.isLoading = true;
        // 清空數據時，用戶正在重新加載
        state.data = null;
        console.log('🔄 重置狀態，首次載入或重新載入');
      } else {
        console.log('🔄 加載更多數據，頁碼:', action.payload.page);
      }
      // 不在此處設置 isLoading=false,
      // 讓組件自行管理 "loadingMore" 狀態
    },
    
    /**
     * 獲取交易記錄成功
     * 
     * @param state 當前狀態
     * @param action 包含交易記錄數據的 Action
     */
    fetchTransactionsSuccess: (state, action: PayloadAction<{ 
      transactions: Transaction[]; 
      page: number; 
      hasMore: boolean 
    }>) => {
      console.log('✅ 處理 fetchTransactionsSuccess action', {
        收到記錄數: action.payload.transactions.length,
        頁碼: action.payload.page,
        還有更多: action.payload.hasMore
      });
      const { transactions, page, hasMore } = action.payload;
      
      if (page === 1) {
        // 第一頁數據，直接替換
        state.data = transactions;
        console.log('✅ 替換所有數據，數量:', transactions.length);
      } else if (state.data) {
        // 追加更多數據到現有列表
        state.data = [...state.data, ...transactions];
        console.log('✅ 追加數據，總數量:', state.data.length);
      } else {
        // 如果 state.data 為 null，確保初始化為陣列
        state.data = transactions;
        console.log('✅ 初始化數據，數量:', transactions.length);
      }
      
      // 更新狀態
      state.isLoading = false;
      state.error = null;
      state.page = page;
      state.hasMore = hasMore;
      console.log('✅ 更新完成，當前狀態:', { isLoading: false, page, hasMore });
    },
    
    /**
     * 獲取交易記錄失敗
     * 
     * @param state 當前狀態
     * @param action 包含錯誤信息的 Action
     */
    fetchTransactionsFailure: (state, action: PayloadAction<string>) => {
      console.log('❌ 處理 fetchTransactionsFailure action', { error: action.payload });
      state.isLoading = false;
      state.error = action.payload;
      // 保留現有數據，只更新錯誤狀態
      console.log('❌ 錯誤處理完成');
    },
    
    /**
     * 清空交易記錄
     * 用於用戶登出或需要重置狀態的場景
     * 
     * @param state 當前狀態
     */
    clearTransactions: (state) => {
      console.log('🧹 清空交易記錄');
      Object.assign(state, initialState);
      console.log('🧹 狀態已重置');
    }
  }
});

export const {
  fetchTransactionsRequest,
  fetchTransactionsSuccess,
  fetchTransactionsFailure,
  clearTransactions
} = transactionSlice.actions;

export default transactionSlice.reducer; 