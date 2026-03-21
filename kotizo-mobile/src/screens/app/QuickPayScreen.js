import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KCard from '../../components/common/KCard';
import KBadge from '../../components/common/KBadge';
import KButton from '../../components/common/KButton';
import useThemeStore from '../../store/themeStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export default function QuickPayScreen({ navigation }) {
  const { colors } = useThemeStore();
  const [tab, setTab] = useState(0);
  const [envoyes, setEnvoyes] = useState([]);
  const [recus, setRecus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async () => {
    try {
      const [envRes, recRes] = await Promise.all([
        api.get(ENDPOINTS.quickpay),
        api.get(ENDPOINTS.quickpayRecus),
      ]);
      setEnvoyes(envRes.data);
      setRecus(recRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  const renderQP = ({ item }) => {
    const secondesRestantes = item.secondes_restantes || 0;
    const minutes = Math.floor(secondesRestantes / 60);
    const secs = secondesRestantes % 60;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('DetailQuickPay', { code: item.code })}
        activeOpacity={0.8}
      >
        <KCard style={styles.qpCard}>
          <View style={styles.qpRow}>
            <View style={[styles.qpIcon, { backgroundColor: colors.primary + '20' }]}>
              <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16 }}>
                {item.code?.charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.qpCode, { color: colors.textPrimary }]}>{item.code}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {Number(item.montant).toLocaleString()} FCFA
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <KBadge
                label={item.statut}
                variant={item.statut === 'actif' ? 'success' : item.statut === 'paye' ? 'info' : 'warning'}
              />
              {item.statut === 'actif' && secondesRestantes > 0 && (
                <Text style={{ color: colors.warning, fontSize: 11, fontWeight: '600' }}>
                  {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </Text>
              )}
            </View>
          </View>
        </KCard>
      </TouchableOpacity>
    );
  };

  const data = tab === 0 ? envoyes : recus;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Quick Pay</Text>
        <KButton
          title="+ Nouveau"
          onPress={() => navigation.navigate('CreerQuickPay')}
          style={styles.newBtn}
        />
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.cardSecondary }]}>
        {['Envoyes', 'Recus'].map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === i && { backgroundColor: colors.primary }]}
            onPress={() => setTab(i)}
          >
            <Text style={{ color: tab === i ? '#FFF' : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderQP}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary }}>
              {loading ? 'Chargement...' : 'Aucun Quick Pay'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '700' },
  newBtn: { height: 38, paddingHorizontal: 16, borderRadius: 20 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  qpCard: { marginBottom: 8, padding: 12 },
  qpRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qpIcon: {
    width: 44, height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qpCode: { fontSize: 16, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
});