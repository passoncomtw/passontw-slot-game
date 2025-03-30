import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, StatusBar, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN_KEY } from '../store/api/apiClient';

/**
 * 啟動頁面
 * 檢查用戶登入狀態並自動導航到適當的頁面
 */
const SplashScreen: React.FC = () => {
  const rotation = new Animated.Value(0);
  const scale = new Animated.Value(0.3);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { isAuthenticated, isLoading } = useAuth();
  
  // 檢查登入狀態並導航
  const checkAuthAndNavigate = async () => {
    try {
      console.log('正在檢查登入狀態...');
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      // 一般情況下，我們應該讓 AuthContext 處理身份驗證邏輯
      // 但為了確保SplashScreen能快速決定去向，我們也直接檢查token存在
      setTimeout(() => {
        // 如果已驗證或有token，導航到主頁
        if (isAuthenticated || token) {
          console.log('已登入，導航到主頁');
          navigation.reset({
            index: 0,
            routes: [{ name: ROUTES.MAIN }],
          });
        } else {
          console.log('未登入，導航到登入頁面');
          navigation.reset({
            index: 0,
            routes: [{ name: ROUTES.LOGIN }],
          });
        }
      }, 2500); // 等待動畫完成後再導航
    } catch (error) {
      console.error('檢查登入狀態時出錯:', error);
      // 出錯時導航到登入頁面
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.LOGIN }],
      });
    }
  };
  
  useEffect(() => {
    // 旋轉動畫
    Animated.timing(rotation, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    
    // 縮放動畫
    Animated.timing(scale, {
      toValue: 1,
      duration: 1000,
      easing: Easing.elastic(1.2),
      useNativeDriver: true,
    }).start();
    
    // 啟動頁面顯示後立即檢查登入狀態
    checkAuthAndNavigate();
    
    // 設置超時，確保即使出錯也能繼續
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('載入超時，導航到登入頁面');
        navigation.reset({
          index: 0,
          routes: [{ name: ROUTES.LOGIN }],
        });
      }
    }, 5000); // 5秒後如果還在加載，就強制導航
    
    return () => clearTimeout(timeout);
  }, []);
  
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { rotate: spin },
              { scale: scale },
            ],
          },
        ]}
      >
        <Text style={styles.icon}>🎰</Text>
      </Animated.View>
      <Text style={styles.title}>AI 幸運老虎機</Text>
      <Text style={styles.subtitle}>智能推薦，贏率提升</Text>
      <Text style={styles.loadingText}>載入中...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 20,
  },
});

export default SplashScreen; 