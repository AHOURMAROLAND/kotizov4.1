import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Share, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KCard from '../../components/common/KCard';
import KBadge from '../../components/common/KBadge';
import KButton from '../../components/common/KButton';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export default function DetailCotisationScreen({ navigation, route }) {
  const { slug, created } = route.params;
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [cotisation, setCotisation] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rappelLoading, setRappelLoading] = useState(false);

  const charger = useCallback(async () => {
    try {
      const res = await api.get(ENDPOINTS.cotisationDetail(slug));
      setCotisation(res.data);
      if (res.data.est_createur) {
        const pRes = await api.get(ENDPOINTS.participants(slug));
        setParticipants(pRes.data);
      }
    } catch {}
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    charger();
    if (created) Alert.alert('Cotisation creee', 'Partagez le lien pour inviter les participants');
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  const handlePartager = async () => {
    if (!cotisation) return;
    await Share.share({
      message: `Rejoignez ma cotisation "${cotisation.nom}" sur Kotizo !\n\nMontant : ${Number(cotisation.montant_unitaire).toLocaleString()} FCFA\n\nLien : kotizo.app/c/${cotisation.slug}`,
    });
  };

  const handleRappeler = async () => {
    setRappelLoading(true);
    try {
      const res = await api.post(ENDPOINTS.rappeler(slug));
      Alert.alert('Rappels envoyes', res.data.message);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer les rappels');
    } finally {
      setRappelLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cotisation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.error }}>Cotisation introuvable</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary, marginTop: 12 }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progression = cotisation.progression || 0;
  const estCreateur = cotisation.est_createur;

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
          <KBadge
            label={cotisation.statut}
            variant={cotisation.statut === 'active' ? 'success' : cotisation.statut === 'complete' ? 'info' : 'warning'}
          />
        </View>

        <View style={styles.titleSection}>
          <Text style={[styles.nom, { color: colors.textPrimary }]}>{cotisation.nom}</Text>
          <Text style={[styles.createur, { color: colors.textSecondary }]}>
            par @{cotisation.createur_pseudo}
            {cotisation.createur_nom ? ` · ${cotisation.createur_nom}` : ''}
          </Text>
        </View>

        <KCard style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Progression</Text>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>{progression}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, {
              width: `${progression}%`,
              backgroundColor: progression === 100 ? colors.success : colors.primary,
            }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {cotisation.participants_payes}/{cotisation.nombre_participants} participants
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
              {Number(cotisation.montant_collecte).toLocaleString()} FCFA collectes
            </Text>
          </View>
        </KCard>

        <KCard secondary style={styles.detailsCard}>
          <DetailRow label="Montant unitaire" value={`${Number(cotisation.montant_unitaire).toLocaleString()} FCFA`} colors={colors} />
          <DetailRow label="Frais Kotizo (0,5%)" value={`${Number(cotisation.frais_kotizo).toLocaleString()} FCFA`} colors={colors} />
          <DetailRow label="Total par participant" value={`${Number(cotisation.montant_total_avec_frais).toLocaleString()} FCFA`} colors={colors} highlight />
          <DetailRow label="Code" value={cotisation.slug} colors={colors} />
        </KCard>

        <View style={styles.actionsSection}>
          <KButton title="Partager" onPress={handlePartager} variant="secondary" style={{ flex: 1 }} />
          {estCreateur && (
            <KButton
              title="Rappeler"
              onPress={handleRappeler}
              loading={rappelLoading}
              variant="secondary"
              style={{ flex: 1 }}
            />
          )}
        </View>

        {!estCreateur && cotisation.ma_participation?.statut === 'en_attente' && (
          <KButton
            title="Payer maintenant"
            onPress={() => navigation.navigate('Paiement', { slug })}
            style={{ marginHorizontal: 20, marginBottom: 12 }}
          />
        )}

        {estCreateur && participants.length > 0 && (
          <View style={styles.participantsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Participants ({participants.length})
            </Text>
            {participants.map((p, i) => (
              <KCard key={i} style={{ marginBottom: 8 }}>
                <View style={styles.participantRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>
                      {p.participant_pseudo?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                      @{p.participant_pseudo}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {p.participant_telephone}
                    </Text>
                  </View>
                  <KBadge
                    label={p.statut === 'paye' ? 'Paye' : 'En attente'}
                    variant={p.statut === 'paye' ? 'success' : 'warning'}
                  />
                </View>
              </KCard>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, colors, highlight = false }) {
  return (
    <View style={styles.detailRow}>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{
        color: highlight ? colors.primary : colors.textPrimary,
        fontSize: highlight ? 15 : 13,
        fontWeight: highlight ? '700' : '600',
      }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  titleSection: { paddingHorizontal: 20, marginBottom: 16 },
  nom: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  createur: { fontSize: 13 },
  progressCard: { marginHorizontal: 20, marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between' },
  detailsCard: { marginHorizontal: 20, marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  participantsSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});