import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { GameProvider } from '../context/GameContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// 導入所有頁面
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import GameScreen from '../screens/main/GameScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import AIAssistantScreen from '../screens/main/AIAssistantScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * 主頁標籤導航器
 */
const MainTabNavigator = () => {
  return (
    <GameProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = '';
            
            switch (route.name) {
              case ROUTES.HOME:
                iconName = focused ? 'home' : 'home-outline';
                break;
              case ROUTES.GAME:
                iconName = focused ? 'game-controller' : 'game-controller-outline';
                break;
              case ROUTES.LEADERBOARD:
                iconName = focused ? 'trophy' : 'trophy-outline';
                break;
              case ROUTES.PROFILE:
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'help-circle';
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6200EA',
          tabBarInactiveTintColor: '#B0B0B0',
          tabBarStyle: {
            backgroundColor: '#1E1E1E',
            borderTopColor: '#333',
          },
          tabBarLabelStyle: {
            fontSize: 12,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name={ROUTES.HOME}
          component={HomeScreen}
          options={{ title: '首頁' }}
        />
        <Tab.Screen
          name={ROUTES.GAME}
          component={GameScreen}
          options={{ title: '遊戲' }}
        />
        <Tab.Screen
          name={ROUTES.LEADERBOARD}
          component={LeaderboardScreen}
          options={{ title: '排行榜' }}
        />
        <Tab.Screen
          name={ROUTES.PROFILE}
          component={ProfileScreen}
          options={{ title: '我的' }}
        />
      </Tab.Navigator>
    </GameProvider>
  );
};

/**
 * 身份驗證堆疊導航器
 */
const AuthStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
    </Stack.Navigator>
  );
};

/**
 * 應用程序主導航器
 */
const AppNavigator = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // 模擬啟動加載
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} />
      </Stack.Navigator>
    );
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name={ROUTES.MAIN} component={MainTabNavigator} />
          <Stack.Screen name={ROUTES.SETTINGS} component={SettingsScreen} />
          <Stack.Screen name={ROUTES.AI_ASSISTANT} component={AIAssistantScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator; 