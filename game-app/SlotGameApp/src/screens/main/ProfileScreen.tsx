import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, ROUTES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * 個人資料頁面
 */
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const navigateToSettings = () => {
    navigation.navigate(ROUTES.SETTINGS);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>個人資料</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={navigateToSettings}>
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.vipLevel}>VIP {user?.vipLevel} 級會員</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${user?.balance.toLocaleString()}</Text>
              <Text style={styles.statLabel}>餘額</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.points}</Text>
              <Text style={styles.statLabel}>積分</Text>
            </View>
          </View>
        </View>

        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>我的數據</Text>
          <View style={styles.statsRow}>
            <View style={styles.statsRowItem}>
              <Text style={[styles.statsRowValue, { color: COLORS.primary }]}>45</Text>
              <Text style={styles.statsRowLabel}>遊戲次數</Text>
            </View>
            <View style={styles.statsRowItem}>
              <Text style={[styles.statsRowValue, { color: COLORS.accent }]}>$350</Text>
              <Text style={styles.statsRowLabel}>總贏金</Text>
            </View>
            <View style={styles.statsRowItem}>
              <Text style={[styles.statsRowValue, { color: COLORS.success }]}>35%</Text>
              <Text style={styles.statsRowLabel}>中獎率</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.favoritesCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>我的收藏</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.favoritesContainer}>
            <View style={styles.favoriteItem}>
              <View style={[styles.favoriteIcon, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="diamond-outline" size={20} color="white" />
              </View>
              <Text style={styles.favoriteLabel}>幸運七</Text>
            </View>
            <View style={styles.favoriteItem}>
              <View style={[styles.favoriteIcon, { backgroundColor: '#F44336' }]}>
                <Ionicons name="flame-outline" size={20} color="white" />
              </View>
              <Text style={styles.favoriteLabel}>水果派對</Text>
            </View>
            <View style={styles.favoriteItem}>
              <View style={[styles.favoriteIcon, { backgroundColor: '#009688' }]}>
                <Ionicons name="leaf-outline" size={20} color="white" />
              </View>
              <Text style={styles.favoriteLabel}>翡翠寶石</Text>
            </View>
            <View style={styles.favoriteItem}>
              <View style={[styles.favoriteIcon, { backgroundColor: '#ddd' }]}>
                <Ionicons name="add" size={20} color="#666" />
              </View>
              <Text style={styles.favoriteLabel}>添加</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.aiAnalysisCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="analytics-outline" size={24} color={COLORS.primary} style={styles.aiIcon} />
            <View>
              <Text style={styles.aiTitle}>個人遊戲風格分析</Text>
              <Text style={styles.aiSubtitle}>根據您的遊戲習慣分析</Text>
            </View>
          </View>
          <View style={styles.aiContent}>
            <Text style={styles.aiLabel}>風險偏好</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '70%' }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>保守</Text>
              <Text style={styles.progressLabel}>適中</Text>
              <Text style={styles.progressLabel}>激進</Text>
            </View>
            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationLabel}>最適合您的遊戲：</Text>
              <View style={styles.tagsContainer}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>幸運七</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>金幣樂園</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>翡翠寶石</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        <Card style={styles.recentHistoryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>最近記錄</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyItem}>
            <View style={[styles.historyIcon, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="diamond-outline" size={20} color="white" />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle}>幸運七</Text>
              <Text style={styles.historyTime}>10:15 AM</Text>
            </View>
            <Text style={styles.historyWin}>+$50</Text>
          </View>
          <View style={styles.historyItem}>
            <View style={[styles.historyIcon, { backgroundColor: '#F44336' }]}>
              <Ionicons name="flame-outline" size={20} color="white" />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle}>水果派對</Text>
              <Text style={styles.historyTime}>昨天 15:30</Text>
            </View>
            <Text style={styles.historyLoss}>-$20</Text>
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  settingsButton: {
    position: 'absolute',
    right: 16,
    top: 50,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingBottom: 30,
    marginBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  vipLevel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '80%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRowItem: {
    alignItems: 'center',
  },
  statsRowValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsRowLabel: {
    fontSize: 12,
    color: '#666',
  },
  favoritesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  favoritesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  favoriteItem: {
    alignItems: 'center',
    width: '25%',
  },
  favoriteIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  favoriteLabel: {
    fontSize: 12,
    color: '#333',
  },
  aiAnalysisCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  aiIcon: {
    marginRight: 10,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  aiContent: {
    backgroundColor: 'rgba(98, 0, 234, 0.05)',
    borderRadius: 10,
    padding: 15,
  },
  aiLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  recommendationsContainer: {
    marginTop: 10,
  },
  recommendationLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tag: {
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
  },
  recentHistoryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
  },
  historyWin: {
    color: COLORS.success,
    fontWeight: '600',
  },
  historyLoss: {
    color: COLORS.error,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ProfileScreen; 