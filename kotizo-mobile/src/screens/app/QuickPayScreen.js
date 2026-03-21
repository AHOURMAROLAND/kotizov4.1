import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../store/themeStore';

export default function QuickPayScreen() {
  const { colors } = useThemeStore();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Quick Pay</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ecran en cours de construction</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14 },
});