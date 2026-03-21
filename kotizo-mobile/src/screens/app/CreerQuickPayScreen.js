import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KButton from '../../components/common/KButton';
import KInput from '../../components/common/KInput';
import KCard from '../../components/common/KCard';
import KBadge from '../../components/common/KBadge';
import useThemeStore from '../../store/themeStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export default function CreerQuickPayScreen({ navigation }) {
  const { colors } = useThemeStore();
  const [form, setForm] = useState({
    montant: '',
    numero_receveur: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [quickpay, setQuickpay] = useState(null);

  const update = (field) => (val) => setForm({ ...form, [field]: val });

  const calculerFrais = () => {
    const montant = parseFloat(form.montant);
    if (!montant) return null;
    return {
      fraisKotizo: (montant * 0.005).toFixed(0),
      totalParticipant: (montant * 1.05).toFixed(0),
    };
  };

  const valider = () => {
    const e = {};
    if (!form.montant || isNaN(form.montant)) e.montant = 'Montant invalide';
    if (parseFloat(form.montant) < 200) e.montant = 'Minimum 200 FCFA';
    if (parseFloat(form.montant) > 250000) e.montant = 'Maximum 250 000 FCFA';
    if (!form.numero_receveur) e.numero_receveur = 'Numero obligatoire';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerer = async () => {
    if (!valider()) return;
    setLoading(true);
    try {
      const res = await api.post(ENDPOINTS.quickpay, {
        montant: parseFloat(form.montant),
        numero_receveur: form.numero_receveur,
        description: form.description,
      });
      setQuickpay(res.data);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.error || 'Impossible de creer le Quick Pay');
    } finally {
      setLoading(false);
    }
  };

  const handlePartager = async () => {
    if (!quickpay) return;
    await Share.share({
      message: `Paiement Quick Pay Kotizo\n\nMontant : ${Number(quickpay.montant).toLocaleString()} FCFA\nCode : ${quickpay.code}\n\nPayez ici : kotizo.app/qp/${quickpay.code}`,
    });
  };

  const frais = calculerFrais();

  if (quickpay) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { setQuickpay(null); setForm({ montant: '', numero_receveur: '', description: '' }); }}>
              <Text style={{ color: colors.primary }}>Nouveau</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Quick Pay cree</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.ticketHeader}>
              <View style={[styles.logoSmall, { backgroundColor: colors.primary }]}>
                <Text style={styles.logoLetter}>k</Text>
              </View>
              <KBadge label="Actif" variant="success" />
            </View>

            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Code Quick Pay</Text>
            <Text style={[styles.code, { color: colors.textPrimary }]}>{quickpay.code}</Text>

            <Text style={[styles.montantLabel, { color: colors.textSecondary }]}>Montant a payer</Text>
            <Text style={[styles.montantAmount, { color: colors.primary }]}>
              {Number(quickpay.montant_avec_frais || (parseFloat(quickpay.montant) * 1.05)).toLocaleString()} FCFA
            </Text>
            <Text style={{ color: colors.textTertiary, fontSize: 11, textAlign: 'center', marginBottom: 16 }}>
              dont {Number(quickpay.frais_kotizo || (parseFloat(quickpay.montant) * 0.005)).toFixed(0)} FCFA de frais Kotizo
            </Text>

            <CountdownTimer expiration={quickpay.date_expiration} colors={colors} />

            {quickpay.description ? (
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {quickpay.description}
              </Text>
            ) : null}

            <View style={[styles.separator, { borderColor: colors.border }]} />
          </View>

          <KButton title="Partager sur WhatsApp" onPress={handlePartager} style={{ marginTop: 16 }} />
          <KButton
            title="Voir mes Quick Pay"
            onPress={() => navigation.navigate('QuickPay')}
            variant="secondary"
            style={{ marginTop: 10 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: colors.primary }}>Retour</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Nouveau Quick Pay</Text>
            <View style={{ width: 50 }} />
          </View>

          <KInput
            label="Montant (FCFA)"
            value={form.montant}
            onChangeText={update('montant')}
            keyboardType="numeric"
            error={errors.montant}
          />
          <KInput
            label="Numero receveur (+228...)"
            value={form.numero_receveur}
            onChangeText={update('numero_receveur')}
            keyboardType="phone-pad"
            error={errors.numero_receveur}
          />
          <KInput
            label="Note (optionnel)"
            value={form.description}
            onChangeText={update('description')}
          />

          {frais && (
            <KCard secondary style={{ marginBottom: 16 }}>
              <View style={styles.fraisRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Frais Kotizo (0,5%)</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{frais.fraisKotizo} FCFA</Text>
              </View>
              <View style={[styles.fraisRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 10 }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>Le payeur paiera</Text>
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>{frais.totalParticipant} FCFA</Text>
              </View>
            </KCard>
          )}

          <KCard secondary style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
              Le Quick Pay expire automatiquement apres 1 heure. Le montant vous est reverse automatiquement apres paiement.
            </Text>
          </KCard>

          <KButton title="Generer le Quick Pay" onPress={handleGenerer} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CountdownTimer({ expiration, colors }) {
  const [secondes, setSecondes] = React.useState(0);

  React.useEffect(() => {
    const calcul = () => {
      const diff = new Date(expiration) - new Date();
      setSecondes(Math.max(0, Math.floor(diff / 1000)));
    };
    calcul();
    const timer = setInterval(calcul, 1000);
    return () => clearInterval(timer);
  }, [expiration]);

  const minutes = Math.floor(secondes / 60);
  const secs = secondes % 60;

  return (
    <View style={[styles.timerBox, { backgroundColor: secondes > 300 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>Expire dans</Text>
      <Text style={{ color: secondes > 300 ? colors.success : colors.error, fontSize: 28, fontWeight: '800' }}>
        {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </Text>
    </View>
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
  fraisRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  ticketHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoSmall: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  logoLetter: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  codeLabel: { fontSize: 12, marginBottom: 6 },
  code: { fontSize: 32, fontWeight: '900', letterSpacing: 4, marginBottom: 20 },
  montantLabel: { fontSize: 12, marginBottom: 4 },
  montantAmount: { fontSize: 36, fontWeight: '900', marginBottom: 4 },
  description: { fontSize: 13, textAlign: 'center', marginTop: 8 },
  separator: { width: '100%', borderTopWidth: 1, marginVertical: 16, borderStyle: 'dashed' },
  timerBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
});