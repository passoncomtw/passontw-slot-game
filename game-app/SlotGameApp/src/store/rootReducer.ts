import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import gameReducer from './slices/gameSlice';
import walletReducer from './slices/walletSlice';
import transactionReducer from './slices/transactionSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  game: gameReducer,
  wallet: walletReducer,
  transactions: transactionReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer; 