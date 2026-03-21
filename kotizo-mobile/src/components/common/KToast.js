import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../../store/themeStore';

const CONFIGS = {
  error: { icon: 'close-circle', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  success: { icon: 'checkmark-circle', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
  warning: { icon: 'warning', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  info: { icon: 'information-circle', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
};

export default function KToast({ message, type = 'error', visible, onHide }) {
  const { colors } = useThemeStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = CONFIGS[type] || CONFIGS.error;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => onHide && onHide());
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.container,
      {
        backgroundColor: colors.card,
        borderColor: config.border,
        transform: [{ translateY }],
        opacity,
      }
    ]}>
      <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <Text style={[styles.message, { color: colors.textPrimary }]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  iconBox: {
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
});