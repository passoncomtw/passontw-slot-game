import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, ROUTES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Card from '../../components/Card';

// 交易記錄類型定義
type Transaction = {
  id: string;
  type: 'deposit' | 'withdraw' | 'win' | 'lose';
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  gameTitle?: string;
};

// 定義導航參數類型
type RootStackParamList = {
  [key: string]: undefined;
};

type WalletScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * 錢包頁面
 */
const WalletScreen: React.FC = () => {
  const navigation = useNavigation<WalletScreenNavigationProp>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'balance' | 'deposit' | 'withdraw'>('balance');
  const [amount, setAmount] = useState('');

  // 模擬交易記錄
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'deposit',
      amount: 100,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'completed'
    },
    {
      id: '2',
      type: 'win',
      amount: 50,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'completed',
      gameTitle: '幸運七'
    },
    {
      id: '3',
      type: 'lose',
      amount: 30,
      date: new Date(Date.now() - 12 * 60 * 60 * 1000),
      status: 'completed',
      gameTitle: '水果派對'
    },
    {
      id: '4',
      type: 'withdraw',
      amount: 75,
      date: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'pending'
    }
  ];

  const navigateBack = () => {
    navigation.goBack();
  };

  const handleDeposit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('錯誤', '請輸入有效金額');
      return;
    }

    Alert.alert('充值', `您確定要充值 $${amount} 嗎？`, [
      {
        text: '取消',
        style: 'cancel'
      },
      {
        text: '確認',
        onPress: () => {
          Alert.alert('成功', `充值 $${amount} 已提交，等待處理。`);
          setAmount('');
        }
      }
    ]);
  };

  const handleWithdraw = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('錯誤', '請輸入有效金額');
      return;
    }

    if (user?.balance && Number(amount) > user.balance) {
      Alert.alert('錯誤', '提現金額不能超過餘額');
      return;
    }

    Alert.alert('提現', `您確定要提現 $${amount} 嗎？`, [
      {
        text: '取消',
        style: 'cancel'
      },
      {
        text: '確認',
        onPress: () => {
          Alert.alert('成功', `提現 $${amount} 已提交，等待處理。`);
          setAmount('');
        }
      }
    ]);
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
      <View style={styles.transactionItem}>
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
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleString('zh-TW', {
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
      </View>
    );
  };

  // 渲染用戶餘額頁面
  const renderBalanceTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>當前餘額</Text>
        <Text style={styles.balanceAmount}>${user?.balance || 0}</Text>
        <Text style={styles.balanceUpdateTime}>最後更新: {new Date().toLocaleString('zh-TW')}</Text>
      </Card>
      
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => setActiveTab('deposit')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success }]}>
            <Ionicons name="add" size={24} color="white" />
          </View>
          <Text style={styles.quickActionText}>充值</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => setActiveTab('withdraw')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: COLORS.accent }]}>
            <Ionicons name="arrow-down" size={24} color="white" />
          </View>
          <Text style={styles.quickActionText}>提現</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate(ROUTES.TRANSACTIONS)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: COLORS.info }]}>
            <Ionicons name="time" size={24} color="white" />
          </View>
          <Text style={styles.quickActionText}>交易記錄</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.transactionsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近交易</Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.TRANSACTIONS)}>
            <Text style={styles.viewAllText}>查看全部</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          style={styles.transactionsList}
        />
      </View>
    </View>
  );

  // 渲染充值頁面
  const renderDepositTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>充值金額</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="輸入金額"
          keyboardType="numeric"
        />
        <Text style={styles.formHelp}>最低充值金額: $10</Text>
        
        <View style={styles.quickAmounts}>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => setAmount('50')}
          >
            <Text style={styles.quickAmountText}>$50</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => setAmount('100')}
          >
            <Text style={styles.quickAmountText}>$100</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => setAmount('200')}
          >
            <Text style={styles.quickAmountText}>$200</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleDeposit}
        >
          <Text style={styles.submitButtonText}>確認充值</Text>
        </TouchableOpacity>
      </Card>
    </View>
  );

  // 渲染提現頁面
  const renderWithdrawTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>提現金額</Text>
        <Text style={styles.balanceInfo}>可提現餘額: ${user?.balance || 0}</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="輸入金額"
          keyboardType="numeric"
        />
        <Text style={styles.formHelp}>最低提現金額: $20</Text>
        
        <View style={styles.quickAmounts}>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => setAmount('50')}
          >
            <Text style={styles.quickAmountText}>$50</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => setAmount('100')}
          >
            <Text style={styles.quickAmountText}>$100</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => {
              if (user?.balance) {
                setAmount(user.balance.toString());
              }
            }}
          >
            <Text style={styles.quickAmountText}>全部</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleWithdraw}
        >
          <Text style={styles.submitButtonText}>確認提現</Text>
        </TouchableOpacity>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的錢包</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'balance' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('balance')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'balance' && styles.activeTabButtonText
          ]}>
            餘額
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'deposit' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('deposit')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'deposit' && styles.activeTabButtonText
          ]}>
            充值
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'withdraw' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('withdraw')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'withdraw' && styles.activeTabButtonText
          ]}>
            提現
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'balance' && renderBalanceTab()}
        {activeTab === 'deposit' && renderDepositTab()}
        {activeTab === 'withdraw' && renderWithdrawTab()}
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
  content: {
    flex: 1,
  },
  tabBar: {
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
  tabButtonText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  balanceCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  balanceUpdateTime: {
    fontSize: 12,
    color: '#999',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  quickActionButton: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
  },
  transactionsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  transactionsList: {
    marginTop: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  formCard: {
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  balanceInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  amountInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  formHelp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAmountButton: {
    width: '30%',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WalletScreen; 