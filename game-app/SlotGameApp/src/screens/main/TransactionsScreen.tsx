import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../utils/constants';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchTransactionsRequest } from '../../store/slices/transactionSlice';
import { RootState } from '../../store/rootReducer';

// 定義導航參數類型
type RootStackParamList = {
  [key: string]: undefined;
};

type TransactionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 交易記錄類型定義
export type Transaction = {
  id: string;
  type: 'deposit' | 'withdraw' | 'win' | 'lose' | 'transfer';
  amount: number;
  date: string; // ISO 格式日期字符串
  status: 'completed' | 'pending' | 'failed';
  gameTitle?: string;
  description?: string;
};

// 過濾器類型
type FilterType = 'all' | 'deposit' | 'withdraw' | 'game';

// 日期分組類型
type GroupedTransactions = Record<string, Transaction[]>;

// 過濾器標籤組件
interface FilterTabsProps {
  options: { label: string; value: string }[];
  activeValue: string;
  onChange: (value: FilterType) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ options, activeValue, onChange }) => (
  <View style={styles.filterTabsContainer}>
    {options.map((option) => (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.filterTab,
          activeValue === option.value && styles.activeFilterTab
        ]}
        onPress={() => onChange(option.value as FilterType)}
      >
        <Text
          style={[
            styles.filterTabText,
            activeValue === option.value && styles.activeFilterTabText
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// 頁頭組件
interface HeaderProps {
  title: string;
  onBack: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Ionicons name="chevron-back" size={24} color="white" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

// 載入中狀態組件
const LoadingView: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>載入交易記錄中...</Text>
  </View>
);

// 錯誤狀態組件
interface ErrorViewProps {
  error: string;
  onRetry: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ error, onRetry }) => (
  <View style={styles.errorContainer}>
    <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
    <Text style={styles.errorText}>載入失敗</Text>
    <Text style={styles.errorSubtext}>{error}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>重試</Text>
    </TouchableOpacity>
  </View>
);

// 空數據狀態組件
interface EmptyViewProps {
  activeFilter: FilterType;
}

const EmptyView: React.FC<EmptyViewProps> = ({ activeFilter }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="document-text-outline" size={48} color="#999" />
    <Text style={styles.emptyText}>沒有交易記錄</Text>
    <Text style={styles.emptySubtext}>您目前沒有{
      activeFilter === 'deposit' ? '充值' : 
      activeFilter === 'withdraw' ? '提現' : 
      activeFilter === 'game' ? '遊戲' : ''
    }相關的交易記錄</Text>
  </View>
);

// 交易項目組件
interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  let iconName = 'arrow-down';
  let iconColor = COLORS.success;
  let amountPrefix = '+';

  if (transaction.type === 'withdraw') {
    iconName = 'arrow-up';
    iconColor = COLORS.error;
    amountPrefix = '-';
  } else if (transaction.type === 'lose') {
    iconName = 'close-circle';
    iconColor = COLORS.error;
    amountPrefix = '-';
  } else if (transaction.type === 'win') {
    iconName = 'trophy';
    iconColor = COLORS.success;
  } else if (transaction.type === 'deposit') {
    iconName = 'cash';
  } else if (transaction.type === 'transfer') {
    iconName = 'swap-horizontal';
    iconColor = COLORS.info;
  }

  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: iconColor }]}>
        <Ionicons name={iconName} size={18} color="white" />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>
          {transaction.type === 'deposit' ? '充值' : 
           transaction.type === 'withdraw' ? '提現' : 
           transaction.type === 'win' ? `贏取${transaction.gameTitle ? ` (${transaction.gameTitle})` : ''}` : 
           transaction.type === 'lose' ? `投注${transaction.gameTitle ? ` (${transaction.gameTitle})` : ''}` : 
           '轉賬'}
        </Text>
        <Text style={styles.transactionDescription}>
          {transaction.description || 
            (transaction.type === 'deposit' ? '在線充值' : 
             transaction.type === 'withdraw' ? '提現至銀行賬戶' : 
             transaction.type === 'win' || transaction.type === 'lose' ? `遊戲交易` : 
             '賬戶間轉賬')}
        </Text>
      </View>
      <View style={styles.transactionStatus}>
        <Text style={[
          styles.transactionAmount, 
          { color: amountPrefix === '+' ? COLORS.success : COLORS.error }
        ]}>
          {amountPrefix}${transaction.amount}
        </Text>
        <Text style={[
          styles.statusText, 
          { 
            color: transaction.status === 'completed' ? COLORS.success : 
                   transaction.status === 'pending' ? COLORS.warning : COLORS.error 
          }
        ]}>
          {transaction.status === 'completed' ? '已完成' : 
           transaction.status === 'pending' ? '處理中' : '失敗'}
        </Text>
      </View>
    </View>
  );
};

// 日期分組標題組件
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// 載入更多組件
const LoadMoreFooter: React.FC = () => (
  <View style={styles.loadMoreContainer}>
    <ActivityIndicator size="small" color={COLORS.primary} />
    <Text style={styles.loadMoreText}>載入更多...</Text>
  </View>
);

/**
 * 日期格式化函數
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '';
  }
  
  try {
    return date.toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    // 備用格式化方法
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  }
}

/**
 * 將交易記錄按日期分組
 */
function groupTransactionsByDate(transactions: Transaction[]): GroupedTransactions {
  console.log("🚀 ~ groupTransactionsByDate ~ transactions:", transactions)
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {};
  }
  
  return transactions.reduce((groups: GroupedTransactions, transaction: Transaction) => {
    if (!transaction.date) {
      return groups;
    }
    
    const dateKey = formatDate(transaction.date);
    console.log("🚀 ~ groupTransactionsByDate ~ dateKey:", dateKey)
    if (!dateKey) {
      return groups; // 跳過無效日期
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(transaction);
    return groups;
  }, {});
}

/**
 * 排序日期鍵值（最新的在最前面）
 */
function sortDateKeys(dateKeys: string[]): string[] {
  return dateKeys.sort((a, b) => {
    const dateA = new Date(a.replace(/年|月|日/g, ' ').trim());
    const dateB = new Date(b.replace(/年|月|日/g, ' ').trim());
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * 交易記錄頁面
 */
const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const dispatch = useAppDispatch();
  
  // 從 Redux 獲取交易記錄，確保提供默認值以避免 undefined 錯誤
  const state = useAppSelector((state: RootState) => {
    console.log("🚀 ~ state:", state)
    return state
  })
  const {transactions} = state;
  console.log("🚀 ~ transactions:", transactions)
  
  // 提取所需狀態並提供默認值
  const transactionData = transactions?.data || [];
  const isLoading = transactions?.isLoading || false;
  const error = transactions?.error || null;
  const hasMore = transactions?.hasMore || false;
  const currentPage = transactions?.page || 1;
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(currentPage);
  const [loadingMore, setLoadingMore] = useState(false);

  // 初次載入數據
  useEffect(() => {
    fetchTransactions(1);
  }, [activeFilter]);

  // 處理過濾器變更
  const handleFilterChange = (filterType: FilterType) => {
    if (filterType !== activeFilter) {
      setActiveFilter(filterType);
      setPage(1);
    }
  };

  // 獲取交易記錄的共用方法
  const fetchTransactions = useCallback((pageNum: number) => {
    const apiFilter = activeFilter === 'all' ? undefined : 
                      activeFilter === 'game' ? 'bet,win' : 
                      activeFilter;
    
    dispatch(fetchTransactionsRequest({ page: pageNum, limit: 20, filter: apiFilter }));
  }, [dispatch, activeFilter]);

  // 下拉刷新功能
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions(1);
  }, [fetchTransactions]);
  
  // 處理刷新狀態
  useEffect(() => {
    if (!isLoading && refreshing) {
      setRefreshing(false);
      setPage(1);
    }
  }, [isLoading, refreshing]);

  // 上拉加載更多
  const loadMoreTransactions = useCallback(() => {
    if (isLoading || loadingMore || !hasMore || !Array.isArray(transactionData)) {
      return;
    }
    
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage);
  }, [isLoading, loadingMore, hasMore, transactionData, page, fetchTransactions]);
  
  // 處理加載更多狀態
  useEffect(() => {
    if (!isLoading && loadingMore) {
      setLoadingMore(false);
    }
  }, [isLoading, loadingMore]);

  // 獲取已分組的交易記錄和排序後的日期
  const groupedTransactions = groupTransactionsByDate(transactionData);
  const sortedDateKeys = sortDateKeys(Object.keys(groupedTransactions));
  console.log("🚀 ~ groupedTransactions:", groupedTransactions)

  // 導航返回
  const navigateBack = () => {
    navigation.goBack();
  };

  // 渲染內容函數 - 使用 early return 模式
  const renderContent = () => {
    if (isLoading && !loadingMore && !refreshing) {
      return <LoadingView />;
    }
    
    if (error) {
      return <ErrorView error={error} onRetry={onRefresh} />;
    }
    
    console.log("🚀 ~ renderContent ~ sortedDateKeys:", sortedDateKeys)
     if (sortedDateKeys.length === 0) {
       return <EmptyView activeFilter={activeFilter} />;
     }
    
    return (
      <FlatList
        data={sortedDateKeys}
        keyExtractor={item => item}
        renderItem={({ item: dateKey }) => (
          <View>
            <SectionHeader title={dateKey} />
            {groupedTransactions[dateKey].map(transaction => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={loadMoreTransactions}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.flatListContent}
        ListFooterComponent={loadingMore ? <LoadMoreFooter /> : null}
        ListEmptyComponent={<EmptyView activeFilter={activeFilter} />}
      />
    );
  };

  // 主渲染函數
  return (
    <SafeAreaView style={styles.container}>
      <Header title="交易記錄" onBack={navigateBack} />

      <View style={styles.filterContainer}>
        <FilterTabs
          options={[
            { label: '全部', value: 'all' },
            { label: '充值', value: 'deposit' },
            { label: '提現', value: 'withdraw' },
            { label: '遊戲', value: 'game' }
          ]}
          activeValue={activeFilter}
          onChange={handleFilterChange}
        />
      </View>

      {renderContent()}
    </SafeAreaView>
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
    flex: 1,
    textAlign: 'center',
    marginRight: 30, // 為了平衡 backButton 的空間
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterContainer: {
    marginVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 12,
  },
  filterTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterTabText: {
    color: 'white',
    fontWeight: '500',
  },
  sectionHeader: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
  },
  transactionStatus: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginVertical: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.primary,
  },
  flatListContent: {
    padding: 16,
  },
});

export default TransactionsScreen; 