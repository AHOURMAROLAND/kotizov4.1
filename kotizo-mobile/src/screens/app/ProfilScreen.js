import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import KCard from '../../components/common/KCard';
import KBadge from '../../components/common/KBadge';

export default function ProfilScreen({ navigation }) {
  const { colors, toggle, isDark } = useThemeStore();
  const { user, deconnexion } = useAuthStore();

  const handleDeconnexion = () => {
    Alert.alert('Deconnexion', 'Etes-vous sur de vouloir vous deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se deconnecter', style: 'destructive', onPress: deconnexion },
    ]);
  };

  const menuItems = [
    { label: 'Statistiques', icon: '◎', screen: 'Statistiques', color: colors.primary },
    { label: 'Notifications', icon: '◌', screen: 'NotificationsScreen', color: '#7C3AED' },
    { label: 'Agent IA', icon: '★', screen: 'AgentIA', color: '#059669' },
    { label: 'Verification identite', icon: '✓', screen: 'VerificationProfil', color: '#F59E0B' },
    { label: 'Historique', icon: '☰', screen: 'Historique', color: colors.textSecondary },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.pseudo?.charAt(0)?.toUpperCase()}
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
            label={user?.niveau?.charAt(0)?.toUpperCase() + user?.niveau?.slice(1)}
            variant={user?.niveau || 'basique'}
            style={{ marginTop: 8 }}
          />
        </View>

        <KCard secondary style={styles.infoCard}>
          <InfoRow label="Email" value={user?.email} colors={colors} />
          <InfoRow label="Telephone" value={user?.telephone} colors={colors} />
          <InfoRow label="Code parrainage" value={user?.code_parrainage} colors={colors} />
          <InfoRow
            label="Cotisations aujourd'hui"
            value={`${user?.cotisations_creees_aujourd_hui || 0}/3`}
            colors={colors}
          />
        </KCard>

        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Text style={{ color: item.color, fontSize: 16 }}>{item.icon}</Text>
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              <Text style={{ color: colors.textTertiary }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.themeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={toggle}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Theme {isDark ? 'sombre' : 'clair'}
          </Text>
          <View style={[styles.toggle, { backgroundColor: isDark ? colors.primary : colors.border }]}>
            <View style={[styles.toggleThumb, { transform: [{ translateX: isDark ? 20 : 2 }] }]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deconnexionBtn, { borderColor: colors.error }]}
          onPress={handleDeconnexion}
        >
          <Text style={{ color: colors.error, fontWeight: '700', fontSize: 15 }}>
            Se deconnecter
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, colors }) {
  return (
    <View style={styles.infoRow}>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
        {value || '-'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  pseudo: { fontSize: 22, fontWeight: '700' },
  nom: { fontSize: 14, marginTop: 4 },
  infoCard: { marginHorizontal: 20, marginBottom: 16, padding: 0 },
  infoRow: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 4,
  },
  menuSection: { paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  menuIcon: {
    width: 36, height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  themeToggle: {
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  toggle: {
    width: 44, height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
  },
  deconnexionBtn: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
});