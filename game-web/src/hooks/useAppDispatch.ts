import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';

/**
 * 使用類型化的 useDispatch hook
 */
const useAppDispatch = () => useDispatch<AppDispatch>();

export default useAppDispatch; 