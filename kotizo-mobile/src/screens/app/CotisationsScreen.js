import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import KCard from '../../components/common/KCard';
import KBadge from '../../components/common/KBadge';
import useThemeStore from '../../store/themeStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const TABS = ['Creees', 'Participations'];

export default function CotisationsScreen({ navigation }) {
  const { colors } = useThemeStore();
  const [tab, setTab] = useState(0);
  const [creees, setCreees] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async () => {
    try {
      const [creesRes, partRes] = await Promise.all([
        api.get(ENDPOINTS.cotisations),
        api.get(ENDPOINTS.mesParticipations),
      ]);
      setCreees(creesRes.data);
      setParticipations(partRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  const data = tab === 0 ? creees : participations;

  const renderCotisation = ({ item }) => {
    const progression = item.progression || 0;
    const estPayee = item.statut === 'paye';
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('DetailCotisation', { slug: item.slug || item.cotisation?.slug || item.cotisation_slug })}
        activeOpacity={0.8}
      >
        <KCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardNom, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.nom || item.cotisation_nom || 'Cotisation'}
            </Text>
            <KBadge
              label={item.statut || 'active'}
              variant={
                item.statut === 'complete' || item.statut === 'paye' ? 'success' :
                item.statut === 'expiree' ? 'warning' :
                item.statut === 'active' || item.statut === 'en_attente' ? 'info' : 'info'
              }
            />
          </View>

          {tab === 0 && (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
                    {item.participants_payes}/{item.nombre_participants}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="cash-outline" size={14} color={colors.textTertiary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
                    {Number(item.montant_unitaire).toLocaleString()} FCFA
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
                    {new Date(item.date_expiration).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, {
                  width: `${progression}%`,
                  backgroundColor: progression === 100 ? colors.success : colors.primary,
                }]} />
              </View>
            </>
          )}

          {tab === 1 && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="cash-outline" size={14} color={colors.textTertiary} />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
                  {Number(item.montant).toLocaleString()} FCFA
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
                  {new Date(item.date_participation).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </View>
          )}
        </KCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Cotisations</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreerCotisation')}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.cardSecondary }]}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, i === tab && { backgroundColor: colors.primary }]}
            onPress={() => setTab(i)}
          >
            <Text style={{
              color: i === tab ? '#FFF' : colors.textSecondary,
              fontSize: 13,
              fontWeight: '600',
            }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, i) => String(item.id || i)}
        renderItem={renderCotisation}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color={colors.textTertiary} />
            <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
              {loading ? 'Chargement...' : tab === 0 ? 'Aucune cotisation creee' : 'Aucune participation'}
            </Text>
            {!loading && tab === 0 && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('CreerCotisation')}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Creer une cotisation</Text>
              </TouchableOpacity>
            )}
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
  newBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  card: { marginBottom: 10, padding: 14 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardNom: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
});