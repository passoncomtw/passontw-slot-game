import { all, fork } from 'redux-saga/effects';
import authSaga from './sagas/authSaga';
import gameSaga from './sagas/gameSaga';
import walletSaga from './sagas/walletSaga';
import transactionSaga from './sagas/transactionSaga';

export default function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(gameSaga),
    fork(walletSaga),
    fork(transactionSaga),
  ]);
} 