import { put, call, takeLatest, all } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import * as userService from '../api/userService';
import { 
  DepositRequest, 
  TransactionHistoryRequest,
  TransactionHistoryResponse,
  TransactionResponse, 
  UserWallet, 
  WithdrawRequest 
} from '../api/userService';
import {
  fetchBalanceRequest,
  fetchBalanceSuccess,
  fetchBalanceFailure,
  depositRequest,
  depositSuccess,
  depositFailure,
  withdrawRequest,
  withdrawSuccess,
  withdrawFailure,
  fetchTransactionsRequest,
  fetchTransactionsSuccess,
  fetchTransactionsFailure,
} from '../slices/walletSlice';

// 獲取錢包餘額的 Saga
function* fetchBalanceSaga(): Generator<any, void, UserWallet> {
  try {
    const response = yield call(userService.getWalletBalance);
    yield put(fetchBalanceSuccess(response));
  } catch (error: any) {
    yield put(fetchBalanceFailure(error.response?.data?.error || '獲取錢包餘額失敗'));
  }
}

// 存款的 Saga
function* depositSaga(action: PayloadAction<DepositRequest>): Generator<any, void, TransactionResponse> {
  try {
    const response = yield call(userService.requestDeposit, action.payload);
    yield put(depositSuccess(response));
  } catch (error: any) {
    yield put(depositFailure(error.response?.data?.error || '存款失敗'));
  }
}

// 提款的 Saga
function* withdrawSaga(action: PayloadAction<WithdrawRequest>): Generator<any, void, TransactionResponse> {
  try {
    const response = yield call(userService.requestWithdraw, action.payload);
    yield put(withdrawSuccess(response));
  } catch (error: any) {
    yield put(withdrawFailure(error.response?.data?.error || '提款失敗'));
  }
}

// 獲取交易歷史的 Saga
function* fetchTransactionsSaga(action: PayloadAction<TransactionHistoryRequest>): Generator<any, void, TransactionHistoryResponse> {
  try {
    const response = yield call(userService.getTransactionHistory, action.payload);
    yield put(fetchTransactionsSuccess(response));
  } catch (error: any) {
    yield put(fetchTransactionsFailure(error.response?.data?.error || '獲取交易歷史失敗'));
  }
}

// 監聽 Redux 操作的 Saga
export default function* walletSaga() {
  yield all([
    takeLatest(fetchBalanceRequest.type, fetchBalanceSaga),
    takeLatest(depositRequest.type, depositSaga),
    takeLatest(withdrawRequest.type, withdrawSaga),
    takeLatest(fetchTransactionsRequest.type, fetchTransactionsSaga),
  ]);
} 