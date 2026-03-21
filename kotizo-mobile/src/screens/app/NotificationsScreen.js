import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../../store/themeStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const TYPE_CONFIG = {
  paiement_recu: {
    icon: 'arrow-down-circle',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
  },
  cotisation_complete: {
    icon: 'checkmark-circle',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
  },
  cotisation_expiree: {
    icon: 'time',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
  },
  quickpay_expire: {
    icon: 'flash',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
  },
  verification_approuvee: {
    icon: 'shield-checkmark',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
  },
  verification_rejetee: {
    icon: 'shield',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
  },
  sanction: {
    icon: 'warning',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
  },
  remboursement: {
    icon: 'refresh-circle',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
  },
  ambassadeur: {
    icon: 'star',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
  },
  promo_verification: {
    icon: 'pricetag',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.12)',
  },
  systeme: {
    icon: 'information-circle',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
  },
  whatsapp_panne: {
    icon: 'logo-whatsapp',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
  },
  rappel: {
    icon: 'notifications',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
  },
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `Il y a ${diffD} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function groupByDate(notifications) {
  const groups = {};
  notifications.forEach((n) => {
    const date = new Date(n.date_creation);
    const now = new Date();
    const diffD = Math.floor((now - date) / 86400000);
    let key = diffD === 0 ? "Aujourd'hui" : diffD === 1 ? 'Hier' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
}

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
      await api.post(`/notifications/${id}/lire/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
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
  const groups = groupByDate(notifications);
  const sections = Object.entries(groups);

  const renderNotif = (item) => {
    const config = TYPE_CONFIG[item.type_notification] || TYPE_CONFIG.systeme;
    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => marquerLue(item.id)}
        activeOpacity={0.75}
        style={[
          styles.notifCard,
          {
            backgroundColor: colors.card,
            borderColor: !item.lue ? colors.primary + '40' : colors.border,
            borderWidth: !item.lue ? 1 : 1,
          },
        ]}
      >
        {!item.lue && (
          <View style={[styles.unreadBar, { backgroundColor: colors.primary }]} />
        )}
        <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>
        <View style={styles.notifBody}>
          <View style={styles.notifTop}>
            <Text style={[styles.notifTitre, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.titre}
            </Text>
            <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
              {formatDate(item.date_creation)}
            </Text>
          </View>
          <Text style={[styles.notifMessage, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
          {nonLues > 0 && (
            <Text style={[styles.nonLues, { color: colors.textSecondary }]}>
              {nonLues} non {nonLues > 1 ? 'lues' : 'lue'}
            </Text>
          )}
        </View>
        {nonLues > 0 ? (
          <TouchableOpacity
            onPress={toutLire}
            style={[styles.toutLireBtn, { backgroundColor: colors.primary + '20' }]}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
              Tout lire
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 72 }} />
        )}
      </View>

      {nonLues > 0 && (
        <View style={[styles.summaryBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Ionicons name="notifications" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600', marginLeft: 8 }}>
            {nonLues} nouvelle{nonLues > 1 ? 's' : ''} notification{nonLues > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.textTertiary }}>Chargement...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.cardSecondary }]}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Aucune notification
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Vos notifications apparaitront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={([key]) => key}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item: [dateLabel, notifs] }) => (
            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>{dateLabel}</Text>
              {notifs.map(renderNotif)}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  nonLues: { fontSize: 12, marginTop: 1 },
  toutLireBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  group: { marginBottom: 8 },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 4,
  },
  notifBody: { flex: 1 },
  notifTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitre: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  notifTime: { fontSize: 11 },
  notifMessage: { fontSize: 13, lineHeight: 19 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: {
    width: 80, height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});