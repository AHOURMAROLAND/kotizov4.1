import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import KButton from '../../components/common/KButton';
import KInput from '../../components/common/KInput';
import KCard from '../../components/common/KCard';
import KToast from '../../components/common/KToast';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export default function CreerQuickPayScreen({ navigation }) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    montant: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [quickpay, setQuickpay] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
  const [secondes, setSecondes] = useState(3600);

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
  };

  const update = (field) => (val) => setForm({ ...form, [field]: val });

  const calculerFrais = () => {
    const montant = parseFloat(form.montant);
    if (!montant || isNaN(montant)) return null;
    return {
      fraisKotizo: (montant * 0.005).toFixed(0),
      totalPayeur: (montant * 1.05).toFixed(0),
    };
  };

  const valider = () => {
    const e = {};
    if (!form.montant || isNaN(form.montant)) e.montant = 'Montant invalide';
    if (parseFloat(form.montant) < 200) e.montant = 'Minimum 200 FCFA';
    if (parseFloat(form.montant) > 250000) e.montant = 'Maximum 250 000 FCFA';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerer = async () => {
    if (!valider()) return;
    if (!user?.telephone) {
      showToast('Ajoutez votre numero Mobile Money dans votre profil', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(ENDPOINTS.quickpay, {
        montant: parseFloat(form.montant),
        numero_receveur: user.telephone,
        description: form.description,
      });
      setQuickpay(res.data);
      setSecondes(3600);
      const interval = setInterval(() => {
        setSecondes(s => {
          if (s <= 1) { clearInterval(interval); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      const msg = e.response?.status === 401
        ? 'Session expiree. Reconnectez-vous.'
        : e.response?.data?.error || 'Impossible de creer le Quick Pay';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePartager = async () => {
    if (!quickpay) return;
    await Share.share({
      message:
        `Kotizo — Demande de paiement\n\n` +
        `${user?.prenom} vous demande ${Number(quickpay.montant).toLocaleString()} FCFA\n` +
        (form.description ? `Note : ${form.description}\n\n` : '\n') +
        `Payez ici : kotizo.app/qp/${quickpay.code}\n` +
        `Ce lien expire dans 1 heure.`,
    });
  };

  const frais = calculerFrais();
  const minutes = Math.floor(secondes / 60);
  const secs = secondes % 60;

  if (quickpay) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KToast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={() => setToast({ ...toast, visible: false })}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => {
              setQuickpay(null);
              setForm({ montant: '', description: '' });
            }}>
              <Text style={{ color: colors.primary }}>Nouveau</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Quick Pay cree
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <KCard style={styles.ticketCard}>
            <View style={styles.ticketTop}>
              <View style={[styles.logoSmall, { backgroundColor: colors.primary }]}>
                <Text style={styles.logoLetter}>k</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: secondes > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                <View style={[styles.statusDot, { backgroundColor: secondes > 0 ? colors.success : colors.error }]} />
                <Text style={{ color: secondes > 0 ? colors.success : colors.error, fontSize: 12, fontWeight: '700' }}>
                  {secondes > 0 ? 'Actif' : 'Expire'}
                </Text>
              </View>
            </View>

            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>
              Code de paiement
            </Text>
            <Text style={[styles.codeValue, { color: colors.textPrimary }]}>
              {quickpay.code}
            </Text>

            <View style={[styles.separator, { borderColor: colors.border }]} />

            <Text style={[styles.montantLabel, { color: colors.textSecondary }]}>
              Le payeur versera
            </Text>
            <Text style={[styles.montantValue, { color: colors.primary }]}>
              {Number(quickpay.montant_avec_frais || (parseFloat(quickpay.montant) * 1.05)).toLocaleString()} FCFA
            </Text>
            <Text style={{ color: colors.textTertiary, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
              Vous recevrez {Number(quickpay.montant).toLocaleString()} FCFA sur {user?.telephone}
            </Text>

            <View style={[styles.separator, { borderColor: colors.border }]} />

            <View style={[styles.timerBox, { backgroundColor: secondes > 600 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }]}>
              <Ionicons
                name="time-outline"
                size={16}
                color={secondes > 600 ? colors.success : colors.error}
              />
              <Text style={{ color: secondes > 600 ? colors.success : colors.error, fontSize: 14, fontWeight: '700', marginLeft: 6 }}>
                Expire dans {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </Text>
            </View>

            {form.description ? (
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Note : {form.description}
              </Text>
            ) : null}
          </KCard>

          <KCard secondary style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Votre numero receveur</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                {user?.telephone}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Frais Kotizo (0,5%)</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
                {Number(quickpay.frais_kotizo || (parseFloat(quickpay.montant) * 0.005)).toFixed(0)} FCFA
              </Text>
            </View>
          </KCard>

          <KButton
            title="Partager le lien de paiement"
            onPress={handlePartager}
            style={{ marginBottom: 10 }}
          />
          <KButton
            title="Voir mes Quick Pay"
            onPress={() => navigation.goBack()}
            variant="secondary"
          />
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast({ ...toast, visible: false })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: colors.primary }}>Retour</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Nouveau Quick Pay
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <KCard secondary style={styles.receveurInfo}>
            <View style={styles.receveurRow}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Votre numero Mobile Money (receveur)
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 }}>
                  {user?.telephone || 'Non renseigne'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('ModifierProfil')}>
                <Text style={{ color: colors.primary, fontSize: 12 }}>Modifier</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>
              Le payeur versera sur ce numero. Modifiez votre profil pour changer de numero.
            </Text>
          </KCard>

          <KInput
            label="Montant demande (FCFA)"
            value={form.montant}
            onChangeText={update('montant')}
            keyboardType="numeric"
            error={errors.montant}
          />

          <KInput
            label="Note pour le payeur (optionnel)"
            value={form.description}
            onChangeText={update('description')}
            placeholder="Ex: Remboursement repas, participation..."
          />

          {frais && (
            <KCard secondary style={{ marginBottom: 16 }}>
              <View style={styles.fraisRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  Vous recevrez
                </Text>
                <Text style={{ color: colors.success, fontSize: 15, fontWeight: '700' }}>
                  {Number(form.montant).toLocaleString()} FCFA
                </Text>
              </View>
              <View style={[styles.fraisRow, { marginTop: 6 }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  Le payeur versera (frais 5%)
                </Text>
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>
                  {frais.totalPayeur} FCFA
                </Text>
              </View>
            </KCard>
          )}

          <KCard secondary style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} style={{ marginTop: 1 }} />
              <Text style={{ color: colors.textTertiary, fontSize: 12, lineHeight: 18, flex: 1 }}>
                Le lien expire automatiquement apres 1 heure. Le montant est reverse immediatement sur votre numero Mobile Money apres paiement.
              </Text>
            </View>
          </KCard>

          <KButton
            title="Generer le lien de paiement"
            onPress={handleGenerer}
            loading={loading}
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
  receveurInfo: { marginBottom: 16 },
  receveurRow: { flexDirection: 'row', alignItems: 'center' },
  fraisRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketCard: { marginBottom: 12, alignItems: 'center' },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  logoSmall: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  logoLetter: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  codeLabel: { fontSize: 12, marginBottom: 6 },
  codeValue: { fontSize: 36, fontWeight: '900', letterSpacing: 6, marginBottom: 16 },
  montantLabel: { fontSize: 12, marginBottom: 4 },
  montantValue: { fontSize: 34, fontWeight: '900', marginBottom: 4 },
  separator: {
    width: '100%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    justifyContent: 'center',
  },
  noteText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoCard: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});