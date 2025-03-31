import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState } from './rootReducer';
import type { AppDispatch } from './index';
import { useMemo } from 'react';

// 使用類型化版本的 useDispatch 和 useSelector hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();

// 更新 useAppSelector 以使用 memoization 避免不必要的重新渲染
export const useAppSelector: TypedUseSelectorHook<RootState> = (selector) => {
  // 使用 useMemo 記憶化 selector 函數本身
  const memoizedSelector = useMemo(() => selector, [selector]);
  return useSelector(memoizedSelector);
}; 