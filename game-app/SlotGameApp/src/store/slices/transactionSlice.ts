import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../screens/main/TransactionsScreen';

export interface TransactionState {
  data: Transaction[] | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

export interface TransactionParams {
  page: number;
  limit: number;
  filter?: string;
}

const initialState: TransactionState = {
  data: null,
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true
};

export const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    fetchTransactionsRequest: (state, action: PayloadAction<TransactionParams>) => {
      if (action.payload.page === 1) {
        // 如果是第一頁，重置狀態
        state.isLoading = true;
        state.error = null;
      } else {
        // 載入更多的情況
        state.isLoading = false; // 保持原狀態，使用單獨的 loadingMore 標誌
      }
    },
    fetchTransactionsSuccess: (state, action: PayloadAction<{ transactions: Transaction[]; page: number; hasMore: boolean }>) => {
      const { transactions, page, hasMore } = action.payload;
      
      if (page === 1) {
        // 第一頁數據
        state.data = transactions;
      } else if (state.data) {
        // 追加更多數據
        state.data = [...state.data, ...transactions];
      } else {
        state.data = transactions;
      }
      
      state.isLoading = false;
      state.error = null;
      state.page = page;
      state.hasMore = hasMore;
    },
    fetchTransactionsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearTransactions: (state) => {
      state.data = null;
      state.isLoading = false;
      state.error = null;
      state.page = 1;
      state.hasMore = true;
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