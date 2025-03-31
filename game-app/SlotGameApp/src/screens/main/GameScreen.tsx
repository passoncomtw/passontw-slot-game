import React, { PureComponent } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Header from '../../components/Header';
import SlotMachine from '../../components/SlotMachine';
import { COLORS } from '../../utils/constants';
import { GameContext } from '../../context/GameContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import { RootState } from '../../store/rootReducer';
import { DEFAULT_GAME_ID } from '../../store/api/apiClient';
import {
  placeBetRequest,
  resetBetState,
  fetchBetHistoryRequest,
  endGameSessionRequest,
  initGameSessionRequest
} from '../../store/slices/gameSlice';
import {
  PlaceBetRequest,
  PlaceBetResponse,
  BetHistoryParams,
  GameResultItem,
  GameResponse
} from '../../store/api/gameService';
import { User } from '../../store/slices/authSlice';
import { EndSessionResponse } from '../../store/slices/gameSlice';
import { Action } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

// 從 gameSlice 推導出 GameState 型別
interface GameState {
  gameList: {
    data: GameResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
  gameDetail: {
    data: GameResponse | null;
    isLoading: boolean;
    error: string | null;
  };
  gameSession: {
    data: {
      sessionId?: string;
      session_id?: string;
      gameId?: string;
      startTime?: string;
      initialBalance?: number;
      gameInfo?: GameResponse;
    } | null;
    isLoading: boolean;
    error: string | null;
  };
  endSession: {
    data: EndSessionResponse | null;
    isEnding: boolean;
    error: string | null;
  };
  bet: {
    isPlacing: boolean;
    isProcessing: boolean;
    currentBet: PlaceBetResponse | null;
    error: string | null;
  };
  betHistory: {
    data: PlaceBetResponse[];
    bets: PlaceBetResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
}

// 定義路由參數類型
type GameScreenParams = {
  gameId?: string;
  route?: {
    params?: {
      gameId?: string;
    }
  };
  navigation?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
};

// 定義 Props 類型
interface GameScreenProps extends GameScreenParams {
  gameState: GameState;
  userState: User | null;
  dispatch: ThunkDispatch<RootState, undefined, Action<string>>;
}

// 定義 State 類型
interface GameScreenState {
  isLoading: boolean;
  spinAnimation: Animated.Value;
  winAnimation: Animated.Value;
}

// 定義本地歷史記錄項目類型
interface LocalHistoryItem {
  id?: string;
  betAmount?: number | string;
  isWin?: boolean;
  winAmount?: number | string;
  timestamp?: Date | string;
  gameType?: string;
}

/**
 * 遊戲頁面
 */
class GameScreen extends PureComponent<GameScreenProps, GameScreenState> {
  // 使用 Context 取得遊戲相關方法
  static contextType = GameContext;
  
  // 獲取類型安全的 context
  get typedContext() {
    return this.context as React.ContextType<typeof GameContext>;
  }
  
  constructor(props: GameScreenProps) {
    super(props);
    
    this.state = {
      isLoading: false,
      spinAnimation: new Animated.Value(0),
      winAnimation: new Animated.Value(0),
    };
  }
  
  // 從路由參數取得 gameId，如果沒有則使用環境變數中的默認值
  get gameIdFromRoute() {
    return this.props.route?.params?.gameId || DEFAULT_GAME_ID;
  }
  
  // 計算真實的餘額，優先使用Redux中的用戶餘額
  get actualBalance() {
    const { userState } = this.props;
    return userState?.balance !== undefined ? userState.balance : this.typedContext.balance;
  }
  
  // 格式化日期時間
  formatDateTime = (date: Date | string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // 檢查日期是否有效
      if (isNaN(dateObj.getTime())) {
        return '無效日期';
      }
      
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      
      return `${month}/${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('日期格式化錯誤:', error, date);
      return '格式錯誤';
    }
  };
  
  // 取得下注歷史記錄，優先使用API返回的歷史
  get betHistoryRecords(): PlaceBetResponse[] {
    const { gameState } = this.props;
    
    try {
      // 確保 gameState.betHistory.bets 存在並且有數據
      if (gameState?.betHistory?.bets && Array.isArray(gameState.betHistory.bets) && gameState.betHistory.bets.length > 0) {
        console.log('使用 API 返回的下注歷史:', gameState.betHistory.bets.length, '條記錄');
        return gameState.betHistory.bets;
      }
      
      // 確保 gameState.betHistory.data 存在並且有數據
      if (gameState?.betHistory?.data && Array.isArray(gameState.betHistory.data) && gameState.betHistory.data.length > 0) {
        console.log('使用 API 返回的下注歷史:', gameState.betHistory.data.length, '條記錄');
        return gameState.betHistory.data;
      } else if (gameState?.betHistory?.data) {
        console.log('API 返回的下注歷史為空');
      } else {
        console.log('API 下注歷史數據不存在，嘗試使用本地歷史');
      }
      
      // 使用本地歷史記錄作為備份
      const localHistory = this.typedContext?.gameHistory || [];
      if (Array.isArray(localHistory) && localHistory.length > 0) {
        console.log('使用本地下注歷史:', localHistory.length, '條記錄');
        return localHistory.map((item: LocalHistoryItem) => ({
          betId: item.id || `local-${Math.random().toString(36).substring(2, 9)}`,
          gameId: gameState?.gameDetail?.data?.game_id || this.gameIdFromRoute,
          betAmount: typeof item.betAmount === 'number' ? item.betAmount : Number(item.betAmount) || 0,
          isWin: Boolean(item.isWin),
          winAmount: typeof item.winAmount === 'number' ? item.winAmount : Number(item.winAmount) || 0,
          timestamp: (item.timestamp instanceof Date) ? item.timestamp.toISOString() : String(item.timestamp) || new Date().toISOString(),
          transactionId: item.id || `local-${Date.now()}`, // 確保有唯一識別碼
          sessionId: '',
          currentBalance: 0,
          results: [],
          jackpotWon: false,
          multiplier: 1
        }));
      }
      
      // 如果都沒有，返回空數組
      console.log('無下注歷史記錄可用');
      return [];
    } catch (error) {
      console.error('獲取下注歷史記錄時出錯:', error);
      return [];
    }
  }
  
  // 啟動旋轉動畫
  startSpinAnimation = () => {
    this.state.spinAnimation.setValue(0);
    Animated.timing(this.state.spinAnimation, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };
  
  // 啟動贏錢動畫
  startWinAnimation = () => {
    this.state.winAnimation.setValue(0);
    Animated.timing(this.state.winAnimation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.elastic(1)),
      useNativeDriver: true,
    }).start();
  };
  
  // 刷新下注歷史記錄
  refreshBetHistory = () => {
    const { dispatch } = this.props;
    const gameId = this.gameIdFromRoute; // 從路由或預設值獲取 gameId
    
    const historyParams: BetHistoryParams = {
      Page: 1,
      PageSize: 10,
      game_id: gameId // 添加 game_id 參數，後端已修改為接受字符串形式
    };
    
    console.log('正在刷新下注歷史，參數:', historyParams);
    
    // 捕獲可能的錯誤
    try {
      dispatch(fetchBetHistoryRequest(historyParams));
    } catch (error) {
      console.error('刷新下注歷史時出錯:', error);
      Toast.show({
        type: 'error',
        text1: '獲取歷史記錄失敗',
        text2: '無法獲取您的下注歷史記錄',
        position: 'bottom',
      });
    }
  };
  
  // 處理旋轉事件
  handleSpin = () => {
    const { dispatch, gameState } = this.props;
    const { betAmount } = this.typedContext;
    const sessionId = gameState.gameSession.data?.sessionId || gameState.gameSession.data?.session_id;
    
    // 檢查會話是否已初始化
    if (!sessionId) {
      Toast.show({
        type: 'error',
        text1: '遊戲會話未初始化',
        text2: '請重新載入頁面',
        position: 'bottom',
      });
      // 嘗試重新初始化會話
      this.initGame();
      return;
    }
    
    // 檢查是否正在進行下注
    if (gameState.bet.isPlacing) {
      console.log('已經在進行下注，請等待結果');
      return;
    }
    
    // 檢查餘額是否足夠
    if (this.actualBalance < betAmount) {
      Toast.show({
        type: 'error',
        text1: '餘額不足',
        text2: `您的餘額（¥${this.actualBalance.toFixed(2)}）不足以進行此次下注（¥${betAmount.toFixed(2)}）`,
        position: 'bottom',
      });
      return;
    }
    
    console.log('發送下注請求:', {
      sessionId,
      betAmount,
      gameId: this.gameIdFromRoute
    });
    
    // 發送下注請求
    const betRequest: PlaceBetRequest = {
      sessionId: sessionId,
      betAmount: betAmount,
      game_id: this.gameIdFromRoute,
      betOptions: {} // 可選參數，可以添加遊戲相關的額外選項
    };
    
    try {
      // 啟動旋轉動畫 (額外確保動畫觸發)
      this.startSpinAnimation();
      
      // 發送下注請求到 Redux
      dispatch(placeBetRequest(betRequest));
      
      // 設置延遲刷新下注歷史（給 API 一些處理時間）
      setTimeout(() => {
        this.refreshBetHistory();
      }, 2000);
    } catch (error) {
      console.error('下注請求發送失敗:', error);
      Toast.show({
        type: 'error',
        text1: '下注失敗',
        text2: '發送請求時發生錯誤，請稍後再試',
        position: 'bottom',
      });
    }
  };
  
  // ==========================================================
  // 生命週期方法
  // ==========================================================
  componentDidMount() {
    // 重置本地狀態
    this.setState({
      isLoading: false,
      spinAnimation: new Animated.Value(0),
      winAnimation: new Animated.Value(0),
    });
    
    // 初始化遊戲和遊戲會話
    this.initGame();
    
    // 300毫秒後嘗試獲取下注歷史，確保會話已建立
    setTimeout(() => {
      this.refreshBetHistory();
      
      // 輸出調試信息
      console.log('Component mounted, requesting bet history');
    }, 300);
  }
  
  // 更新 componentDidUpdate 中的處理邏輯
  componentDidUpdate(prevProps: GameScreenProps) {
    const { gameState } = this.props;
    
    // 監控並處理錯誤消息
    if (
      gameState.gameSession.error && 
      prevProps.gameState.gameSession.error !== gameState.gameSession.error
    ) {
      Toast.show({
        type: 'error',
        text1: '錯誤',
        text2: '遊戲會話初始化失敗，請稍後再試。',
        position: 'bottom'
      });
    }
    
    if (
      gameState.bet.error && 
      prevProps.gameState.bet.error !== gameState.bet.error
    ) {
      Toast.show({
        type: 'error',
        text1: '下注失敗',
        text2: gameState.bet.error,
        position: 'bottom'
      });
      this.props.dispatch(resetBetState());
    }
    
    // 下注成功後的處理
    if (
      !prevProps.gameState.bet.currentBet && 
      gameState.bet.currentBet
    ) {
      console.log('下注成功，結果:', gameState.bet.currentBet);
      
      // 有新的下注結果，更新 UI
      if (gameState.bet.currentBet.results && gameState.bet.currentBet.results.length > 0) {
        const newReels = gameState.bet.currentBet.results.map((result: GameResultItem) => result.symbol);
        this.typedContext.setReels(newReels);
        
        // 檢查是否贏錢，如果是則啟動贏錢動畫
        if (gameState.bet.currentBet.isWin) {
          this.startWinAnimation();
        }
      }
    }
    
    // 檢測是否正在進行下注，並同步到 GameContext
    if (prevProps.gameState.bet.isPlacing !== gameState.bet.isPlacing) {
      // 同步 Redux 旋轉狀態到 GameContext
      this.typedContext.setIsSpinningState(gameState.bet.isPlacing);
      
      // 如果開始下注，啟動旋轉動畫
      if (gameState.bet.isPlacing) {
        this.startSpinAnimation();
      }
      
      // 下注完成後刷新歷史
      if (!gameState.bet.isPlacing && prevProps.gameState.bet.isPlacing) {
        setTimeout(() => {
          this.refreshBetHistory();
        }, 500);
      }
    }
  }
  
  componentWillUnmount() {
    const { dispatch, gameState } = this.props;
    const sessionId = gameState.gameSession.data?.sessionId;
    
    // 只在有會話ID時結束會話
    if (sessionId) {
      dispatch(endGameSessionRequest({ sessionId: sessionId }));
    }
  }
  
  // ==========================================================
  // 遊戲相關方法
  // ==========================================================
  // 初始化遊戲
  initGame = () => {
    const { dispatch } = this.props;
    
    // 使用新的集合動作一次性初始化遊戲會話和歷史記錄
    dispatch(initGameSessionRequest({
      gameId: this.gameIdFromRoute,
      betAmount: this.typedContext.betAmount
    }));
  };
  
  // ==========================================================
  // 輔助方法
  // ==========================================================
  // ==========================================================
  // 渲染方法
  // ==========================================================
  render() {
    const { gameState } = this.props;
    const { betAmount, increaseBet, decreaseBet, winAmount, aiSuggestion } = this.typedContext;
    const sessionId = gameState.gameSession.data?.session_id;
    const { spinAnimation, winAnimation } = this.state;
    
    // 旋轉動畫值
    const spin = spinAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });
    
    // 贏錢動畫值
    const winScale = winAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.2, 1]
    });
    
    // 檢查是否正在加載遊戲
    const isLoading = 
      gameState.gameDetail.isLoading || 
      gameState.gameSession.isLoading;
      
    // 檢查是否正在旋轉
    const isSpinning = gameState.bet.isPlacing;
    
    // 確定按鈕是否應該禁用
    const isDisabled = isLoading || !sessionId;
    const isSpinDisabled = isDisabled || isSpinning;
    
    // 確保有下注歷史記錄可用
    const hasBetHistory = this.betHistoryRecords && this.betHistoryRecords.length > 0;
    
    console.log('按鈕狀態:', {
      isLoading,
      isSpinning,
      isDisabled,
      isSpinDisabled,
      sessionId: !!sessionId
    });
    
    console.log('下注歷史:', {
      hasHistory: hasBetHistory,
      recordCount: this.betHistoryRecords?.length || 0
    });
    
    return (
      <View style={styles.container}>
        <Header title="幸運七" showBackButton backgroundColor="#6200EA" titleColor="#FFFFFF" />
        
        <View style={styles.content}>
          {/* 餘額顯示 */}
          <View style={styles.balanceDisplay}>
            <View>
              <Text style={styles.balanceLabel}>餘額</Text>
              <Text style={styles.balanceValue}>
                ¥ {this.actualBalance?.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>贏得</Text>
              <Animated.Text 
                style={[
                  styles.balanceValue, 
                  winAmount > 0 && styles.winAmount,
                  winAmount > 0 && { transform: [{ scale: winScale }] }
                ]}
              >
                ¥ {winAmount?.toFixed(2)}
              </Animated.Text>
            </View>
          </View>
          
          {/* 老虎機遊戲區域 */}
          <View style={styles.slotMachine}>
            <View style={styles.jackpotDisplay}>
              <Text style={styles.jackpotLabel}>頭獎</Text>
              <Text style={styles.jackpotValue}>¥ 10,000</Text>
            </View>
            
            <Animated.View 
              style={[
                styles.slotContainer,
                isSpinning && { transform: [{ rotate: spin }] }
              ]}
            >
              <SlotMachine />
            </Animated.View>
            
            {aiSuggestion && (
              <View style={styles.aiSuggestion}>
                <View style={styles.aiSuggestionHeader}>
                  <Ionicons name="analytics" size={18} color="#fff" style={styles.aiIcon} />
                  <Text style={styles.aiSuggestionTitle}>AI 提示</Text>
                </View>
                <Text style={styles.aiSuggestionText}>{aiSuggestion}</Text>
              </View>
            )}
          </View>
          
          {/* 投注控制區域 */}
          <View style={styles.slotControls}>
            <View>
              <Text style={styles.betLabel}>投注金額</Text>
              <View style={styles.betAmountControls}>
                <TouchableOpacity 
                  style={[styles.betButton, isDisabled && styles.disabledButton]}
                  onPress={decreaseBet}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={24} color={isDisabled ? '#999' : '#fff'} />
                </TouchableOpacity>
                
                <TextInput
                  style={styles.betAmountInput}
                  value={betAmount.toString()}
                  editable={false}
                  textAlign="center"
                />
                
                <TouchableOpacity 
                  style={[styles.betButton, isDisabled && styles.disabledButton]}
                  onPress={increaseBet}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={24} color={isDisabled ? '#999' : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.spinButton,
                isSpinDisabled && styles.disabledButton
              ]}
              onPress={this.handleSpin}
              disabled={isSpinDisabled}
              activeOpacity={0.7}
            >
              <Ionicons name="play" size={18} color={isSpinDisabled ? '#999' : COLORS.text} style={styles.spinIcon} />
              <Text style={styles.spinButtonText}>
                {isSpinning ? '旋轉中...' : '旋轉'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* 下注歷史區域 */}
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>
              下注歷史 
              <Text style={styles.historyCount}> ({this.betHistoryRecords?.length || 0})</Text>
            </Text>
            <ScrollView style={styles.historyScrollView}>
              {!hasBetHistory ? (
                <Text style={styles.noHistoryText}>暫無下注記錄</Text>
              ) : (
                this.betHistoryRecords.map((item: PlaceBetResponse, index: number) => (
                  <View key={item.betId || item.transactionId || `history-${index}`} style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <Text style={styles.historyItemId}>#{index + 1}</Text>
                      <Text style={styles.historyItemDate}>
                        {item.timestamp ? this.formatDateTime(item.timestamp) : '未知時間'}
                      </Text>
                    </View>
                    <View style={styles.historyItemDetails}>
                      <Text style={styles.historyItemAmount}>
                        下注: ¥ {typeof item.betAmount === 'number' ? item.betAmount.toFixed(2) : '0.00'}
                      </Text>
                      <Text style={[
                        styles.historyItemResult,
                        item.isWin ? styles.winResult : styles.loseResult
                      ]}>
                        {item.isWin 
                          ? `贏 ¥ ${typeof item.winAmount === 'number' ? item.winAmount.toFixed(2) : '0.00'}` 
                          : '輸'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  // 餘額顯示樣式
  balanceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  winAmount: {
    color: '#FFEB3B',
  },
  // 老虎機樣式
  slotMachine: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jackpotDisplay: {
    alignItems: 'center',
    marginBottom: 15,
  },
  jackpotLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  jackpotValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  slotContainer: {
    height: 150,
    marginVertical: 15,
  },
  aiSuggestion: {
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  aiSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiIcon: {
    marginRight: 8,
  },
  aiSuggestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  aiSuggestionText: {
    fontSize: 14,
    color: '#fff',
  },
  // 投注控制樣式
  slotControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  betLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  betAmountControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  betAmountInput: {
    width: 60,
    height: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    fontSize: 16,
  },
  spinButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    width: 120,
    height: 50,
  },
  spinIcon: {
    marginRight: 5,
  },
  spinButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
  },
  // 歷史記錄樣式
  historyContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  historyCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
  historyScrollView: {
    flex: 1,
  },
  noHistoryText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  historyItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyItemId: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  historyItemDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  historyItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemAmount: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  historyItemResult: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  winResult: {
    color: COLORS.success,
  },
  loseResult: {
    color: COLORS.error,
  },
});

// 從 Redux 連接組件
const mapStateToProps = (state: RootState) => ({
  gameState: state.game,
  userState: state.auth.user,
});

export default connect(mapStateToProps)(GameScreen); 