import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState } from './rootReducer';
import type { AppDispatch } from './index';

// 使用類型化版本的 useDispatch 和 useSelector hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 