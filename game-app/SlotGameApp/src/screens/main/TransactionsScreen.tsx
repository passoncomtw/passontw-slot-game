import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, ROUTES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Card from '../../components/Card';

// 定義導航參數類型
type RootStackParamList = {
  [key: string]: undefined;
};

type TransactionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 交易記錄類型定義
type Transaction = {
  id: string;
  type: 'deposit' | 'withdraw' | 'win' | 'lose';
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  gameTitle?: string;
  description?: string;
};

// 交易記錄篩選類型
type FilterType = 'all' | 'deposit' | 'withdraw' | 'win' | 'lose';

/**
 * 交易記錄頁面
 */
const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(false);

  // 模擬交易記錄資料
  const generateTransactions = (): Transaction[] => {
    const transactions: Transaction[] = [];
    
    // 添加存款記錄
    transactions.push({
      id: '1',
      type: 'deposit',
      amount: 100,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      status: 'completed',
      description: '信用卡充值'
    });
    
    transactions.push({
      id: '2',
      type: 'deposit',
      amount: 200,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: 'completed',
      description: '支付寶充值'
    });
    
    // 添加提款記錄
    transactions.push({
      id: '3',
      type: 'withdraw',
      amount: 75,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'completed',
      description: '銀行轉賬'
    });
    
    transactions.push({
      id: '4',
      type: 'withdraw',
      amount: 150,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'pending',
      description: '銀行轉賬'
    });
    
    // 添加遊戲記錄
    const gameNames = ['幸運七', '水果派對', '金幣樂園', '翡翠寶石', '財神到'];
    
    for (let i = 0; i < 20; i++) {
      const isWin = Math.random() > 0.6;
      const randomGame = gameNames[Math.floor(Math.random() * gameNames.length)];
      const randomAmount = Math.floor(Math.random() * 100) + 10;
      const randomDays = Math.floor(Math.random() * 30);
      const randomHours = Math.floor(Math.random() * 24);
      
      transactions.push({
        id: `game-${i+5}`,
        type: isWin ? 'win' : 'lose',
        amount: randomAmount,
        date: new Date(Date.now() - (randomDays * 24 * 60 * 60 * 1000) - (randomHours * 60 * 60 * 1000)),
        status: 'completed',
        gameTitle: randomGame
      });
    }
    
    // 按日期排序，最新的先顯示
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const transactions = generateTransactions();

  const navigateBack = () => {
    navigation.goBack();
  };

  // 根據當前篩選器過濾交易記錄
  const getFilteredTransactions = () => {
    if (activeFilter === 'all') {
      return transactions;
    }
    return transactions.filter(transaction => transaction.type === activeFilter);
  };

  // 根據日期分組交易記錄
  const groupTransactionsByDate = () => {
    const filteredTransactions = getFilteredTransactions();
    const groups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(transaction => {
      const dateKey = formatDateKey(transaction.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });
    
    return Object.entries(groups).map(([date, transactions]) => ({
      date,
      data: transactions,
    }));
  };

  // 格式化日期作為分組鍵
  const formatDateKey = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return '今天';
    }
    
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return '昨天';
    }
    
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 模擬加載更多數據
  const handleLoadMore = () => {
    setIsLoading(true);
    
    // 模擬網絡請求延遲
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  // 渲染交易記錄項目
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    let iconName = 'arrow-down';
    let iconColor = COLORS.success;
    let amountPrefix = '+';

    if (item.type === 'withdraw') {
      iconName = 'arrow-up';
      iconColor = COLORS.error;
      amountPrefix = '-';
    } else if (item.type === 'lose') {
      iconName = 'close-circle';
      iconColor = COLORS.error;
      amountPrefix = '-';
    } else if (item.type === 'win') {
      iconName = 'trophy';
      iconColor = COLORS.success;
    } else if (item.type === 'deposit') {
      iconName = 'cash';
    }

    return (
      <Card style={styles.transactionItem}>
        <View style={[styles.transactionIcon, { backgroundColor: iconColor }]}>
          <Ionicons name={iconName} size={18} color="white" />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionType}>
            {item.type === 'deposit' ? '充值' : 
             item.type === 'withdraw' ? '提現' : 
             item.type === 'win' ? `贏取 (${item.gameTitle})` : 
             `投注 (${item.gameTitle})`}
          </Text>
          {item.description && (
            <Text style={styles.transactionDescription}>{item.description}</Text>
          )}
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleString('zh-TW', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <View style={styles.transactionStatus}>
          <Text style={[
            styles.transactionAmount, 
            { color: amountPrefix === '+' ? COLORS.success : COLORS.error }
          ]}>
            {amountPrefix}${item.amount}
          </Text>
          <Text style={[
            styles.statusText, 
            { 
              color: item.status === 'completed' ? COLORS.success : 
                     item.status === 'pending' ? COLORS.warning : COLORS.error 
            }
          ]}>
            {item.status === 'completed' ? '已完成' : 
             item.status === 'pending' ? '處理中' : '失敗'}
          </Text>
        </View>
      </Card>
    );
  };

  // 渲染分組的頭部
  const renderSectionHeader = ({ section }: { section: { date: string; data: Transaction[] } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.date}</Text>
    </View>
  );

  // 渲染列表底部加載指示器
  const renderFooter = () => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loaderText}>加載更多...</Text>
      </View>
    );
  };

  // 渲染篩選按鈕
  const renderFilterButton = (type: FilterType, label: string, icon: string) => (
    <TouchableOpacity 
      style={[
        styles.filterButton,
        activeFilter === type && styles.activeFilterButton
      ]}
      onPress={() => setActiveFilter(type)}
    >
      <Ionicons 
        name={icon} 
        size={16} 
        color={activeFilter === type ? 'white' : '#666'} 
        style={styles.filterIcon}
      />
      <Text style={[
        styles.filterText,
        activeFilter === type && styles.activeFilterText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // 分組交易數據
  const groupedTransactions = groupTransactionsByDate();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>交易記錄</Text>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('all', '全部', 'list')}
        {renderFilterButton('deposit', '充值', 'cash')}
        {renderFilterButton('withdraw', '提現', 'arrow-up')}
        {renderFilterButton('win', '贏取', 'trophy')}
        {renderFilterButton('lose', '投注', 'close-circle')}
      </View>

      <FlatList
        data={groupedTransactions}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <View>
            <Text style={styles.dateHeader}>{item.date}</Text>
            {item.data.map((transaction) => (
              <View key={transaction.id}>
                {renderTransactionItem({ item: transaction })}
              </View>
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
    color: '#666',
  },
  sectionHeader: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  transactionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionStatus: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  statusText: {
    fontSize: 12,
  },
  loaderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default TransactionsScreen; 