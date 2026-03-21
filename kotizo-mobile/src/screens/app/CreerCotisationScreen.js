import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KButton from '../../components/common/KButton';
import KInput from '../../components/common/KInput';
import KCard from '../../components/common/KCard';
import useThemeStore from '../../store/themeStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export default function CreerCotisationScreen({ navigation }) {
  const { colors } = useThemeStore();
  const [form, setForm] = useState({
    nom: '',
    description: '',
    montant_unitaire: '',
    nombre_participants: '',
    numero_receveur: '',
    est_recurrente: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (field) => (val) => setForm({ ...form, [field]: val });

  const calculerFrais = () => {
    const montant = parseFloat(form.montant_unitaire);
    if (!montant) return null;
    const fraisKotizo = montant * 0.005;
    const totalParticipant = montant * 1.05;
    const totalGeneral = totalParticipant * (parseInt(form.nombre_participants) || 1);
    return { fraisKotizo, totalParticipant, totalGeneral };
  };

  const valider = () => {
    const e = {};
    if (!form.nom) e.nom = 'Nom obligatoire';
    if (!form.montant_unitaire || isNaN(form.montant_unitaire)) e.montant_unitaire = 'Montant invalide';
    if (parseFloat(form.montant_unitaire) < 200) e.montant_unitaire = 'Minimum 200 FCFA';
    if (parseFloat(form.montant_unitaire) > 250000) e.montant_unitaire = 'Maximum 250 000 FCFA';
    if (!form.nombre_participants || parseInt(form.nombre_participants) < 2) e.nombre_participants = 'Minimum 2 participants';
    if (!form.numero_receveur) e.numero_receveur = 'Numero obligatoire';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreer = async () => {
    if (!valider()) return;
    setLoading(true);
    try {
      const dateExpiration = new Date();
      dateExpiration.setDate(dateExpiration.getDate() + 7);

      const res = await api.post(ENDPOINTS.cotisations, {
        ...form,
        montant_unitaire: parseFloat(form.montant_unitaire),
        nombre_participants: parseInt(form.nombre_participants),
        date_expiration: dateExpiration.toISOString(),
      });

      navigation.replace('DetailCotisation', {
        slug: res.data.slug,
        created: true,
      });
    } catch (e) {
      const data = e.response?.data;
      if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        Alert.alert('Erreur', Array.isArray(firstVal) ? firstVal[0] : String(firstVal));
      } else {
        Alert.alert('Erreur', 'Impossible de creer la cotisation');
      }
    } finally {
      setLoading(false);
    }
  };

  const frais = calculerFrais();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: colors.primary }}>Retour</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Nouvelle cotisation</Text>
            <View style={{ width: 50 }} />
          </View>

          <KInput label="Nom de la cotisation" value={form.nom} onChangeText={update('nom')} error={errors.nom} />
          <KInput label="Description (optionnel)" value={form.description} onChangeText={update('description')} />
          <KInput
            label="Montant unitaire (FCFA)"
            value={form.montant_unitaire}
            onChangeText={update('montant_unitaire')}
            keyboardType="numeric"
            error={errors.montant_unitaire}
          />
          <KInput
            label="Nombre de participants"
            value={form.nombre_participants}
            onChangeText={update('nombre_participants')}
            keyboardType="numeric"
            error={errors.nombre_participants}
          />
          <KInput
            label="Numero receveur (+228...)"
            value={form.numero_receveur}
            onChangeText={update('numero_receveur')}
            keyboardType="phone-pad"
            error={errors.numero_receveur}
          />

          {frais && (
            <KCard secondary style={styles.fraisCard}>
              <Text style={[styles.fraisTitle, { color: colors.textSecondary }]}>Apercu des frais</Text>
              <View style={styles.fraisRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Montant unitaire</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                  {Number(form.montant_unitaire).toLocaleString()} FCFA
                </Text>
              </View>
              <View style={styles.fraisRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Frais Kotizo (0,5%)</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {frais.fraisKotizo.toFixed(0)} FCFA
                </Text>
              </View>
              <View style={[styles.fraisRow, styles.fraisTotal]}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  Total par participant
                </Text>
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>
                  {frais.totalParticipant.toFixed(0)} FCFA
                </Text>
              </View>
            </KCard>
          )}

          <TouchableOpacity
            style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setForm({ ...form, est_recurrente: !form.est_recurrente })}
          >
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                Cotisation recurrente (tontine)
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                Renouvellement mensuel automatique
              </Text>
            </View>
            <View style={[
              styles.toggle,
              { backgroundColor: form.est_recurrente ? colors.primary : colors.border }
            ]}>
              <View style={[
                styles.toggleThumb,
                { transform: [{ translateX: form.est_recurrente ? 20 : 2 }] }
              ]} />
            </View>
          </TouchableOpacity>

          <KButton
            title="Creer la cotisation"
            onPress={handleCreer}
            loading={loading}
            style={{ marginTop: 16 }}
          />
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: { fontSize: 18, fontWeight: '700' },
  fraisCard: { marginBottom: 16 },
  fraisTitle: { fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  fraisRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  fraisTotal: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 10 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
});