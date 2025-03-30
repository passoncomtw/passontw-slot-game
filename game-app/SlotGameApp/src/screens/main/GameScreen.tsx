import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  FlatList,
  Alert
} from 'react-native';
import Toast from 'react-native-toast-message';
import Header from '../../components/Header';
import SlotMachine from '../../components/SlotMachine';
import { COLORS } from '../../utils/constants';
import { useGame } from '../../context/GameContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  placeBetRequest, 
  getGameResultRequest, 
  resetBetState,
  fetchBetHistoryRequest,
  startGameSessionRequest
} from '../../store/slices/gameSlice';
import { 
  PlaceBetRequest, 
  GameResultItem, 
  PlaceBetResponse,
  BetHistoryParams,
  GameSessionRequest
} from '../../store/api/gameService';

/**
 * 遊戲頁面
 */
const GameScreen: React.FC = () => {
  const { 
    balance, 
    betAmount, 
    increaseBet, 
    decreaseBet, 
    isSpinning,
    gameHistory,
    winAmount,
    reels,
    setReels
  } = useGame();

  const dispatch = useAppDispatch();
  // 從Redux獲取遊戲狀態
  const gameState = useAppSelector(state => state.game);
  const userState = useAppSelector(state => state.auth.user);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gameSessionId, setGameSessionId] = useState<string>("");

  // 頁面加載時初始化遊戲會話並獲取下注歷史
  useEffect(() => {
    // 初始化遊戲會話
    initGameSession();
    
    // 獲取下注歷史
    const params: BetHistoryParams = {
      page: 1,
      pageSize: 10
    };
    dispatch(fetchBetHistoryRequest(params as any));
  }, [dispatch]);

  // 初始化遊戲會話
  const initGameSession = async () => {
    try {
      console.log('初始化遊戲會話...');
      
      // 根據gameSaga.ts中的定義，傳遞正確的參數格式
      dispatch(startGameSessionRequest({ 
        gameId: 'game-1', // 使用幸運七遊戲ID
        betAmount: betAmount 
      }));
    } catch (error) {
      console.error('初始化遊戲會話失敗:', error);
      Toast.show({
        type: 'error',
        text1: '錯誤',
        text2: '初始化遊戲失敗，請刷新頁面。',
        position: 'bottom'
      });
    }
  };

  // 監聽遊戲會話狀態變化
  useEffect(() => {
    const { gameSession } = gameState;
    
    if (gameSession.data && gameSession.data.sessionId) {
      console.log('遊戲會話已建立:', gameSession.data.sessionId);
      setGameSessionId(gameSession.data.sessionId);
    }
    
    if (!gameSession.isLoading && gameSession.error) {
      console.error('遊戲會話初始化失敗:', gameSession.error);
      Toast.show({
        type: 'error',
        text1: '錯誤',
        text2: '遊戲會話初始化失敗，請稍後再試。',
        position: 'bottom'
      });
    }
  }, [gameState.gameSession]);

  // 監聽下注狀態變化
  useEffect(() => {
    const { bet } = gameState;
    
    // 如果有下注結果
    if (!bet.isProcessing && !bet.isPlacing && bet.currentBet && !isLoading) {
      // 更新本地遊戲狀態
      if (bet.currentBet.results && bet.currentBet.results.length > 0) {
        // 將API返回的結果轉換為本地顯示的符號
        const newReels = bet.currentBet.results.map(result => result.symbol);
        setReels(newReels);
      }
    }
  }, [gameState.bet, isLoading]);

  // 當下注完成但有錯誤時顯示錯誤提示
  useEffect(() => {
    const { bet } = gameState;
    if (!bet.isPlacing && bet.error) {
      Toast.show({
        type: 'error',
        text1: '下注失敗',
        text2: bet.error,
        position: 'bottom'
      });
      dispatch(resetBetState());
    }
  }, [gameState.bet.error]);

  /**
   * 格式化日期時間
   */
  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  /**
   * 執行下注並獲取結果
   */
  const handleSpin = async () => {
    if (isSpinning || actualBalance < betAmount || !gameSessionId) {
      if (!gameSessionId) {
        Toast.show({
          type: 'error',
          text1: '錯誤',
          text2: '遊戲會話未初始化，請等待或刷新頁面。',
          position: 'bottom'
        });
      }
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('開始下注...', gameSessionId);
      
      // 生成下注請求
      const betRequest: PlaceBetRequest = {
        sessionId: gameSessionId,
        gameId: 'game-1', // 使用幸運七遊戲ID
        betAmount: betAmount,
        betOptions: {
          lines: 1,
          multiplier: 1
        }
      };
      
      // 派發下注請求
      dispatch(placeBetRequest(betRequest));
      
      // 模擬旋轉動畫時間
      setTimeout(() => {
        // 獲取遊戲結果
        if (gameState.bet.currentBet?.betId) {
          dispatch(getGameResultRequest(gameState.bet.currentBet.betId));
        }
        setIsLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('下注過程中出錯:', error);
      setIsLoading(false);
      Toast.show({
        type: 'error',
        text1: '錯誤',
        text2: '下注過程中出現錯誤，請稍後再試。',
        position: 'bottom'
      });
    }
  };

  // 計算真實的餘額，優先使用Redux中的用戶餘額
  const actualBalance = userState?.balance !== undefined ? userState.balance : balance;
  
  // 取得下注歷史記錄，優先使用API返回的歷史
  const betHistoryRecords = gameState.betHistory.data.length > 0 
    ? gameState.betHistory.data
    : gameHistory.map(item => ({
        betId: item.id,
        gameId: 'slot-lucky-seven',
        betAmount: item.betAmount,
        isWin: item.isWin,
        winAmount: item.winAmount,
        timestamp: item.timestamp.toISOString(),
      } as PlaceBetResponse));

  // 刷新下注歷史記錄
  const refreshBetHistory = () => {
    const params: BetHistoryParams = {
      page: 1,
      pageSize: 10
    };
    dispatch(fetchBetHistoryRequest(params as any));
  };

  return (
    <View style={styles.container}>
      <Header title="幸運七" />
      
      <ScrollView style={styles.content}>
        <View style={styles.balanceContainer}>
          <View>
            <Text style={styles.balanceLabel}>餘額</Text>
            <Text style={styles.balanceValue}>${actualBalance.toLocaleString()}</Text>
          </View>
          
          <View>
            <Text style={styles.winLabel}>贏得</Text>
            <Text style={[styles.winValue, winAmount > 0 && styles.winValueHighlight]}>
              ${winAmount.toLocaleString()}
            </Text>
          </View>
        </View>
        
        <SlotMachine />
        
        <View style={styles.betContainer}>
          <View>
            <Text style={styles.betLabel}>投注金額</Text>
            <View style={styles.betAmountContainer}>
              <TouchableOpacity 
                style={styles.betButton} 
                onPress={decreaseBet}
                disabled={isSpinning || isLoading || betAmount <= 10}
              >
                <Text style={styles.betButtonText}>-</Text>
              </TouchableOpacity>
              
              <View style={styles.betAmountDisplay}>
                <Text style={styles.betAmountText}>{betAmount}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.betButton} 
                onPress={increaseBet}
                disabled={isSpinning || isLoading || betAmount >= actualBalance}
              >
                <Text style={styles.betButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.spinButton, 
              (isSpinning || isLoading || gameState.bet.isPlacing || gameState.bet.isProcessing || !gameSessionId) 
                && styles.spinButtonDisabled
            ]} 
            onPress={handleSpin}
            disabled={isSpinning || isLoading || actualBalance < betAmount || gameState.bet.isPlacing || gameState.bet.isProcessing || !gameSessionId}
          >
            <Ionicons name="play" size={18} color="white" style={styles.spinIcon} />
            <Text style={styles.spinButtonText}>
              {isLoading || gameState.bet.isPlacing || gameState.bet.isProcessing ? '旋轉中...' : '旋轉'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>歷史記錄</Text>
          {gameState.betHistory.isLoading && <Text style={styles.loadingText}>載入中...</Text>}
          <TouchableOpacity onPress={refreshBetHistory}>
            <Text style={styles.historyViewAll}>刷新</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.historyContainer}>
          {gameState.betHistory.isLoading ? (
            <Text style={styles.loadingText}>正在載入歷史記錄...</Text>
          ) : betHistoryRecords.length === 0 ? (
            <Text style={styles.noHistoryText}>暫無遊戲記錄</Text>
          ) : (
            betHistoryRecords.slice(0, 5).map((item) => (
              <View key={item.betId} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyItemTitle}>
                    {item.isWin ? `贏得 $${item.winAmount}` : `下注 $${item.betAmount}`}
                  </Text>
                  <Text style={styles.historyItemTime}>
                    {formatDateTime(item.timestamp)}
                  </Text>
                </View>
                <Text 
                  style={[
                    styles.historyItemAmount, 
                    item.isWin ? styles.winAmount : styles.loseAmount
                  ]}
                >
                  {item.isWin ? `+$${item.winAmount}` : `-$${item.betAmount}`}
                </Text>
              </View>
            ))
          )}
          
          {gameState.betHistory.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{gameState.betHistory.error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={refreshBetHistory}
              >
                <Text style={styles.retryButtonText}>重試</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Toast通知組件 */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  winLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  winValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  winValueHighlight: {
    color: COLORS.success,
  },
  betContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  betLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  betAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  betButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  betAmountDisplay: {
    width: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
    backgroundColor: 'white',
  },
  betAmountText: {
    fontSize: 18,
    fontWeight: '600',
  },
  spinButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinButtonDisabled: {
    opacity: 0.5,
  },
  spinIcon: {
    marginRight: 8,
  },
  spinButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  historyViewAll: {
    fontSize: 14,
    color: COLORS.primary,
  },
  historyContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  noHistoryText: {
    textAlign: 'center',
    paddingVertical: 15,
    color: '#999',
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: 15,
    color: '#666',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  historyItemTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyItemAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  winAmount: {
    color: COLORS.success,
  },
  loseAmount: {
    color: COLORS.error,
  },
  errorContainer: {
    padding: 15,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default GameScreen; 