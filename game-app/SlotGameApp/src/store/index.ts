import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import rootReducer from './rootReducer';
import rootSaga from './rootSaga';

// 創建 saga 中間件
const sagaMiddleware = createSagaMiddleware();

// 配置 Redux store
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({ 
      thunk: false,
      serializableCheck: false  // 關閉序列化檢查，在開發模式中可能會有警告
    }).concat(sagaMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// 運行 root saga
sagaMiddleware.run(rootSaga);

// 導出 store 以及類型定義
export type AppDispatch = typeof store.dispatch;
export default store; 