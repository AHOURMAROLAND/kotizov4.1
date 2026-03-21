import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SplashScreen({ navigation }) {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => navigation.replace('Tutorial'), 1500);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoBox}>
          <View style={styles.circle} />
          <Text style={styles.letter}>k</Text>
          <View style={styles.dot} />
        </View>
        <Text style={styles.appName}>Kotizo</Text>
        <Text style={styles.slogan}>Cotisez Ensemble, Simplement</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: { alignItems: 'center' },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#2563EB',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    position: 'absolute',
  },
  letter: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    position: 'absolute',
    left: 14,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    position: 'absolute',
    right: 14,
    top: 20,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },
  slogan: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 8,
  },
});