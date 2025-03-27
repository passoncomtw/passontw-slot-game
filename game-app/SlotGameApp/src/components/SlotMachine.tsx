import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../utils/constants';
import { useGame } from '../context/GameContext';
import Card from './Card';

/**
 * 老虎機遊戲組件
 */
const SlotMachine: React.FC = () => {
  const { reels, isSpinning, winAmount, jackpot, aiSuggestion } = useGame();
  
  // 動畫值
  const spinValues = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  
  // 旋轉動畫
  useEffect(() => {
    if (isSpinning) {
      // 三個滾輪分別執行不同時長的動畫
      spinValues.forEach((value, index) => {
        Animated.timing(value, {
          toValue: 1,
          duration: 1500 + (index * 300), // 滾輪依次停止
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    } else {
      // 重置動畫
      spinValues.forEach(value => {
        value.setValue(0);
      });
    }
  }, [isSpinning]);
  
  // 輪盤旋轉動畫
  const getSpinInterpolation = (spinValue: Animated.Value) => {
    return spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '1440deg'], // 旋轉多圈
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.jackpotContainer}>
        <Text style={styles.jackpotTitle}>頭獎</Text>
        <Text style={styles.jackpotAmount}>${jackpot.toLocaleString()}</Text>
      </View>
      
      <View style={styles.reelsContainer}>
        {reels.map((symbol, index) => (
          <Animated.View
            key={index}
            style={[
              styles.reel,
              {
                transform: [
                  { rotate: getSpinInterpolation(spinValues[index]) },
                ],
              },
            ]}
          >
            <Text style={styles.reelText}>{symbol}</Text>
          </Animated.View>
        ))}
      </View>
      
      {winAmount > 0 && (
        <View style={styles.winAmountContainer}>
          <Text style={styles.winText}>恭喜獲勝!</Text>
          <Text style={styles.winAmount}>+${winAmount.toLocaleString()}</Text>
        </View>
      )}
      
      {aiSuggestion && (
        <View style={styles.aiSuggestionContainer}>
          <View style={styles.aiTitleContainer}>
            <Text style={styles.aiTitle}>AI 提示</Text>
          </View>
          <Text style={styles.aiSuggestionText}>{aiSuggestion}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    marginVertical: 20,
  },
  jackpotContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  jackpotTitle: {
    fontSize: 16,
    color: 'white',
  },
  jackpotAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  reelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  reel: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 5,
    height: 120,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelText: {
    fontSize: 36,
  },
  winAmountContainer: {
    backgroundColor: COLORS.success,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  winText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  winAmount: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  aiSuggestionContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 10,
    marginTop: 15,
  },
  aiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  aiTitle: {
    color: 'white',
    fontWeight: '600',
  },
  aiSuggestionText: {
    color: 'white',
    fontSize: 14,
  },
});

export default SlotMachine; 