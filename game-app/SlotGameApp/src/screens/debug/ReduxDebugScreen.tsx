import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { loginRequest, registerRequest, logoutRequest } from '../../store/slices/authSlice';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '../../utils/constants';

// 調試模式存儲鍵
const DEBUG_MODE_KEY = '@SlotGame:debug_mode';
// Saga 監控開關鍵
const SAGA_MONITOR_KEY = '@SlotGame:saga_monitor_enabled';

// 定義導航參數類型
type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
};

/**
 * Redux 調試螢幕
 * 用於觀察和測試 Redux 狀態和 Saga 效果
 */
const ReduxDebugScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  
  // 獲取所有 Redux 狀態
  const authState = useAppSelector(state => state.auth);
  const gameState = useAppSelector(state => state.game);
  const walletState = useAppSelector(state => state.wallet);
  
  // 測試操作的參數
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('Test123456');
  const [testUsername, setTestUsername] = useState('testuser');
  
  // 調試模式設置
  const [debugModeEnabled, setDebugModeEnabled] = useState(false);
  const [sagaMonitorEnabled, setSagaMonitorEnabled] = useState(false);
  
  // 從 AsyncStorage 加載調試設置
  useEffect(() => {
    const loadDebugSettings = async () => {
      try {
        const debugMode = await AsyncStorage.getItem(DEBUG_MODE_KEY);
        if (debugMode !== null) {
          setDebugModeEnabled(debugMode === 'true');
        }
        
        const sagaMonitor = await AsyncStorage.getItem(SAGA_MONITOR_KEY);
        if (sagaMonitor !== null) {
          setSagaMonitorEnabled(sagaMonitor === 'true');
          
          // 設置全局變數以便 store.ts 可以使用
          if (typeof global !== 'undefined') {
            global.__REDUX_SAGA_MONITOR_ENABLED__ = sagaMonitor === 'true';
          }
        }
      } catch (error) {
        console.error('加載調試設置錯誤:', error);
      }
    };
    
    loadDebugSettings();
  }, []);
  
  // 保存調試設置到 AsyncStorage
  const saveDebugSetting = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(DEBUG_MODE_KEY, enabled.toString());
      setDebugModeEnabled(enabled);
      
      if (enabled) {
        Alert.alert(
          '調試模式已啟用', 
          '下次啟動應用時將直接顯示調試頁面',
          [{ text: '確定' }]
        );
      } else {
        Alert.alert(
          '調試模式已禁用', 
          '下次啟動應用將正常顯示',
          [{ text: '確定' }]
        );
      }
    } catch (error) {
      console.error('保存調試設置錯誤:', error);
      Alert.alert('錯誤', '無法保存設置');
    }
  };
  
  // 保存 Saga 監控器設置
  const saveSagaMonitorSetting = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(SAGA_MONITOR_KEY, enabled.toString());
      setSagaMonitorEnabled(enabled);
      
      // 立即更新全局變數
      if (typeof global !== 'undefined') {
        global.__REDUX_SAGA_MONITOR_ENABLED__ = enabled;
      }
      
      Alert.alert(
        enabled ? 'Saga 監控已啟用' : 'Saga 監控已禁用',
        enabled ? '現在可以在控制台中查看 Saga 操作的詳細信息' : 'Saga 操作的詳細信息將不再顯示在控制台中',
        [{ text: '確定' }]
      );
    } catch (error) {
      console.error('保存 Saga 監控設置錯誤:', error);
      Alert.alert('錯誤', '無法保存設置');
    }
  };
  
  // 測試按鈕操作
  const runLoginTest = () => {
    dispatch(loginRequest({
      email: testEmail,
      password: testPassword,
      rememberMe: true
    }));
  };
  
  const runRegisterTest = () => {
    dispatch(registerRequest({
      username: testUsername,
      email: testEmail,
      password: testPassword
    }));
  };
  
  const runLogoutTest = () => {
    dispatch(logoutRequest());
  };
  
  // 返回主頁
  const navigateBack = () => {
    if (authState.isAuthenticated) {
      navigation.navigate('Main');
    } else {
      navigation.navigate('Auth');
    }
  };
  
  // 打開 React Native DevTools
  const openDevTools = () => {
    Alert.alert(
      'React Native DevTools',
      '請在終端按下 "j" 鍵打開 DevTools，或手動運行 "react-devtools" 命令',
      [{ text: '確定' }]
    );
  };
  
  // 格式化 JSON 以便顯示
  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C2C2C" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Redux 調試工具</Text>
        <TouchableOpacity style={styles.devToolsButton} onPress={openDevTools}>
          <Ionicons name="construct-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>調試設置</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>啟動時顯示調試頁面</Text>
              <Text style={styles.settingDescription}>
                啟用後，下次啟動應用時將直接顯示此頁面
              </Text>
            </View>
            
            <Switch
              value={debugModeEnabled}
              onValueChange={saveDebugSetting}
              trackColor={{ false: '#555', true: '#6200EA' }}
              thumbColor={debugModeEnabled ? '#B388FF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>啟用 Saga 監控</Text>
              <Text style={styles.settingDescription}>
                在控制台輸出所有 Saga 效果的詳細信息
              </Text>
            </View>
            
            <Switch
              value={sagaMonitorEnabled}
              onValueChange={saveSagaMonitorSetting}
              trackColor={{ false: '#555', true: '#6200EA' }}
              thumbColor={sagaMonitorEnabled ? '#B388FF' : '#f4f3f4'}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.devToolsHintButton}
            onPress={() => Alert.alert(
              'DevTools 使用提示',
              '1. 在終端按 "j" 鍵打開 React Native DevTools\n' +
              '2. 使用 Chrome DevTools 查看 Redux 日誌\n' +
              '3. 啟用 Saga 監控在控制台查看 Saga 效果\n' +
              '4. 使用 React Native Debugger 進行高級調試'
            )}
          >
            <Ionicons name="information-circle-outline" size={18} color="#fff" />
            <Text style={styles.devToolsHintText}>查看使用提示</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>測試操作</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email:</Text>
            <TextInput
              style={styles.input}
              value={testEmail}
              onChangeText={setTestEmail}
              placeholder="輸入測試電子郵件"
              placeholderTextColor="#777"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password:</Text>
            <TextInput
              style={styles.input}
              value={testPassword}
              onChangeText={setTestPassword}
              placeholder="輸入測試密碼"
              placeholderTextColor="#777"
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username:</Text>
            <TextInput
              style={styles.input}
              value={testUsername}
              onChangeText={setTestUsername}
              placeholder="輸入測試用戶名"
              placeholderTextColor="#777"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={runLoginTest}>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>測試登入</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={runRegisterTest}>
              <Ionicons name="person-add-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>測試註冊</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={runLogoutTest}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>測試登出</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auth 狀態</Text>
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>{formatJSON(authState)}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game 狀態</Text>
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>{formatJSON(gameState)}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet 狀態</Text>
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>{formatJSON(walletState)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    backgroundColor: '#2C2C2C',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  devToolsButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  settingDescription: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  devToolsHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 4,
    marginTop: 16,
    justifyContent: 'center',
  },
  devToolsHintText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#ccc',
    marginBottom: 4,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#444',
    borderRadius: 4,
    padding: 10,
    color: '#fff',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#6200EA',
    padding: 10,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
  stateContainer: {
    backgroundColor: '#444',
    borderRadius: 4,
    padding: 12,
  },
  stateText: {
    color: '#ddd',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default ReduxDebugScreen; 