import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { 
  fetchTransactionsRequest,
  fetchTransactionsSuccess,
  fetchTransactionsFailure,
  TransactionParams
} from '../slices/transactionSlice';
import { transactionService } from '../api/transactionService';
import { TransactionResponse } from '../api/transactionService';

// 獲取交易記錄異步處理
function* fetchTransactionsSaga(action: PayloadAction<TransactionParams>): Generator<any, void, TransactionResponse> {
  try {
    const { page, limit, filter } = action.payload;
    
    // 模擬 API 請求延遲
    yield new Promise(resolve => setTimeout(resolve, 500));
    
    // 實際應用中，這裡應該使用 API 請求獲取數據
    const response = yield call(transactionService.getTransactions, page, limit, filter);
    
    yield put(fetchTransactionsSuccess({
      transactions: response.data || [],
      page,
      hasMore: response.hasMore || false
    }));
  } catch (error) {
    let errorMessage = '獲取交易記錄失敗';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    yield put(fetchTransactionsFailure(errorMessage));
  }
}

// 使用默認導出 saga
export default function* transactionSaga() {
  yield takeLatest(fetchTransactionsRequest.type, fetchTransactionsSaga);
} 