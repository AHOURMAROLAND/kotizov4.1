import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KButton from '../../components/common/KButton';
import KInput from '../../components/common/KInput';
import useThemeStore from '../../store/themeStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export default function RejoindreScreen({ navigation }) {
  const { colors } = useThemeStore();
  const [slug, setSlug] = useState('');
  const [cotisation, setCotisation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rejoindreLoading, setRejoindreLoading] = useState(false);

  const handleRechercher = async () => {
    if (!slug.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(ENDPOINTS.cotisationPublique(slug.trim().toUpperCase()));
      setCotisation(res.data);
    } catch (e) {
      const code = e.response?.data?.code;
      if (code === 'lien_expire' || code === 'cotisation_expiree') {
        Alert.alert('Lien expire', 'Cette cotisation n\'existe plus ou a expire');
      } else {
        Alert.alert('Introuvable', 'Aucune cotisation trouvee avec ce code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejoindre = async () => {
    setRejoindreLoading(true);
    try {
      await api.post(ENDPOINTS.rejoindre(cotisation.slug));
      navigation.navigate('DetailCotisation', { slug: cotisation.slug });
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.error || 'Impossible de rejoindre');
    } finally {
      setRejoindreLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Rejoindre une cotisation</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Entrez le code de la cotisation (ex: KTZ-XXXXXX)
        </Text>

        <View style={styles.searchRow}>
          <KInput
            label="Code KTZ-XXXXXX"
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="characters"
            style={{ flex: 1, marginBottom: 0 }}
          />
          <KButton
            title="OK"
            onPress={handleRechercher}
            loading={loading}
            style={styles.searchBtn}
          />
        </View>

        {cotisation && (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cotisNom, { color: colors.textPrimary }]}>{cotisation.nom}</Text>
            <Text style={[styles.cotisInfo, { color: colors.textSecondary }]}>
              par @{cotisation.createur_pseudo}
            </Text>
            <View style={styles.montantRow}>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Montant unitaire</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
                  {Number(cotisation.montant_unitaire).toLocaleString()} FCFA
                </Text>
              </View>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Total avec frais (5%)</Text>
                <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}>
                  {Number(cotisation.montant_total_avec_frais).toLocaleString()} FCFA
                </Text>
              </View>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, {
                width: `${cotisation.progression}%`,
                backgroundColor: colors.primary,
              }]} />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
              {cotisation.participants_payes}/{cotisation.nombre_participants} participants · {cotisation.progression}%
            </Text>
            <KButton
              title="Rejoindre cette cotisation"
              onPress={handleRejoindre}
              loading={rejoindreLoading}
              style={{ marginTop: 16 }}
              disabled={cotisation.ma_participation !== null}
            />
            {cotisation.ma_participation && (
              <Text style={{ color: colors.success, textAlign: 'center', marginTop: 8, fontSize: 13 }}>
                Vous participez deja a cette cotisation
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 13, marginBottom: 24, lineHeight: 20 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 20 },
  searchBtn: { width: 64, marginTop: 0 },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cotisNom: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cotisInfo: { fontSize: 13, marginBottom: 16 },
  montantRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});