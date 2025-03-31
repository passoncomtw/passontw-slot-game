import { all, fork } from 'redux-saga/effects';
import authSaga from './sagas/authSaga';

/**
 * 根 Saga
 */
export default function* rootSaga() {
  yield all([
    fork(authSaga),
    // 這裡可以添加其他的 saga
  ]);
} 