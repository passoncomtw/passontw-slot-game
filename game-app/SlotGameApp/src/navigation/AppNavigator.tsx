import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppSelector } from '../store/hooks';
import { COLORS, ROUTES } from '../utils/constants';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import GameScreen from '../screens/main/GameScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import WalletScreen from '../screens/main/WalletScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import AIAssistantScreen from '../screens/main/AIAssistantScreen';
import ReduxDebugScreen from '../screens/debug/ReduxDebugScreen';
import SplashScreen from '../screens/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 調試模式存儲鍵
const DEBUG_MODE_KEY = '@SlotGame:debug_mode';

// 創建導航器
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const DebugStack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const [showDebug, setShowDebug] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // 從 AsyncStorage 加載調試設置和檢查初始狀態
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const debugMode = await AsyncStorage.getItem(DEBUG_MODE_KEY);
        // 僅在開發模式下或存儲的設置為 true 時啟用調試
        setShowDebug(__DEV__ && (debugMode === 'true'));
        
        // 短暫顯示啟動畫面後關閉初始化狀態
        setTimeout(() => {
          setIsInitializing(false);
        }, 1000); // 使主要路由系統在 SplashScreen 的導航後執行
      } catch (error) {
        console.error('加載設置錯誤:', error);
        // 在出錯時，如果是開發模式，啟用調試功能
        if (__DEV__) {
          setShowDebug(true);
        }
        setIsInitializing(false);
      }
    };

    loadSettings();
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
          } else if (route.name === ROUTES.LEADERBOARD) {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === ROUTES.PROFILE) {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === ROUTES.DEBUG) {
            iconName = focused ? 'bug' : 'bug-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
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
      <Tab.Screen 
        name={ROUTES.HOME} 
        component={HomeScreen} 
        options={{
          tabBarLabel: '首頁'
        }}
      />
      <Tab.Screen 
        name={ROUTES.LEADERBOARD} 
        component={LeaderboardScreen} 
        options={{
          tabBarLabel: '排行榜'
        }}
      />
      <Tab.Screen 
        name={ROUTES.PROFILE} 
        component={ProfileScreen} 
        options={{
          tabBarLabel: '我的'
        }}
      />
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

  // 主要應用堆疊導航器
  const MainStackNavigator = () => (
    <MainStack.Navigator screenOptions={screenOptions}>
      <MainStack.Screen name="TabRoot" component={MainTabNavigator} />
      <MainStack.Screen name={ROUTES.SETTINGS} component={SettingsScreen} />
      {/* 添加其他頁面 */}
      <MainStack.Screen name={ROUTES.WALLET} component={WalletScreen} />
      <MainStack.Screen name={ROUTES.TRANSACTIONS} component={TransactionsScreen} />
      <MainStack.Screen name={ROUTES.GAME} component={GameScreen} />
      <MainStack.Screen 
        name={ROUTES.GAME_DETAIL} 
        component={GameScreen} 
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen name={ROUTES.NOTIFICATIONS} component={HomeScreen} />
      <MainStack.Screen name={ROUTES.AI_ASSISTANT} component={AIAssistantScreen} />
    </MainStack.Navigator>
  );

  if (loading && !isInitializing) {
    // 在載入狀態時，返回空元素或載入指示器
    return null;
  }

  // 移除 NavigationContainer，直接返回 Stack.Navigator
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isInitializing ? (
        // 首先顯示啟動頁面
        <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} />
      ) : showDebug && __DEV__ && !isAuthenticated ? (
        // 如果啟用了調試模式且用戶未登入，顯示調試頁面
        <Stack.Screen name="DebugRoot" component={DebugStackNavigator} />
      ) : isAuthenticated ? (
        // 如果用戶已登入，顯示主應用
        <Stack.Screen name="MainRoot" component={MainStackNavigator} />
      ) : (
        // 如果用戶未登入且未啟用調試，顯示身份驗證頁面
        <Stack.Screen name="AuthRoot" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator; 