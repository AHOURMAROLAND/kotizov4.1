import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import KCard from '../../components/common/KCard';
import KBadge from '../../components/common/KBadge';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export default function DashboardScreen({ navigation }) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [cotisations, setCotisations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [nonLues, setNonLues] = useState(0);

  const chargerDonnees = async () => {
    try {
      const [statsRes, cotisRes, notifRes] = await Promise.all([
        api.get(ENDPOINTS.moiStats),
        api.get(ENDPOINTS.cotisations),
        api.get(ENDPOINTS.nonLues),
      ]);
      setStats(statsRes.data);
      setCotisations(cotisRes.data.slice(0, 3));
      setNonLues(notifRes.data.non_lues || 0);
    } catch (e) {}
  };

  useEffect(() => { chargerDonnees(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await chargerDonnees();
    setRefreshing(false);
  };

  const actions = [
    { label: 'Creer', icon: '+', screen: 'CreerCotisation', color: colors.primary },
    { label: 'Rejoindre', icon: '→', screen: 'Rejoindre', color: '#7C3AED' },
    { label: 'Quick Pay', icon: '⚡', screen: 'QuickPay', color: '#059669' },
    { label: 'Historique', icon: '☰', screen: 'Historique', color: '#F59E0B' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Bonjour,
            </Text>
            <Text style={[styles.pseudo, { color: colors.textPrimary }]}>
              @{user?.pseudo}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <KBadge
              label={user?.niveau?.charAt(0).toUpperCase() + user?.niveau?.slice(1)}
              variant={user?.niveau || 'basique'}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('NotificationsScreen')}
              style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              {nonLues > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>
                    {nonLues > 9 ? '9+' : nonLues}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <KCard style={styles.balanceCard}>
          <View style={[styles.balanceInner, { backgroundColor: colors.primary }]}>
            <Text style={styles.balanceLabel}>Total collecte ce mois</Text>
            <Text style={styles.balanceAmount}>
              {stats ? Number(stats.total_collecte).toLocaleString() : '0'} FCFA
            </Text>
            {user?.niveau === 'basique' && (
              <View style={styles.formuleInfo}>
                <Text style={styles.formuleText}>
                  {stats?.cotisations_jour || 0}/3 aujourd'hui · {stats?.cotisations_fenetre || 0}/12 cette semaine
                </Text>
              </View>
            )}
          </View>
        </KCard>

        <View style={styles.actionsRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                if (action.screen === 'QuickPay') {
                  navigation.getParent()?.navigate('QuickPay');
                } else {
                  navigation.navigate(action.screen);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Text style={{ color: action.color, fontSize: 18, fontWeight: '700' }}>
                  {action.icon}
                </Text>
              </View>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Cotisations actives
          </Text>
          {cotisations.length === 0 ? (
            <KCard style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Pas encore de cotisation
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Creez votre premiere cotisation et invitez vos proches
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('CreerCotisation')}
              >
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>
                  Creer ma premiere cotisation
                </Text>
              </TouchableOpacity>
            </KCard>
          ) : (
            cotisations.map((c) => (
              <CotisationMiniCard
                key={c.id}
                cotisation={c}
                colors={colors}
                onPress={() => navigation.navigate('DetailCotisation', { slug: c.slug })}
              />
            ))
          )}
        </View>

        {stats && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Resume
            </Text>
            <KCard>
              <View style={styles.statsRow}>
                <StatItem label="Cotisations creees" value={stats.nb_cotisations_creees} colors={colors} />
                <StatItem label="Participations" value={stats.nb_participations} colors={colors} />
                <StatItem label="Parrainages" value={stats.nb_parrainages} colors={colors} />
              </View>
            </KCard>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CotisationMiniCard({ cotisation, colors, onPress }) {
  const progression = cotisation.progression || 0;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <KCard style={{ marginBottom: 10 }}>
        <View style={styles.cotisRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cotisNom, { color: colors.textPrimary }]} numberOfLines={1}>
              {cotisation.nom}
            </Text>
            <Text style={[styles.cotisInfo, { color: colors.textSecondary }]}>
              {cotisation.participants_payes}/{cotisation.nombre_participants} · {Number(cotisation.montant_unitaire).toLocaleString()} FCFA
            </Text>
          </View>
          <KBadge label={`${progression}%`} variant={progression === 100 ? 'success' : 'info'} />
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, {
            width: `${progression}%`,
            backgroundColor: progression === 100 ? colors.success : colors.primary,
          }]} />
        </View>
      </KCard>
    </TouchableOpacity>
  );
}

function StatItem({ label, value, colors }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: { fontSize: 13 },
  pseudo: { fontSize: 22, fontWeight: '700' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4, right: -4,
    width: 18, height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  balanceCard: { marginHorizontal: 20, marginBottom: 16, padding: 0, overflow: 'hidden' },
  balanceInner: { padding: 24, borderRadius: 14 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6 },
  balanceAmount: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  formuleInfo: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  formuleText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 11, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  emptyCard: { alignItems: 'center', paddingVertical: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  cotisRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  cotisNom: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cotisInfo: { fontSize: 12 },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
});