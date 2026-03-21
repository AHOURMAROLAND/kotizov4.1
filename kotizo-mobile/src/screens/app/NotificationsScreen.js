import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KCard from '../../components/common/KCard';
import useThemeStore from '../../store/themeStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const TYPE_ICONS = {
  paiement_recu: '💰',
  cotisation_complete: '✅',
  cotisation_expiree: '⏰',
  verification_approuvee: '✓',
  verification_rejetee: '✗',
  sanction: '⚠',
  remboursement: '↩',
  ambassadeur: '★',
  promo_verification: '🏷',
  systeme: 'ℹ',
};

export default function NotificationsScreen({ navigation }) {
  const { colors } = useThemeStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async () => {
    try {
      const res = await api.get(ENDPOINTS.notifications);
      setNotifications(res.data);
    } catch {}
    setLoading(false);
  };

  const marquerLue = async (id) => {
    try {
      await api.post(ENDPOINTS.notifications + `${id}/lire/`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lue: true } : n)
      );
    } catch {}
  };

  const toutLire = async () => {
    try {
      await api.post(ENDPOINTS.toutLire);
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
    } catch {}
  };

  useEffect(() => { charger(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  const nonLues = notifications.filter(n => !n.lue).length;

  const renderNotif = ({ item }) => (
    <TouchableOpacity onPress={() => marquerLue(item.id)} activeOpacity={0.8}>
      <KCard style={[
        styles.notifCard,
        !item.lue && { borderLeftWidth: 3, borderLeftColor: colors.primary }
      ]}>
        <View style={styles.notifRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.cardSecondary }]}>
            <Text style={{ fontSize: 18 }}>
              {TYPE_ICONS[item.type_notification] || 'ℹ'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.notifTitre, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.titre}
            </Text>
            <Text style={[styles.notifMessage, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>
              {new Date(item.date_creation).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </Text>
          </View>
          {!item.lue && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </View>
      </KCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Notifications{nonLues > 0 ? ` (${nonLues})` : ''}
        </Text>
        {nonLues > 0 ? (
          <TouchableOpacity onPress={toutLire}>
            <Text style={{ color: colors.primary, fontSize: 13 }}>Tout lire</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotif}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.textSecondary }}>
              {loading ? 'Chargement...' : 'Aucune notification'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  notifCard: { marginBottom: 8, padding: 12 },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitre: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  notifMessage: { fontSize: 12, lineHeight: 18 },
  unreadDot: {
    width: 8, height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  empty: { alignItems: 'center', paddingTop: 60 },
});