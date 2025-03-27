import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  FlatList 
} from 'react-native';
import Header from '../../components/Header';
import SlotMachine from '../../components/SlotMachine';
import { COLORS } from '../../utils/constants';
import { useGame } from '../../context/GameContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
    spin, 
    gameHistory,
    winAmount,
  } = useGame();

  /**
   * 格式化日期時間
   */
  const formatDateTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={styles.container}>
      <Header title="幸運七" />
      
      <ScrollView style={styles.content}>
        <View style={styles.balanceContainer}>
          <View>
            <Text style={styles.balanceLabel}>餘額</Text>
            <Text style={styles.balanceValue}>${balance.toLocaleString()}</Text>
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
                disabled={isSpinning || betAmount <= 10}
              >
                <Text style={styles.betButtonText}>-</Text>
              </TouchableOpacity>
              
              <View style={styles.betAmountDisplay}>
                <Text style={styles.betAmountText}>{betAmount}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.betButton} 
                onPress={increaseBet}
                disabled={isSpinning || betAmount >= balance}
              >
                <Text style={styles.betButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]} 
            onPress={spin}
            disabled={isSpinning || balance < betAmount}
          >
            <Ionicons name="play" size={18} color="white" style={styles.spinIcon} />
            <Text style={styles.spinButtonText}>旋轉</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>歷史記錄</Text>
          <TouchableOpacity>
            <Text style={styles.historyViewAll}>查看全部</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.historyContainer}>
          {gameHistory.length === 0 ? (
            <Text style={styles.noHistoryText}>暫無遊戲記錄</Text>
          ) : (
            gameHistory.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.historyItem}>
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  historyItemTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  historyItemAmount: {
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'center',
  },
  winAmount: {
    color: COLORS.success,
  },
  loseAmount: {
    color: COLORS.error,
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
});

export default GameScreen; 