import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const SUGGESTIONS = [
  'Comment creer une cotisation ?',
  'C\'est quoi Quick Pay ?',
  'Comment me faire verifier ?',
  'Quels sont les frais Kotizo ?',
];

export default function AgentIAScreen({ navigation }) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [nbMessages, setNbMessages] = useState(0);
  const [limite, setLimite] = useState(null);
  const flatListRef = useRef(null);

  const chargerHistorique = async () => {
    try {
      const res = await api.get(ENDPOINTS.historiqueIA);
      setMessages(res.data.messages || []);
      setNbMessages(res.data.nb_messages || 0);
      setLimite(res.data.limite);
    } catch {}
  };

  useEffect(() => { chargerHistorique(); }, []);

  const envoyer = async (texte) => {
    const message = texte || input.trim();
    if (!message || loading) return;
    setInput('');

    const msgUser = { id: Date.now(), role: 'user', contenu: message };
    setMessages(prev => [...prev, msgUser]);
    setLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await api.post(ENDPOINTS.messageIA, { message });
      const msgIA = {
        id: Date.now() + 1,
        role: 'assistant',
        contenu: res.data.reponse,
      };
      setMessages(prev => [...prev, msgIA]);
      setNbMessages(res.data.messages_utilises || 0);
      setLimite(res.data.messages_limite);
    } catch (e) {
      const errMsg = e.response?.data?.error || 'Erreur de connexion';
      const msgErr = {
        id: Date.now() + 1,
        role: 'assistant',
        contenu: errMsg,
        error: true,
      };
      setMessages(prev => [...prev, msgErr]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgWrapper, isUser && styles.msgWrapperUser]}>
        {!isUser && (
          <View style={[styles.iaAvatar, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>IA</Text>
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: colors.primary }]
            : [styles.bubbleIA, { backgroundColor: colors.card, borderColor: colors.border }],
          item.error && { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: colors.error },
        ]}>
          <Text style={{
            color: isUser ? '#FFF' : (item.error ? colors.error : colors.textPrimary),
            fontSize: 14,
            lineHeight: 21,
          }}>
            {item.contenu}
          </Text>
        </View>
      </View>
    );
  };

  const limiteAtteinte = limite !== null && nbMessages >= limite;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Retour</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Kotizo IA</Text>
          {limite && (
            <Text style={{ color: colors.textTertiary, fontSize: 11 }}>
              {nbMessages}/{limite} messages
            </Text>
          )}
        </View>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <View style={[styles.iaAvatarLarge, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900' }}>IA</Text>
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
              Bonjour {user?.prenom} !
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Je suis Kotizo IA. Je reponds uniquement aux questions sur l'application.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => envoyer(s)}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingMsg}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 8 }}>
                  Kotizo IA reflechit...
                </Text>
              </View>
            ) : null
          }
        />

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {limiteAtteinte ? (
            <View style={styles.limiteMsg}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                Limite de messages atteinte pour aujourd'hui.
                {user?.niveau === 'basique' && ' Passez au niveau Verifie pour plus de messages.'}
              </Text>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Posez votre question..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.cardSecondary }]}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.border }]}
                onPress={() => envoyer()}
                disabled={!input.trim() || loading}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>→</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
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
  title: { fontSize: 17, fontWeight: '700' },
  welcomeContainer: { alignItems: 'center', padding: 24, paddingTop: 16 },
  iaAvatarLarge: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  suggestions: { width: '100%', gap: 8 },
  suggestionChip: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  messagesList: { padding: 16, paddingBottom: 8 },
  msgWrapper: { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgWrapperUser: { flexDirection: 'row-reverse' },
  iaAvatar: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 16 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleIA: { borderWidth: 1, borderBottomLeftRadius: 4 },
  loadingMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginLeft: 36,
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 12,
  },
  limiteMsg: { padding: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});