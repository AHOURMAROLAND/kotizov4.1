import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KButton from '../../components/common/KButton';
import KInput from '../../components/common/KInput';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import useThemeStore from '../../store/themeStore';

export default function InscriptionScreen({ navigation }) {
  const { colors } = useThemeStore();
  const [form, setForm] = useState({
    prenom: '', nom: '', pseudo: '', email: '',
    telephone: '', password: '', password_confirm: '',
    code_parrainage_parrain: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cgu, setCgu] = useState(false);

  const update = (field) => (val) => setForm({ ...form, [field]: val });

  const handleInscription = async () => {
    if (!form.prenom || !form.nom || !form.pseudo || !form.email || !form.password) {
      setError('Remplissez tous les champs obligatoires');
      return;
    }
    if (!cgu) {
      setError('Acceptez les CGU pour continuer');
      return;
    }
    if (form.password !== form.password_confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post(ENDPOINTS.inscription, {
        ...form,
        pays: 'TG',
        cgu_acceptees: true,
        politique_confidentialite: true,
        age_confirme: true,
      });
      navigation.navigate('Verification', {
        email: form.email,
        whatsapp_lien: res.data.whatsapp_lien,
        whatsapp_token: res.data.whatsapp_token,
      });
    } catch (e) {
      const data = e.response?.data;
      if (typeof data === 'object') {
        const firstError = Object.values(data)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError('Erreur lors de la creation du compte');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={{ color: colors.primary }}>Retour</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Creer un compte</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Rejoignez Kotizo et cotisez ensemble
          </Text>

          <KInput label="Prenom" value={form.prenom} onChangeText={update('prenom')} autoCapitalize="words" />
          <KInput label="Nom" value={form.nom} onChangeText={update('nom')} autoCapitalize="words" />
          <KInput label="Pseudo (ex: @kotizo)" value={form.pseudo} onChangeText={update('pseudo')} />
          <KInput label="Email" value={form.email} onChangeText={update('email')} keyboardType="email-address" />
          <KInput label="Telephone (+228...)" value={form.telephone} onChangeText={update('telephone')} keyboardType="phone-pad" />
          <KInput label="Mot de passe" value={form.password} onChangeText={update('password')} secureTextEntry />
          <KInput label="Confirmer le mot de passe" value={form.password_confirm} onChangeText={update('password_confirm')} secureTextEntry />
          <KInput label="Code parrainage (optionnel)" value={form.code_parrainage_parrain} onChangeText={update('code_parrainage_parrain')} />

          <TouchableOpacity style={styles.checkRow} onPress={() => setCgu(!cgu)}>
            <View style={[styles.checkbox, { borderColor: cgu ? colors.primary : colors.border, backgroundColor: cgu ? colors.primary : 'transparent' }]}>
              {cgu && <Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text>}
            </View>
            <Text style={[styles.checkText, { color: colors.textSecondary }]}>
              J'accepte les CGU, la politique de confidentialite et j'ai 18 ans ou plus
            </Text>
          </TouchableOpacity>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <KButton title="Creer mon compte" onPress={handleInscription} loading={loading} style={{ marginTop: 8 }} />

          <TouchableOpacity onPress={() => navigation.navigate('Connexion')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              Deja inscrit ? <Text style={{ color: colors.primary, fontWeight: '700' }}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 20 },
  back: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  checkText: { flex: 1, fontSize: 13, lineHeight: 20 },
  errorBox: { padding: 12, borderRadius: 10, marginBottom: 12 },
});