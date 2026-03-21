import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KCard from '../../components/common/KCard';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const PERIODES = ['Semaine', 'Mois', 'Annee'];

export default function StatistiquesScreen({ navigation }) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [periode, setPeriode] = useState(1);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async () => {
    try {
      const res = await api.get(ENDPOINTS.moiStats);
      setStats(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary }}>Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Statistiques</Text>
          <View style={{ width: 50 }} />
        </View>

        <KCard style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Total collecte</Text>
          <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '900', marginTop: 4 }}>
            {stats ? Number(stats.total_collecte).toLocaleString() : '0'} FCFA
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 6 }}>
            @{user?.pseudo} · Niveau {user?.niveau}
          </Text>
        </KCard>

        <View style={[styles.periodeSelector, { backgroundColor: colors.cardSecondary }]}>
          {PERIODES.map((p, i) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodeBtn, i === periode && { backgroundColor: colors.primary }]}
              onPress={() => setPeriode(i)}
            >
              <Text style={{
                color: i === periode ? '#FFF' : colors.textSecondary,
                fontSize: 13,
                fontWeight: '600',
              }}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Cotisations creees"
            value={stats?.nb_cotisations_creees || 0}
            colors={colors}
            color={colors.primary}
          />
          <StatCard
            label="Participations"
            value={stats?.nb_participations || 0}
            colors={colors}
            color="#7C3AED"
          />
          <StatCard
            label="Parrainages actifs"
            value={stats?.nb_parrainages || 0}
            colors={colors}
            color="#059669"
          />
          <StatCard
            label="Messages IA restants"
            value={
              user?.niveau === 'business'
                ? 'Illimite'
                : user?.niveau === 'verifie'
                ? `${25 - (stats?.messages_ia_jour || 0)}/25`
                : `${3 - (stats?.messages_ia_jour || 0)}/3`
            }
            colors={colors}
            color="#F59E0B"
          />
        </View>

        {user?.niveau === 'basique' && (
          <KCard secondary style={styles.formuleCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Formule Basique
            </Text>
            <View style={styles.formuleRow}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Aujourd'hui</Text>
              <ProgressBar
                value={stats?.cotisations_jour || 0}
                max={3}
                colors={colors}
              />
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                {stats?.cotisations_jour || 0}/3
              </Text>
            </View>
            <View style={styles.formuleRow}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Cette semaine</Text>
              <ProgressBar
                value={stats?.cotisations_fenetre || 0}
                max={12}
                colors={colors}
              />
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                {stats?.cotisations_fenetre || 0}/12
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Verification')}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
                Passer au niveau Verifie
              </Text>
            </TouchableOpacity>
          </KCard>
        )}

        {(stats?.peut_verifie_ambassadeur || stats?.peut_business_ambassadeur) && (
          <KCard style={styles.ambassadeurCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Ambassadeur
            </Text>
            {stats?.peut_verifie_ambassadeur && (
              <Text style={{ color: colors.success, fontSize: 13 }}>
                Vous etes eligible au niveau Verifie gratuit !
              </Text>
            )}
            {stats?.peut_business_ambassadeur && (
              <Text style={{ color: colors.primary, fontSize: 13 }}>
                Vous etes eligible au niveau Business gratuit !
              </Text>
            )}
          </KCard>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, colors, color }) {
  return (
    <KCard style={styles.statCard}>
      <Text style={{ color, fontSize: 28, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 16 }}>
        {label}
      </Text>
    </KCard>
  );
}

function ProgressBar({ value, max, colors }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={[styles.bar, { backgroundColor: colors.border, flex: 1, marginHorizontal: 10 }]}>
      <View style={[styles.barFill, {
        width: `${pct}%`,
        backgroundColor: pct >= 90 ? colors.error : colors.primary,
      }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: '700' },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 0,
  },
  periodeSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  periodeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: { width: '47%', padding: 16 },
  formuleCard: { marginHorizontal: 20, marginBottom: 12 },
  ambassadeurCard: { marginHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  formuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  upgradeBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
});