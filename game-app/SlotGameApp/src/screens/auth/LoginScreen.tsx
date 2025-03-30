import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, ROUTES } from '../../utils/constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginRequest } from '../../store/slices/authSlice';
import { useAuth } from '../../context/AuthContext';

/**
 * 登入頁面
 */
const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const dispatch = useAppDispatch();
  const { login } = useAuth();
  
  // 從 Redux 獲取驗證狀態
  const { loading, isAuthenticated, error } = useAppSelector(state => state.auth);

  // 當用戶成功登入後，isAuthenticated 會變為 true
  useEffect(() => {
    if (isAuthenticated) {
      console.log('用戶已認證，導航至主頁');
      // 登入成功後導航至主頁
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.MAIN }],
      });
    }
  }, [isAuthenticated, navigation]);

  // 處理登入錯誤
  useEffect(() => {
    if (error) {
      Alert.alert('登入失敗', error);
    }
  }, [error]);

  /**
   * 處理登入
   */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('錯誤', '請填寫電子郵件和密碼');
      return;
    }

    console.log('開始登入流程:', { email, rememberMe });

    try {
      // 使用 Context API 進行登入
      await login(email, password);
      console.log('Context API 登入成功');

      // 調用 Redux action 處理登入
      dispatch(loginRequest({ 
        email, 
        password,
        rememberMe
      }));
    } catch (error) {
      console.error('登入錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : '登入失敗，請稍後再試';
      Alert.alert('登入失敗', errorMessage);
    }
  };

  /**
   * 跳轉到註冊頁面
   */
  const navigateToRegister = () => {
    navigation.navigate(ROUTES.REGISTER);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AI 老虎機</Text>
          <Text style={styles.headerSubtitle}>登入您的帳號以繼續</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="電子郵件"
          value={email}
          onChangeText={setEmail}
          placeholder="example@mail.com"
          keyboardType="email-address"
          icon={<Ionicons name="mail-outline" size={20} color="#999" />}
        />
        
        <Input
          label="密碼"
          value={password}
          onChangeText={setPassword}
          placeholder="請輸入密碼"
          secureTextEntry
          icon={<Ionicons name="lock-closed-outline" size={20} color="#999" />}
        />
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={styles.rememberText}>記住我</Text>
          </TouchableOpacity>
          
          <TouchableOpacity>
            <Text style={styles.forgotText}>忘記密碼？</Text>
          </TouchableOpacity>
        </View>
        
        <Button
          title="登入"
          onPress={handleLogin}
          isLoading={loading}
        />
        
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>或使用其他方式登入</Text>
          <View style={styles.divider} />
        </View>
        
        <View style={styles.socialContainer}>
          <TouchableOpacity style={[styles.socialButton, styles.facebookButton]}>
            <Ionicons name="logo-facebook" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
            <Ionicons name="logo-google" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.socialButton, styles.appleButton]}>
            <Ionicons name="logo-apple" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          還沒有帳號？
          <Text 
            style={styles.registerText} 
            onPress={navigateToRegister}
          > 立即註冊
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingTop: 30,
    paddingBottom: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  rememberText: {
    color: '#333',
    fontSize: 14,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  socialButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  facebookButton: {
    backgroundColor: '#3b5998',
  },
  googleButton: {
    backgroundColor: '#db4437',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  registerText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default LoginScreen; 