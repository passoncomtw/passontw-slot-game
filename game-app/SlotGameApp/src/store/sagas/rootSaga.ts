import { all } from 'redux-saga/effects';
import authSaga from './authSaga';
import fetchUserSaga from './fetchUserSaga';
import walletSaga from './walletSaga';
import gameSaga from './gameSaga';
import transactionSaga from './transactionSaga';

// 根 Saga 合併所有 Saga
export default function* rootSaga() {
  yield all([
    authSaga(),
    fetchUserSaga(),
    walletSaga(),
    gameSaga(),
    transactionSaga()
  ]);
} 