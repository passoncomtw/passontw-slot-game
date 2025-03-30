import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../utils/constants';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * 卡片容器組件
 */
export const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 4,
    // iOS 陰影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android 陰影
    elevation: 3,
    // 確保子組件不會溢出邊界
    overflow: 'hidden',
  },
});

export default Card; 