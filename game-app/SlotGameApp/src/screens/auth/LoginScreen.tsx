import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Alert, 
  Image 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, ROUTES } from '../../utils/constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * 登入頁面
 */
const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login, isLoading } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  /**
   * 處理登入
   */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('錯誤', '請填寫所有欄位');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      Alert.alert('登入失敗', '電子郵件或密碼不正確');
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
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>登入</Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Ionicons name="person-circle" size={60} color={COLORS.primary} />
        </View>
        
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
        
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>忘記密碼？</Text>
        </TouchableOpacity>
        
        <Button
          title="登入"
          onPress={handleLogin}
          isLoading={isLoading}
        />
        
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>其他登入方式</Text>
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
            style={styles.signupText} 
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: COLORS.primary,
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
    backgroundColor: '#000',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  signupText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default LoginScreen; 