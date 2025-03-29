import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppSelector } from '../store/hooks';
import { ROUTES } from '../utils/constants';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import ReduxDebugScreen from '../screens/debug/ReduxDebugScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 調試模式存儲鍵
const DEBUG_MODE_KEY = '@SlotGame:debug_mode';

// 創建導航器
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const DebugStack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const [showDebug, setShowDebug] = useState(false);

  // 從 AsyncStorage 加載調試設置
  useEffect(() => {
    const loadDebugSettings = async () => {
      try {
        const debugMode = await AsyncStorage.getItem(DEBUG_MODE_KEY);
        // 僅在開發模式下或存儲的設置為 true 時啟用調試
        setShowDebug(__DEV__ && (debugMode === 'true'));
      } catch (error) {
        console.error('加載調試設置錯誤:', error);
        // 在出錯時，如果是開發模式，啟用調試功能
        if (__DEV__) {
          setShowDebug(true);
        }
      }
    };

    loadDebugSettings();
  }, []);

  // 身份驗證堆疊導航器
  const AuthStackNavigator = () => (
    <AuthStack.Navigator screenOptions={screenOptions}>
      <AuthStack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <AuthStack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
    </AuthStack.Navigator>
  );

  // 調試堆疊導航器
  const DebugStackNavigator = () => (
    <DebugStack.Navigator screenOptions={screenOptions}>
      <DebugStack.Screen name={ROUTES.REDUX_DEBUG} component={ReduxDebugScreen} />
    </DebugStack.Navigator>
  );

  // 主標籤導航器
  const MainTabNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === ROUTES.HOME) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === ROUTES.GAME) {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === ROUTES.PROFILE) {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === ROUTES.DEBUG) {
            iconName = focused ? 'bug' : 'bug-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200EA',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#444',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen name={ROUTES.HOME} component={HomeScreen} />
      {__DEV__ && showDebug && (
        <Tab.Screen 
          name={ROUTES.DEBUG} 
          component={ReduxDebugScreen}
          options={{
            tabBarLabel: '調試',
          }}
        />
      )}
    </Tab.Navigator>
  );

  if (loading) {
    // 在載入狀態時，返回空元素或載入指示器
    return null;
  }

  // 移除 NavigationContainer，直接返回 Stack.Navigator
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {showDebug && __DEV__ && !isAuthenticated ? (
        // 如果啟用了調試模式且用戶未登入，顯示調試頁面作為初始畫面
        <Stack.Screen name="DebugRoot" component={DebugStackNavigator} />
      ) : isAuthenticated ? (
        // 如果用戶已登入，顯示主應用
        <Stack.Screen name="MainRoot" component={MainTabNavigator} />
      ) : (
        // 如果用戶未登入且未啟用調試，顯示身份驗證頁面
        <Stack.Screen name="AuthRoot" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator; 