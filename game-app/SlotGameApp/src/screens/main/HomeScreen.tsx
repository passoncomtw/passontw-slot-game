import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, ROUTES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// 定義導航參數類型
type RootStackParamList = {
  Game: undefined;
  GameDetail: { gameId: string };
  Wallet: undefined;
  Profile: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();

  const navigateToGame = () => {
    navigation.navigate('Game');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>幸運老虎機</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>我的餘額</Text>
          <Text style={styles.balanceValue}>
            ${user && user.balance ? user.balance : 0}
          </Text>
          <TouchableOpacity 
            style={styles.rechargeButton}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.rechargeButtonText}>儲值</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.jackpotCard}>
          <Text style={styles.jackpotLabel}>當前頭獎</Text>
          <Text style={styles.jackpotValue}>$10,000</Text>
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
            tag="推薦"
            onPress={navigateToGame}
          />
          <GameCard 
            title="龍之財富"
            iconName="flame-outline"
            color="#FF5722"
            rating={3.5}
            tag="推薦"
            onPress={navigateToGame}
          />
          <GameCard 
            title="月光寶盒"
            iconName="moon-outline"
            color="#3F51B5"
            rating={4.0}
            tag="推薦"
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.primary,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    marginHorizontal: 20,
  },
  gameScrollView: {
    marginTop: 8,
  },
  gameScrollContent: {
    paddingHorizontal: 16,
  },
  gameCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gameIconContainer: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 4,
  },
  tagContainer: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 10,
    color: '#666666',
  },
  categoryContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  gameContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  categoryScrollView: {
    paddingLeft: 5,
    paddingRight: 5,
  },
  categoryCard: {
    width: 140,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderRadius: 10,
  },
  categoryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  banner: {
    height: 150,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  rechargeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  rechargeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 