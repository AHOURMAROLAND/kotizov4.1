import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KCard from '../../components/common/KCard';
import KBadge from '../../components/common/KBadge';
import useThemeStore from '../../store/themeStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const TABS = ['Tout', 'Cotisations', 'Quick Pay'];

export default function HistoriqueScreen({ navigation }) {
  const { colors } = useThemeStore();
  const [tab, setTab] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [cotisations, setCotisations] = useState([]);
  const [quickpays, setQuickpays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async () => {
    try {
      const [txRes, cotisRes, qpRes] = await Promise.all([
        api.get(ENDPOINTS.historique),
        api.get(ENDPOINTS.mesParticipations),
        api.get(ENDPOINTS.quickpayRecus),
      ]);
      setTransactions(txRes.data);
      setCotisations(cotisRes.data);
      setQuickpays(qpRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  const getData = () => {
    if (tab === 0) return transactions;
    if (tab === 1) return cotisations;
    return quickpays;
  };

  const renderTransaction = ({ item }) => {
    const isPayin = item.type_transaction === 'payin';
    const montant = Number(item.montant || item.montant_unitaire || 0);
    const date = new Date(item.date_creation || item.date_participation).toLocaleDateString('fr-FR');

    return (
      <KCard style={styles.txCard}>
        <View style={styles.txRow}>
          <View style={[styles.txIcon, {
            backgroundColor: isPayin
              ? 'rgba(239,68,68,0.15)'
              : 'rgba(34,197,94,0.15)',
          }]}>
            <Text style={{ fontSize: 16 }}>{isPayin ? '-' : '+'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.txLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.nom || item.source || 'Transaction'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{date}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{
              color: isPayin ? colors.error : colors.success,
              fontWeight: '700',
              fontSize: 15,
            }}>
              {isPayin ? '-' : '+'}{montant.toLocaleString()} F
            </Text>
            <KBadge
              label={item.statut || 'complete'}
              variant={item.statut === 'complete' || item.statut === 'paye' ? 'success' : 'warning'}
              style={{ marginTop: 4 }}
            />
          </View>
        </View>
      </KCard>
    );
  };

  const data = getData();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Historique</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.cardSecondary }]}>
        {TABS.map((t, i) => (
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
        keyExtractor={(item, i) => String(item.id || i)}
        renderItem={renderTransaction}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              {loading ? 'Chargement...' : 'Aucune transaction'}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
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
  txCard: { marginBottom: 8, padding: 12 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
});