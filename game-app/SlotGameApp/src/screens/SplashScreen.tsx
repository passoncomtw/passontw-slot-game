import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, StatusBar, Animated, Easing } from 'react-native';
import { COLORS } from '../utils/constants';

/**
 * 啟動頁面
 */
const SplashScreen: React.FC = () => {
  const rotation = new Animated.Value(0);
  const scale = new Animated.Value(0.3);
  
  useEffect(() => {
    // 旋轉動畫
    Animated.timing(rotation, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    
    // 縮放動畫
    Animated.timing(scale, {
      toValue: 1,
      duration: 1000,
      easing: Easing.elastic(1.2),
      useNativeDriver: true,
    }).start();
  }, []);
  
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { rotate: spin },
              { scale: scale },
            ],
          },
        ]}
      >
        <Text style={styles.icon}>🎰</Text>
      </Animated.View>
      <Text style={styles.title}>AI 幸運老虎機</Text>
      <Text style={styles.subtitle}>智能推薦，贏率提升</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default SplashScreen; 