import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KButton from '../../components/common/KButton';
import useThemeStore from '../../store/themeStore';

export default function VerificationScreen({ navigation, route }) {
  const { colors } = useThemeStore();
  const { email, whatsapp_lien } = route.params || {};
  const [secondes, setSecondes] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondes((s) => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleWhatsApp = async () => {
    if (whatsapp_lien) {
      const supported = await Linking.canOpenURL(whatsapp_lien);
      if (supported) {
        await Linking.openURL(whatsapp_lien);
      } else {
        Alert.alert('Erreur', 'WhatsApp n\'est pas installe sur cet appareil');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
          <Text style={styles.icon}>?</Text>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Verifiez votre compte
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Validez via WhatsApp ou email pour activer votre compte.{'\n'}
          Au moins un canal est obligatoire.
        </Text>

        {secondes > 0 ? (
          <View style={[styles.timerBox, { backgroundColor: colors.cardSecondary }]}>
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Expire dans</Text>
            <Text style={[styles.timer, { color: colors.primary }]}>{formatTime(secondes)}</Text>
          </View>
        ) : (
          <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 16 }}>
            Les liens ont expire. Regenerez-les.
          </Text>
        )}

        <KButton
          title="Confirmer via WhatsApp"
          onPress={handleWhatsApp}
          style={[styles.btn, { backgroundColor: '#25D366' }]}
        />

        <KButton
          title="Envoyer l'email de verification"
          variant="secondary"
          onPress={() => Alert.alert('Email envoye', `Verifiez votre boite : ${email}`)}
          style={styles.btn}
        />

        <Text style={[styles.note, { color: colors.textTertiary }]}>
          Votre compte sera supprime automatiquement apres 48h si non verifie.
        </Text>

        <TouchableOpacity onPress={() => navigation.navigate('Connexion')}>
          <Text style={{ color: colors.primary, textAlign: 'center', marginTop: 20 }}>
            Deja verifie ? Se connecter
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, alignItems: 'center', paddingTop: 60 },
  iconBox: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  icon: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  timerBox: {
    padding: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 24, width: '100%',
  },
  timerLabel: { fontSize: 12, marginBottom: 4 },
  timer: { fontSize: 32, fontWeight: '700' },
  btn: { width: '100%', marginBottom: 12 },
  note: { fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});