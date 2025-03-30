import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  depositRequest, 
  fetchBalanceRequest, 
  fetchTransactionsRequest,
  resetDeposit, 
  resetWithdraw, 
  withdrawRequest 
} from '../../store/slices/walletSlice';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Card from '../../components/Card';

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
  const dispatch = useAppDispatch();
  
  // 從 Redux 獲取錢包狀態
  const { 
    balance: { data: walletData, isLoading: balanceLoading, error: balanceError },
    deposit: { isLoading: depositLoading, success: depositSuccess, error: depositError },
    withdraw: { isLoading: withdrawLoading, success: withdrawSuccess, error: withdrawError },
    transactions: { data: transactionsData, isLoading: transactionsLoading, error: transactionsError }
  } = useAppSelector(state => state.wallet);
  
  const [activeTab, setActiveTab] = useState<'balance' | 'deposit' | 'withdraw'>('balance');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('credit_card'); // 'credit_card', 'bank_transfer', 'e_wallet'
  const [bankAccount, setBankAccount] = useState('');

  // 在組件掛載時獲取餘額和交易紀錄
  useEffect(() => {
    dispatch(fetchBalanceRequest());
    dispatch(fetchTransactionsRequest({
      page: 1,
      page_size: 20
    }));
  }, [dispatch]);

  // 處理存款/提款結果
  useEffect(() => {
    if (depositSuccess) {
      Alert.alert('充值成功', '您的餘額已更新。');
      setAmount('');
      setActiveTab('balance');
      dispatch(resetDeposit()); // 重置存款狀態
      dispatch(fetchBalanceRequest()); // 刷新餘額
    }
    
    if (withdrawSuccess) {
      Alert.alert('提現成功', '您的提現申請已提交，等待處理。');
      setAmount('');
      setBankAccount('');
      setActiveTab('balance');
      dispatch(resetWithdraw()); // 重置提款狀態
      dispatch(fetchBalanceRequest()); // 刷新餘額
    }
    
    if (depositError) {
      Alert.alert('充值失敗', depositError);
      dispatch(resetDeposit());
    }
    
    if (withdrawError) {
      Alert.alert('提現失敗', withdrawError);
      dispatch(resetWithdraw());
    }
  }, [depositSuccess, withdrawSuccess, depositError, withdrawError, dispatch]);

  const navigateBack = () => {
    navigation.goBack();
  };

  const handleDeposit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('錯誤', '請輸入有效金額');
      return;
    }

    const amountNumber = Number(amount);
    if (amountNumber < 10) {
      Alert.alert('錯誤', '最低充值金額為 $10');
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
          dispatch(depositRequest({
            amount: amountNumber,
            payment_type: paymentType
          }));
        }
      }
    ]);
  };

  const handleWithdraw = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('錯誤', '請輸入有效金額');
      return;
    }

    const amountNumber = Number(amount);
    if (amountNumber < 20) {
      Alert.alert('錯誤', '最低提現金額為 $20');
      return;
    }

    const currentBalance = walletData?.balance || 0;
    if (amountNumber > currentBalance) {
      Alert.alert('錯誤', '提現金額不能超過餘額');
      return;
    }

    if (!bankAccount.trim()) {
      Alert.alert('錯誤', '請輸入銀行帳號');
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
          dispatch(withdrawRequest({
            amount: amountNumber,
            bank_account: bankAccount,
            bank_code: "123", // 預設銀行代碼
            account_name: user?.username || "用戶" // 預設帳戶名稱
          }));
        }
      }
    ]);
  };

  // 渲染交易記錄項目
  const renderTransactionItem = ({ item }: { item: any }) => {
    let iconName = 'arrow-down';
    let iconColor = COLORS.success;
    let amountPrefix = '+';

    if (item.type === 'withdraw') {
      iconName = 'arrow-up';
      iconColor = COLORS.error;
      amountPrefix = '-';
    } else if (item.type === 'bet') {
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
             item.type === 'win' ? `贏取 (${item.game_title || '遊戲'})` : 
             `投注 (${item.game_title || '遊戲'})`}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.created_at).toLocaleString('zh-TW', {
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
            styles.transactionStatusText,
            { 
              color: 
                item.status === 'completed' ? COLORS.success : 
                item.status === 'pending' ? COLORS.warning : 
                COLORS.error 
            }
          ]}>
            {item.status === 'completed' ? '已完成' : 
             item.status === 'pending' ? '處理中' : 
             '失敗'}
          </Text>
        </View>
      </View>
    );
  };

  // 渲染用戶餘額頁面
  const renderBalanceTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>我的餘額</Text>
        {balanceLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <Text style={styles.balanceValue}>
            ${walletData?.balance?.toFixed(2) || '0.00'}
          </Text>
        )}
      </Card>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, {backgroundColor: COLORS.success}]}
          onPress={() => setActiveTab('deposit')}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.actionButtonText}>充值</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, {backgroundColor: COLORS.warning}]}
          onPress={() => setActiveTab('withdraw')}
        >
          <Ionicons name="cash" size={24} color="white" />
          <Text style={styles.actionButtonText}>提現</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>最近交易</Text>
        
        {transactionsLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : transactionsData?.transactions && transactionsData.transactions.length > 0 ? (
          <FlatList
            data={transactionsData.transactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.transaction_id}
            style={styles.transactionsList}
            refreshControl={
              <RefreshControl
                refreshing={transactionsLoading}
                onRefresh={() => dispatch(fetchTransactionsRequest({
                  page: 1,
                  page_size: 20
                }))}
              />
            }
          />
        ) : (
          <Text style={styles.noTransactionsText}>沒有交易記錄1111</Text>
        )}
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
          editable={!depositLoading}
        />
        <Text style={styles.formHelp}>最低充值金額: $10</Text>
        
        <View style={styles.paymentMethodContainer}>
          <Text style={styles.paymentMethodTitle}>選擇支付方式</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity 
              style={[
                styles.paymentOption, 
                paymentType === 'credit_card' && styles.selectedPaymentOption
              ]}
              onPress={() => setPaymentType('credit_card')}
              disabled={depositLoading}
            >
              <Ionicons 
                name="card-outline" 
                size={24} 
                color={paymentType === 'credit_card' ? COLORS.primary : '#666'} 
              />
              <Text style={[
                styles.paymentOptionText,
                paymentType === 'credit_card' && styles.selectedPaymentOptionText
              ]}>信用卡</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.paymentOption, 
                paymentType === 'bank_transfer' && styles.selectedPaymentOption
              ]}
              onPress={() => setPaymentType('bank_transfer')}
              disabled={depositLoading}
            >
              <Ionicons 
                name="business-outline" 
                size={24} 
                color={paymentType === 'bank_transfer' ? COLORS.primary : '#666'} 
              />
              <Text style={[
                styles.paymentOptionText,
                paymentType === 'bank_transfer' && styles.selectedPaymentOptionText
              ]}>銀行轉賬</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.paymentOption, 
                paymentType === 'e_wallet' && styles.selectedPaymentOption
              ]}
              onPress={() => setPaymentType('e_wallet')}
              disabled={depositLoading}
            >
              <Ionicons 
                name="wallet-outline" 
                size={24} 
                color={paymentType === 'e_wallet' ? COLORS.primary : '#666'} 
              />
              <Text style={[
                styles.paymentOptionText,
                paymentType === 'e_wallet' && styles.selectedPaymentOptionText
              ]}>電子錢包</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.quickAmounts}>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => setAmount('50')}
            disabled={depositLoading}
          >
            <Text style={styles.quickAmountText}>$50</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => setAmount('100')}
            disabled={depositLoading}
          >
            <Text style={styles.quickAmountText}>$100</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => setAmount('200')}
            disabled={depositLoading}
          >
            <Text style={styles.quickAmountText}>$200</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.submitButton, depositLoading && styles.disabledButton]}
          onPress={handleDeposit}
          disabled={depositLoading}
        >
          {depositLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>確認充值</Text>
          )}
        </TouchableOpacity>
      </Card>
    </View>
  );

  // 渲染提現頁面
  const renderWithdrawTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>提現金額</Text>
        <Text style={styles.balanceInfo}>可提現餘額: ${walletData?.balance || 0}</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="輸入金額"
          keyboardType="numeric"
          editable={!withdrawLoading}
        />
        <Text style={styles.formHelp}>最低提現金額: $20</Text>
        
        <Text style={styles.inputLabel}>銀行帳號</Text>
        <TextInput
          style={styles.amountInput}
          value={bankAccount}
          onChangeText={setBankAccount}
          placeholder="輸入您的銀行帳號"
          editable={!withdrawLoading}
        />
        
        <View style={styles.quickAmounts}>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => setAmount('50')}
            disabled={withdrawLoading}
          >
            <Text style={styles.quickAmountText}>$50</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => setAmount('100')}
            disabled={withdrawLoading}
          >
            <Text style={styles.quickAmountText}>$100</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAmountButton}
            onPress={() => {
              if (walletData?.balance) {
                setAmount(walletData.balance.toString());
              }
            }}
            disabled={withdrawLoading}
          >
            <Text style={styles.quickAmountText}>全部</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.submitButton, withdrawLoading && styles.disabledButton]}
          onPress={handleWithdraw}
          disabled={withdrawLoading}
        >
          {withdrawLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>確認提現</Text>
          )}
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

      <ScrollView style={styles.tabContent}>
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
    backgroundColor: '#F5F7FA'
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center'
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888'
  },
  activeTabButtonText: {
    color: COLORS.primary
  },
  tabContent: {
    flex: 1,
    padding: 20
  },
  balanceCard: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: 'white'
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 10
  },
  actionButtonText: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
    fontWeight: 'bold'
  },
  transactionsContainer: {
    flex: 1,
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  transactionsList: {
    flex: 1
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'white',
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15
  },
  transactionDetails: {
    flex: 1
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  transactionDate: {
    fontSize: 14,
    color: '#888'
  },
  transactionStatus: {
    alignItems: 'flex-end'
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  transactionStatusText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  inputContainer: {
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white'
  },
  buttonContainer: {
    marginTop: 20
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  paymentMethodContainer: {
    marginVertical: 20
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  paymentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    marginRight: 10,
    marginBottom: 10
  },
  selectedPaymentOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary
  },
  selectedPaymentOptionText: {
    color: COLORS.primary
  },
  paymentOptionText: {
    marginLeft: 5
  },
  noTransactionsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20
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
  disabledButton: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    marginTop: 10,
  },
});

export default WalletScreen; 