import { all, fork } from 'redux-saga/effects';
import { authSaga } from './authSaga';
import gameSaga from './gameSaga';
import walletSaga from './walletSaga';

// 根 Saga 合併所有 Saga
export default function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(gameSaga),
    fork(walletSaga),
  ]);
} 