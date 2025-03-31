import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from '../store';

/**
 * 使用類型化的 useSelector hook
 */
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default useAppSelector; 