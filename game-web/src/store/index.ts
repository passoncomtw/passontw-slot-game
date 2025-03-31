import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './slices/authSlice';
import rootSaga from './rootSaga';

// 創建 Saga middleware
const sagaMiddleware = createSagaMiddleware();

// 創建 Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,
    // 這裡可以添加其他的 reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware),
});

// 運行根 Saga
sagaMiddleware.run(rootSaga);

// 定義 RootState 類型
export type RootState = ReturnType<typeof store.getState>;

// 定義 AppDispatch 類型
export type AppDispatch = typeof store.dispatch;

export default store; 