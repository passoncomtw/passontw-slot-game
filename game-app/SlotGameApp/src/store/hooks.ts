import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState } from './slices/rootReducer';
import type { AppDispatch } from './store';

// 使用類型定義的 Hook
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 