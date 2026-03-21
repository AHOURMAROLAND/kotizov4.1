import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import KButton from '../../components/common/KButton';
import KBadge from '../../components/common/KBadge';

export default function ProfilScreen() {
  const { colors, toggle } = useThemeStore();
  const { user, deconnexion } = useAuthStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.pseudo?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.pseudo, { color: colors.textPrimary }]}>
          @{user?.pseudo}
        </Text>

        {user?.nom_verifie && (
          <Text style={[styles.nom, { color: colors.textSecondary }]}>
            {user?.prenom} {user?.nom}
          </Text>
        )}

        <KBadge
          label={user?.niveau?.charAt(0).toUpperCase() + user?.niveau?.slice(1)}
          variant={user?.niveau || 'basique'}
          style={{ marginTop: 8 }}
        />

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow label="Email" value={user?.email} colors={colors} />
          <InfoRow label="Telephone" value={user?.telephone} colors={colors} />
          <InfoRow label="Code parrainage" value={user?.code_parrainage} colors={colors} />
        </View>

        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: colors.cardSecondary }]}
          onPress={toggle}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
            Changer le theme
          </Text>
        </TouchableOpacity>

        <KButton
          title="Se deconnecter"
          variant="danger"
          onPress={deconnexion}
          style={{ marginTop: 16 }}
        />
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, colors }) {
  return (
    <View style={styles.infoRow}>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 40 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  pseudo: { fontSize: 22, fontWeight: '700' },
  nom: { fontSize: 14, marginTop: 4 },
  infoCard: {
    width: '100%', borderRadius: 14, borderWidth: 1,
    marginTop: 24, marginBottom: 16,
  },
  infoRow: {
    padding: 14, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 4,
  },
  themeBtn: {
    width: '100%', padding: 14,
    borderRadius: 12, alignItems: 'center',
  },
});