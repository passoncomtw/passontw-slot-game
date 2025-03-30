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
import { registerRequest } from '../../store/slices/authSlice';

/**
 * 註冊頁面
 */
const RegisterScreen: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const dispatch = useAppDispatch();
  
  // 從 Redux 獲取驗證狀態
  const { loading, isAuthenticated, error } = useAppSelector(state => state.auth);

  // 當用戶成功註冊後，isAuthenticated 會變為 true
  useEffect(() => {
    if (isAuthenticated) {
      // 註冊成功後導航至主頁
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.MAIN }],
      });
    }
  }, [isAuthenticated, navigation]);

  // 處理註冊錯誤
  useEffect(() => {
    if (error) {
      Alert.alert('註冊失敗', error);
    }
  }, [error]);

  /**
   * 處理註冊
   */
  const handleRegister = () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('錯誤', '請填寫所有欄位');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('錯誤', '兩次輸入的密碼不一致');
      return;
    }

    if (!agreeTerms) {
      Alert.alert('錯誤', '請同意服務條款和隱私政策');
      return;
    }

    // 調用 Redux action 處理註冊
    dispatch(registerRequest({ 
      username, 
      email, 
      password 
    }));
  };

  /**
   * 跳轉到登入頁面
   */
  const navigateToLogin = () => {
    navigation.navigate(ROUTES.LOGIN);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>註冊</Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="使用者名稱"
          value={username}
          onChangeText={setUsername}
          placeholder="請輸入使用者名稱"
          icon={<Ionicons name="person-outline" size={20} color="#999" />}
        />
        
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
          placeholder="請設定密碼"
          secureTextEntry
          icon={<Ionicons name="lock-closed-outline" size={20} color="#999" />}
        />
        
        <Input
          label="確認密碼"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="請再次輸入密碼"
          secureTextEntry
          icon={<Ionicons name="lock-closed-outline" size={20} color="#999" />}
        />
        
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => setAgreeTerms(!agreeTerms)}
        >
          <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
            {agreeTerms && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={styles.termsText}>
            我同意服務條款和隱私政策
          </Text>
        </TouchableOpacity>
        
        <Button
          title="註冊"
          onPress={handleRegister}
          isLoading={loading}
        />
        
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>其他註冊方式</Text>
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
          已有帳號？
          <Text 
            style={styles.loginText} 
            onPress={navigateToLogin}
          > 立即登入
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
  header: {
    backgroundColor: COLORS.primary,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 18,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingTop: 30,
    paddingBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  termsText: {
    color: '#333',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  loginText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen; 