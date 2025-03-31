import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../utils/constants';
import { GameContext } from '../context/GameContext';

const SlotMachine = () => {
  const { reels, isSpinning } = useContext(GameContext);
  const [displayReels, setDisplayReels] = useState<string[]>(reels || ['7', '7', '7']);
  
  // 創建旋轉動畫的引用
  const spinAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  
  // 當 reels 變化時更新顯示
  useEffect(() => {
    if (reels && reels.length > 0) {
      setDisplayReels(reels);
      console.log('顯示輪盤符號:', reels);
    }
  }, [reels]);
  
  // 當 isSpinning 狀態變化時開始旋轉動畫
  useEffect(() => {
    if (isSpinning) {
      startSpinAnimation();
    }
  }, [isSpinning]);
  
  // 旋轉動畫函數
  const startSpinAnimation = () => {
    // 重置動畫
    spinAnimations.forEach(anim => anim.setValue(0));
    
    // 建立動畫序列，每個輪盤依次停止
    spinAnimations.forEach((anim, index) => {
      Animated.sequence([
        // 延遲開始，讓每個輪盤有不同的開始時間
        Animated.delay(index * 100),
        // 開始旋轉
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500 + index * 500, // 每個輪盤持續時間不同
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      ]).start();
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.slotReels}>
        {displayReels.map((symbol, index) => {
          // 建立旋轉動畫
          const translateY = spinAnimations[index].interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, -300, 300, 0]
          });
          
          const rotateX = spinAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '720deg']
          });
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.slotReel,
                {
                  transform: [
                    { translateY },
                    { rotateX }
                  ]
                }
              ]}
            >
              <Text style={styles.symbolText}>{symbol || '?'}</Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotReels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
  },
  slotReel: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 10,
    height: 120,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    marginHorizontal: 5,
    // 加入透視效果以改進 3D 旋轉效果
    backfaceVisibility: 'hidden',
  },
  symbolText: {
    fontSize: 42,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default SlotMachine; 