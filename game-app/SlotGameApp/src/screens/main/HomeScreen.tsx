import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, ROUTES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Card from '../../components/Card';

interface GameCardProps {
  title: string;
  iconName: string;
  color: string;
  rating: number;
  tag: string;
  onPress: () => void;
}

/**
 * 遊戲卡片組件
 */
const GameCard: React.FC<GameCardProps> = ({ title, iconName, color, rating, tag, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.gameCard} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View 
        style={[
          styles.gameIconContainer, 
          { backgroundColor: color }
        ]}
      >
        <Ionicons name={iconName} size={30} color="white" />
      </View>
      <Text style={styles.gameTitle}>{title}</Text>
      <View style={styles.ratingContainer}>
        {Array(5).fill(0).map((_, index) => (
          <Ionicons 
            key={index}
            name={index < Math.floor(rating) ? 'star' : (index < rating ? 'star-half' : 'star-outline')}
            size={14}
            color={COLORS.accent}
            style={{ marginRight: 2 }}
          />
        ))}
        <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
      </View>
      <View style={styles.tagContainer}>
        <Text style={styles.tagText}>{tag}</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * 首頁頁面
 */
const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const navigateToGame = () => {
    navigation.navigate(ROUTES.GAME);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI 幸運老虎機</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>我的餘額</Text>
          <Text style={styles.balanceValue}>${user?.balance.toLocaleString()}</Text>
        </View>

        <View style={styles.jackpotCard}>
          <Text style={styles.jackpotLabel}>當前頭獎</Text>
          <Text style={styles.jackpotValue}>$10,000</Text>
        </View>

        <View style={styles.aiSuggestion}>
          <View style={styles.aiTitleContainer}>
            <Ionicons name="bulb-outline" size={18} color="white" style={{ marginRight: 5 }} />
            <Text style={styles.aiTitle}>AI 建議</Text>
          </View>
          <Text style={styles.aiMessage}>
            根據您的遊戲風格，我建議您嘗試「幸運七」遊戲。它與您的偏好匹配度高達85%！
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>熱門遊戲</Text>
        </View>

        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gameScrollView}
          contentContainerStyle={styles.gameScrollContent}
        >
          <GameCard 
            title="幸運七"
            iconName="diamond-outline"
            color={COLORS.primary}
            rating={4.5}
            tag="熱門"
            onPress={navigateToGame}
          />
          <GameCard 
            title="金幣樂園"
            iconName="wallet-outline"
            color={COLORS.secondary}
            rating={4.0}
            tag="新遊戲"
            onPress={navigateToGame}
          />
          <GameCard 
            title="水果派對"
            iconName="nutrition-outline"
            color="#F44336"
            rating={4.9}
            tag="高獎金"
            onPress={navigateToGame}
          />
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>為您推薦</Text>
        </View>

        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gameScrollView}
          contentContainerStyle={styles.gameScrollContent}
        >
          <GameCard 
            title="翡翠寶石"
            iconName="diamond-outline"
            color="#009688"
            rating={4.1}
            tag="85% 匹配"
            onPress={navigateToGame}
          />
          <GameCard 
            title="龍之財富"
            iconName="flame-outline"
            color="#FF5722"
            rating={3.5}
            tag="70% 匹配"
            onPress={navigateToGame}
          />
          <GameCard 
            title="月光寶盒"
            iconName="moon-outline"
            color="#3F51B5"
            rating={4.0}
            tag="65% 匹配"
            onPress={navigateToGame}
          />
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  notificationButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  jackpotCard: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  jackpotLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  jackpotValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  aiSuggestion: {
    marginTop: 16,
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 10,
  },
  aiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  aiMessage: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  gameScrollView: {
    marginTop: 8,
  },
  gameScrollContent: {
    paddingRight: 16,
  },
  gameCard: {
    width: 150,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gameIconContainer: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  tagContainer: {
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HomeScreen; 