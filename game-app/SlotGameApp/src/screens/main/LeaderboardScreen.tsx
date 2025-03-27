import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ScrollView
} from 'react-native';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// 排行榜數據模擬
const leaderboardData = [
  { id: '1', name: '王大明', amount: 25000, vipLevel: 5 },
  { id: '2', name: '李小華', amount: 12500, vipLevel: 4 },
  { id: '3', name: '陳小紅', amount: 8300, vipLevel: 3 },
  { id: '4', name: '趙子龍', amount: 5200, vipLevel: 3 },
  { id: '5', name: '周小玲', amount: 4800, vipLevel: 2 },
  { id: '6', name: '張三豐', amount: 3900, vipLevel: 3 },
  { id: '7', name: '劉德華', amount: 3500, vipLevel: 4 },
  { id: '8', name: '張小明', amount: 3000, vipLevel: 2 },
];

// 標籤類型
type TabType = 'winners' | 'richest' | 'active';

/**
 * 排行榜頁面
 */
const LeaderboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('winners');
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>排行榜</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'winners' && styles.activeTabButton]}
          onPress={() => setActiveTab('winners')}
        >
          <Text style={[styles.tabText, activeTab === 'winners' && styles.activeTabText]}>
            贏家榜
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'richest' && styles.activeTabButton]}
          onPress={() => setActiveTab('richest')}
        >
          <Text style={[styles.tabText, activeTab === 'richest' && styles.activeTabText]}>
            富豪榜
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.activeTabButton]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            活躍榜
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.topRankContainer}>
          {/* 第二名 */}
          <View style={styles.secondRankContainer}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>2</Text>
            </View>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={30} color="#666" />
            </View>
            <Text style={styles.rankName}>{leaderboardData[1].name}</Text>
            <Text style={styles.rankAmount}>${leaderboardData[1].amount.toLocaleString()}</Text>
          </View>

          {/* 第一名 */}
          <View style={styles.firstRankContainer}>
            <View style={[styles.rankBadge, styles.firstRankBadge]}>
              <Text style={styles.rankText}>1</Text>
            </View>
            <View style={[styles.avatarContainer, styles.firstRankAvatar]}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
            <Text style={styles.rankName}>{leaderboardData[0].name}</Text>
            <Text style={styles.rankAmount}>${leaderboardData[0].amount.toLocaleString()}</Text>
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>VIP {leaderboardData[0].vipLevel}</Text>
            </View>
          </View>

          {/* 第三名 */}
          <View style={styles.thirdRankContainer}>
            <View style={[styles.rankBadge, styles.thirdRankBadge]}>
              <Text style={styles.rankText}>3</Text>
            </View>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={30} color="#666" />
            </View>
            <Text style={styles.rankName}>{leaderboardData[2].name}</Text>
            <Text style={styles.rankAmount}>${leaderboardData[2].amount.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.listContainer}>
          {leaderboardData.slice(3).map((item, index) => (
            <View key={item.id} style={styles.listItem}>
              <View style={styles.listRankContainer}>
                <Text style={styles.listRankText}>{index + 4}</Text>
              </View>
              <View style={styles.listAvatarContainer}>
                <Ionicons name="person" size={20} color="#666" />
              </View>
              <View style={styles.listInfoContainer}>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.listVipText}>VIP {item.vipLevel}</Text>
              </View>
              <Text style={styles.listAmount}>${item.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.userRankCard}>
          <Text style={styles.userRankTitle}>您的排名</Text>
          <View style={styles.userRankContent}>
            <View style={[styles.rankBadge, styles.userRankBadge]}>
              <Text style={styles.rankText}>42</Text>
            </View>
            <View style={styles.listAvatarContainer}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
            <View style={styles.listInfoContainer}>
              <Text style={styles.listName}>張小明 (您)</Text>
              <Text style={styles.listVipText}>VIP {user?.vipLevel || 2}</Text>
            </View>
            <Text style={styles.listAmount}>${user?.balance.toLocaleString() || 1000}</Text>
          </View>
          <View style={styles.nextRankContainer}>
            <Text>距離上一名還差：</Text>
            <Text style={styles.nextRankAmount}>$120</Text>
          </View>
        </View>

        <View style={styles.rewardCard}>
          <View style={styles.rewardHeader}>
            <Ionicons name="trophy" size={24} color="gold" style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.rewardTitle}>排行榜獎勵</Text>
              <Text style={styles.rewardSubtitle}>每週更新</Text>
            </View>
          </View>
          <View style={styles.rewardItem}>
            <Text>第1名：</Text>
            <Text style={styles.rewardValue}>$1,000 + 500積分</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text>第2名：</Text>
            <Text style={styles.rewardValue}>$500 + 300積分</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text>第3名：</Text>
            <Text style={styles.rewardValue}>$200 + 200積分</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text>第4-10名：</Text>
            <Text style={styles.rewardValue}>$100 + 100積分</Text>
          </View>
        </View>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  topRankContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
  },
  firstRankContainer: {
    alignItems: 'center',
    marginTop: -20,
  },
  secondRankContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  thirdRankContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  rankBadge: {
    width: 25,
    height: 25,
    borderRadius: 50,
    backgroundColor: 'silver',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  firstRankBadge: {
    width: 30,
    height: 30,
    backgroundColor: 'gold',
  },
  thirdRankBadge: {
    backgroundColor: '#cd7f32',
  },
  rankText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  firstRankAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'gold',
  },
  rankName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  rankAmount: {
    fontSize: 12,
    color: COLORS.accent,
  },
  vipBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginTop: 5,
  },
  vipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  listContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listRankContainer: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  listRankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  listInfoContainer: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: '500',
  },
  listVipText: {
    fontSize: 12,
    color: '#999',
  },
  listAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  userRankCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  userRankTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  userRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userRankBadge: {
    backgroundColor: COLORS.primary,
  },
  nextRankContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 5,
  },
  nextRankAmount: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  rewardCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rewardSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rewardValue: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});

export default LeaderboardScreen; 