import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KButton from '../../components/common/KButton';
import KInput from '../../components/common/KInput';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import KToast from '../../components/common/KToast';

export default function ConnexionScreen({ navigation }) {
  const { colors } = useThemeStore();
  const { connexion } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const handleConnexion = async () => {
    if (!email || !password) {
      setToast({ visible: true, message: 'Remplissez tous les champs' });
      return;
    }
    setToast({ ...toast, visible: false });
    setLoading(true);
    try {
      await connexion(email, password);
    } catch (e) {
      const msg = e.response?.data?.error || 'Erreur de connexion';
      setToast({ visible: true, message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KToast
        message={toast.message}
        type="error"
        visible={toast.visible}
        onHide={() => setToast({ ...toast, visible: false })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>k</Text>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Bon retour !</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Connectez-vous a votre compte Kotizo
            </Text>
          </View>

          <View style={styles.form}>
            <KInput
              label="Adresse email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <KInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity onPress={() => navigation.navigate('MotDePasseOublie')}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                Mot de passe oublie ?
              </Text>
            </TouchableOpacity>

            <KButton
              title="Se connecter"
              onPress={handleConnexion}
              loading={loading}
              style={{ marginTop: 8 }}
            />

            <View style={styles.separator}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <Text style={[styles.separatorText, { color: colors.textTertiary }]}>ou</Text>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Inscription')}
              style={[styles.registerBtn, { borderColor: colors.borderLight }]}
            >
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                Pas encore inscrit ?{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Creer un compte</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center' },
  form: {},
  forgotText: { fontSize: 13, marginBottom: 16, textAlign: 'right' },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  line: { flex: 1, height: 1 },
  separatorText: { fontSize: 13 },
  registerBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  registerText: { fontSize: 14 },
});