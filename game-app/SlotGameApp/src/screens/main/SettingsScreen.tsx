import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Switch
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { COLORS, ROUTES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Card from '../../components/Card';

/**
 * 設置頁面
 */
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<typeof ROUTES>>();
  const { logout } = useAuth();
  
  // 設置狀態
  const [settings, setSettings] = useState({
    sound: true,
    music: true,
    vibration: false,
    highQuality: true,
    aiAssistant: true,
    gameRecommendation: true,
    dataCollection: true
  });

  const toggleSetting = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const navigateBack = () => {
    navigation.goBack();
  };

  const navigateToScreen = (route: string) => {
    navigation.navigate(route as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>設置</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>賬戶設置</Text>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => navigateToScreen(ROUTES.PROFILE)}
          >
            <Text style={styles.settingLabel}>個人資料</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => alert("change password")}
            // onPress={() => navigateToScreen(ROUTES.CHANGE_PASSWORD)}
          >
            <Text style={styles.settingLabel}>更改密碼</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.noBorder]} 
            onPress={() => alert("payment methods")}
            // onPress={() => navigateToScreen(ROUTES.PAYMENT_METHODS)}
          >
            <Text style={styles.settingLabel}>支付方式</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>遊戲設置</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>音效</Text>
            <Switch
              trackColor={{ false: "#767577", true: COLORS.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleSetting('sound')}
              value={settings.sound}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>音樂</Text>
            <Switch
              trackColor={{ false: "#767577", true: COLORS.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleSetting('music')}
              value={settings.music}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>振動</Text>
            <Switch
              trackColor={{ false: "#767577", true: COLORS.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleSetting('vibration')}
              value={settings.vibration}
            />
          </View>
          
          <View style={[styles.settingItem, styles.noBorder]}>
            <Text style={styles.settingLabel}>高畫質</Text>
            <Switch
              trackColor={{ false: "#767577", true: COLORS.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleSetting('highQuality')}
              value={settings.highQuality}
            />
          </View>
        </Card>
        
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>AI 設置</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>AI 助手</Text>
            <Switch
              trackColor={{ false: "#767577", true: COLORS.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleSetting('aiAssistant')}
              value={settings.aiAssistant}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>遊戲推薦</Text>
            <Switch
              trackColor={{ false: "#767577", true: COLORS.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleSetting('gameRecommendation')}
              value={settings.gameRecommendation}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>數據收集</Text>
            <Switch
              trackColor={{ false: "#767577", true: COLORS.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleSetting('dataCollection')}
              value={settings.dataCollection}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.noBorder]} 
            onPress={() => navigateToScreen(ROUTES.AI_ASSISTANT)}
          >
            <Text style={styles.settingLabel}>AI 分析報告</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>其他</Text>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => alert("about us")}
            // onPress={() => navigateToScreen(ROUTES.ABOUT_US)}
          >
            <Text style={styles.settingLabel}>關於我們</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => alert("help center")}
            // onPress={() => navigateToScreen(ROUTES.HELP_CENTER)}
          >
            <Text style={styles.settingLabel}>幫助中心</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => alert("privacy policy")}
            // onPress={() => navigateToScreen(ROUTES.PRIVACY_POLICY)}
          >
            <Text style={styles.settingLabel}>隱私政策</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <View style={[styles.settingItem, styles.noBorder]}>
            <Text style={styles.settingLabel}>應用版本</Text>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </Card>
        
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>登出</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    borderRadius: 5,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen; 