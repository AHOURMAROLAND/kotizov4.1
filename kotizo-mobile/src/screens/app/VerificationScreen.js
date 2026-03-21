import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KButton from '../../components/common/KButton';
import KCard from '../../components/common/KCard';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';

export default function VerificationProfilScreen({ navigation }) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const etapes = [
    { id: 1, label: 'Photo recto document', done: false, icon: 'id-card' },
    { id: 2, label: 'Photo verso document', done: false, icon: 'id-card' },
    { id: 3, label: 'Verification du visage', done: false, icon: 'eye' },
  ];

  const [etapeActive, setEtapeActive] = useState(0);

  if (user?.niveau === 'verifie' || user?.niveau === 'business') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.primary }}>Retour</Text>
          </TouchableOpacity>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
            <Text style={{ fontSize: 40 }}>✓</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Identite verifiee
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Votre identite a deja ete verifiee avec succes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary, marginBottom: 20 }}>Retour</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Verification d'identite
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Verifiez votre identite pour acceder au niveau Verifie et cotiser sans limites.
        </Text>

        <KCard secondary style={styles.prixCard}>
          <View style={styles.prixRow}>
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Cout de verification</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800' }}>
                1 000 FCFA
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
              <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>Paiement unique</Text>
            </View>
          </View>
        </KCard>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Etapes requises
        </Text>

        {etapes.map((etape, i) => (
          <KCard key={etape.id} style={[styles.etapeCard, i === etapeActive && { borderColor: colors.primary, borderWidth: 1 }]}>
            <View style={styles.etapeRow}>
              <View style={[styles.etapeNum, {
                backgroundColor: etape.done ? colors.success : i === etapeActive ? colors.primary : colors.cardSecondary,
              }]}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>
                  {etape.done ? '✓' : etape.id}
                </Text>
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 }}>
                {etape.label}
              </Text>
              {i === etapeActive && (
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                  En cours
                </Text>
              )}
            </View>
          </KCard>
        ))}

        <KCard secondary style={styles.avantagesCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
            Avantages Verifie
          </Text>
          {[
            '20 cotisations par jour (au lieu de 3)',
            'Coche verte sur votre profil',
            'Nom complet visible sur les recus',
            'Acces aux fonctionnalites avancees',
          ].map((a, i) => (
            <View key={i} style={styles.avantageRow}>
              <Text style={{ color: colors.success }}>✓</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1 }}>{a}</Text>
            </View>
          ))}
        </KCard>

        <KButton
          title="Commencer la verification"
          onPress={() => Alert.alert(
            'Verification',
            'La verification d\'identite complete sera disponible dans la prochaine mise a jour. Contactez le support pour une verification manuelle.',
            [{ text: 'OK' }]
          )}
          style={{ marginTop: 8 }}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 40 },
  scrollContent: { padding: 20 },
  iconBox: {
    width: 80, height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  prixCard: { marginBottom: 20 },
  prixRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  etapeCard: { marginBottom: 8 },
  etapeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  etapeNum: {
    width: 32, height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avantagesCard: { marginBottom: 16 },
  avantageRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
});