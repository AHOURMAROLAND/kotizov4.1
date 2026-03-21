import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VARIANTS = {
  success: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  error: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
  info: { bg: 'rgba(37,99,235,0.15)', text: '#60A5FA' },
  warning: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  basique: { bg: 'rgba(255,255,255,0.1)', text: '#FFFFFF' },
  verifie: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  business: { bg: 'rgba(37,99,235,0.15)', text: '#60A5FA' },
};

export default function KBadge({ label, variant = 'info', style }) {
  const v = VARIANTS[variant] || VARIANTS.info;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});