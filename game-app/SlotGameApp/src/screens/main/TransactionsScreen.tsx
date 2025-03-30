import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useAuth } from '../../context/AuthContext';
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

/**
 * 交易記錄頁面
 */
const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  
  // 從 Redux 獲取交易記錄
  const transactions = useAppSelector((state: RootState) => state.transactions);
  const { data: transactionData = [], isLoading = false, error = null, hasMore = false } = transactions || { data: [], isLoading: false, error: null, hasMore: false };
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // 初次載入數據
  useEffect(() => {
    dispatch(fetchTransactionsRequest({ page: 1, limit: 20 }));
  }, [dispatch]);

  // 下拉刷新功能
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchTransactionsRequest({ page: 1, limit: 20 }));
  }, [dispatch]);
  
  // 處理刷新狀態
  useEffect(() => {
    if (!isLoading && refreshing) {
      setRefreshing(false);
      setPage(1);
    }
  }, [isLoading, refreshing]);

  // 上拉加載更多
  const loadMoreTransactions = useCallback(() => {
    if (isLoading || loadingMore || !hasMore || !transactionData || transactionData.length < 20) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    
    dispatch(fetchTransactionsRequest({ page: nextPage, limit: 20 }));
  }, [dispatch, isLoading, loadingMore, page, transactionData, hasMore]);
  
  // 處理加載更多狀態
  useEffect(() => {
    if (!isLoading && loadingMore) {
      setLoadingMore(false);
    }
  }, [isLoading, loadingMore]);

  // 過濾交易記錄
  const filteredTransactions = useMemo(() => {
    if (!transactionData || !Array.isArray(transactionData)) return [];
    
    if (activeFilter === 'all') return transactionData;
    
    if (activeFilter === 'deposit') {
      return transactionData.filter((tx: Transaction) => tx.type === 'deposit');
    }
    
    if (activeFilter === 'withdraw') {
      return transactionData.filter((tx: Transaction) => tx.type === 'withdraw');
    }
    
    if (activeFilter === 'game') {
      return transactionData.filter((tx: Transaction) => tx.type === 'win' || tx.type === 'lose');
    }
    
    return transactionData;
  }, [transactionData, activeFilter]);

  // 根據日期分組交易記錄
  const groupedTransactions = useMemo(() => {
    if (!filteredTransactions.length) return {};
    
    return filteredTransactions.reduce((groups: Record<string, Transaction[]>, transaction: Transaction) => {
      const date = new Date(transaction.date);
      const dateKey = date.toLocaleDateString('zh-TW', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(transaction);
      return groups;
    }, {});
  }, [filteredTransactions]);

  // 導航返回
  const navigateBack = () => {
    navigation.goBack();
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
    } else if (item.type === 'transfer') {
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
            {item.type === 'deposit' ? '充值' : 
             item.type === 'withdraw' ? '提現' : 
             item.type === 'win' ? `贏取${item.gameTitle ? ` (${item.gameTitle})` : ''}` : 
             item.type === 'lose' ? `投注${item.gameTitle ? ` (${item.gameTitle})` : ''}` : 
             '轉賬'}
          </Text>
          <Text style={styles.transactionDescription}>
            {item.description || 
              (item.type === 'deposit' ? '在線充值' : 
               item.type === 'withdraw' ? '提現至銀行賬戶' : 
               item.type === 'win' || item.type === 'lose' ? `遊戲交易` : 
               '賬戶間轉賬')}
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
      </View>
    );
  };

  // 渲染交易記錄分組標題
  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // 渲染分組後的列表
  const renderGroupedList = () => {
    const groupKeys = Object.keys(groupedTransactions);
    
    // 按日期排序（最新的日期在前）
    groupKeys.sort((a, b) => {
      const dateA = new Date(a.replace(/年|月|日/g, ' ').trim());
      const dateB = new Date(b.replace(/年|月|日/g, ' ').trim());
      return dateB.getTime() - dateA.getTime();
    });
    
    return (
      <FlatList
        data={groupKeys}
        keyExtractor={item => item}
        renderItem={({ item: dateKey }) => (
          <View>
            {renderSectionHeader(dateKey)}
            {groupedTransactions[dateKey].map(transaction => (
              <View key={transaction.id}>
                {renderTransactionItem({ item: transaction })}
              </View>
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
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>暫無交易記錄</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.footerLoaderText}>載入更多...</Text>
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>交易記錄</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollableFilter
          options={[
            { label: '全部', value: 'all' },
            { label: '充值', value: 'deposit' },
            { label: '提現', value: 'withdraw' },
            { label: '遊戲交易', value: 'game' }
          ]}
          activeValue={activeFilter}
          onChange={(value: FilterType) => setActiveFilter(value)}
        />
      </View>

      {isLoading && !refreshing && !loadingMore ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>加載失敗，請稍後重試</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>重試</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderGroupedList()
      )}
    </SafeAreaView>
  );
};

// 可滾動的過濾器組件
type ScrollableFilterProps = {
  options: { label: string; value: string }[];
  activeValue: string;
  onChange: (value: FilterType) => void;
};

const ScrollableFilter: React.FC<ScrollableFilterProps> = ({ options, activeValue, onChange }) => {
  return (
    <View style={styles.scrollableFilter}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.filterOption,
            activeValue === option.value && styles.activeFilterOption
          ]}
          onPress={() => onChange(option.value as FilterType)}
        >
          <Text
            style={[
              styles.filterOptionText,
              activeValue === option.value && styles.activeFilterOptionText
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
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
    paddingTop: 10,
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
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollableFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterOption: {
    backgroundColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterOptionText: {
    color: 'white',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerLoaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default TransactionsScreen; 