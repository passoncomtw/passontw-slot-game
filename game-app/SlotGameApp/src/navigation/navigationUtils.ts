import { createRef } from 'react';
import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { ROUTES } from '../utils/constants';

// 創建一個全局導航引用
export const navigationRef = createRef<NavigationContainerRef<any>>();

/**
 * 重置導航到特定路由
 * @param routeName 要導航到的路由名稱
 */
export const resetNavigation = (routeName: string) => {
  if (navigationRef.current) {
    navigationRef.current.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: routeName }],
      })
    );
  }
};

/**
 * 重置到登入頁面
 */
export const resetToLogin = () => {
  resetNavigation('AuthRoot');
};

/**
 * 重置到主頁
 */
export const resetToMain = () => {
  resetNavigation('MainRoot');
}; 