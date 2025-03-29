import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import gameReducer from './gameSlice';
import walletReducer from './walletSlice';

// 根 Reducer 合併所有 Reducer
const rootReducer = combineReducers({
  auth: authReducer,
  game: gameReducer,
  wallet: walletReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer; 