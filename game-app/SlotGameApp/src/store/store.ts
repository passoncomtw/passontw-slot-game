import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { createLogger } from 'redux-logger';
import rootReducer from './slices/rootReducer';
import rootSaga from './sagas/rootSaga';
import { composeWithDevTools } from '@redux-devtools/extension';

// 擴展 global 類型
declare global {
  // eslint-disable-next-line no-var
  var __REDUX_SAGA_MONITOR_ENABLED__: boolean;
  var __REDUX_DEVTOOLS_ENABLED__: boolean;
}

// 設置默認值
if (typeof global !== 'undefined') {
  global.__REDUX_DEVTOOLS_ENABLED__ = global.__REDUX_DEVTOOLS_ENABLED__ !== false;
}

// 創建 saga 中間件
const sagaMiddleware = createSagaMiddleware({
  // Saga Dev Tools 監控選項
  sagaMonitor: __DEV__ ? {
    effectTriggered: effect => {
      if (global.__REDUX_SAGA_MONITOR_ENABLED__) {
        console.log('Effect triggered:', effect);
      }
    },
    effectResolved: (effectId, result) => {
      if (global.__REDUX_SAGA_MONITOR_ENABLED__) {
        console.log('Effect resolved:', effectId, result);
      }
    },
    effectRejected: (effectId, error) => {
      if (global.__REDUX_SAGA_MONITOR_ENABLED__) {
        console.log('Effect rejected:', effectId, error);
      }
    },
    effectCancelled: effectId => {
      if (global.__REDUX_SAGA_MONITOR_ENABLED__) {
        console.log('Effect cancelled:', effectId);
      }
    },
    actionDispatched: action => {
      if (global.__REDUX_SAGA_MONITOR_ENABLED__) {
        console.log('Action dispatched:', action);
      }
    }
  } : undefined
});

// 創建 Logger 中間件 (僅在開發環境中啟用)
const loggerMiddleware = createLogger({
  collapsed: true,
  diff: true,
  colors: {
    title: () => '#8315E7', // 紫色標題
    prevState: () => '#9E9E9E', // 灰色前一狀態
    action: () => '#1976D2',   // 藍色操作
    nextState: () => '#43A047', // 綠色下一狀態
    error: () => '#E53935',     // 紅色錯誤
  },
  // React Native 0.77+ 版本中禁用控制台日誌，改用 React Native DevTools
  logger: {
    log: () => {},
    group: () => {},
    groupEnd: () => {},
    groupCollapsed: () => {},
  },
});

// 判斷是否啟用 Redux DevTools
const isDevToolsEnabled = __DEV__ || true;

// 配置 store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    // 開發環境包含 logger，生產環境不包含
    const middleware = getDefaultMiddleware({
      thunk: false, // 禁用 thunk 中間件，因為我們使用 saga
      serializableCheck: {
        // 忽略特定路徑的可序列化檢查
        ignoredActions: ['FLUSH', 'REHYDRATE', 'PAUSE', 'PERSIST', 'PURGE', 'REGISTER'],
        ignoredPaths: ['some.path.to.ignore'],
      },
    }).concat(sagaMiddleware);
    
    if (__DEV__) {
      return middleware.concat(loggerMiddleware);
    }
    
    return middleware;
  },
  // 在開發環境啟用 Redux DevTools
  devTools: {
    name: 'SlotGame Redux',
    trace: true,
    traceLimit: 25
  }
});

// 運行 root saga
sagaMiddleware.run(rootSaga);

// 設置 Saga 監控器開關（可以通過 React Native DevTools 開啟/關閉）
if (__DEV__ && typeof global !== 'undefined') {
  global.__REDUX_SAGA_MONITOR_ENABLED__ = false;
}

// 將 store 添加到全局環境中方便調試 (僅在開發模式)
if (true) {
  if (typeof window !== 'undefined') {
    (window as any).store = store;
  }
  
  // 添加使用 React Native DevTools 的提示
  console.log('\x1b[36m%s\x1b[0m', '提示: 在終端按下 "j" 鍵可打開 React Native DevTools');
  console.log('\x1b[36m%s\x1b[0m', '提示: 按下 "d" 鍵打開開發者選單，然後啟用 "Debug Remote JS"');
  console.log('\x1b[36m%s\x1b[0m', 'Redux 調試提示: 使用 React Native DevTools 觀察狀態變化');
  
  if (isDevToolsEnabled) {
    console.log('\x1b[32m%s\x1b[0m', 'Redux DevTools 已啟用，可以使用 Redux DevTools 擴展查看狀態');
  } else {
    console.log('\x1b[33m%s\x1b[0m', 'Redux DevTools 未啟用，可以在調試設置中啟用');
  }
}

// 為 dispatch 類型提供類型
export type AppDispatch = typeof store.dispatch;

// 導出默認 store
export default store; 