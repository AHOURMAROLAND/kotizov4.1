import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KButton from '../../components/common/KButton';
import useThemeStore from '../../store/themeStore';

export default function CGUScreen({ navigation }) {
  const { colors } = useThemeStore();
  const [cguAcceptee, setCguAcceptee] = useState(false);
  const [politiqueAcceptee, setPolitiqueAcceptee] = useState(false);
  const [ageConfirme, setAgeConfirme] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
      setScrolledToBottom(true);
    }
  };

  const peutContinuer = cguAcceptee && politiqueAcceptee && ageConfirme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Conditions d'utilisation</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Lisez et acceptez pour continuer
        </Text>
      </View>

      <View style={[styles.scrollContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
        >
          <Text style={[styles.cguText, { color: colors.textSecondary }]}>
            {CGU_TEXT}
          </Text>
        </ScrollView>
        {!scrolledToBottom && (
          <View style={[styles.fadeHint, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
              Faites defiler pour lire
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <CheckRow
          label="J'accepte les Conditions Generales d'Utilisation"
          checked={cguAcceptee}
          onPress={() => setCguAcceptee(!cguAcceptee)}
          colors={colors}
        />
        <CheckRow
          label="J'accepte la Politique de Confidentialite"
          checked={politiqueAcceptee}
          onPress={() => setPolitiqueAcceptee(!politiqueAcceptee)}
          colors={colors}
        />
        <CheckRow
          label="Je confirme avoir 18 ans ou plus"
          checked={ageConfirme}
          onPress={() => setAgeConfirme(!ageConfirme)}
          colors={colors}
        />

        <KButton
          title="Continuer"
          onPress={() => navigation.replace('Connexion')}
          disabled={!peutContinuer}
          style={{ marginTop: 8 }}
        />
      </View>
    </SafeAreaView>
  );
}

function CheckRow({ label, checked, onPress, colors }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[
        styles.checkbox,
        {
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : 'transparent',
        }
      ]}>
        {checked && <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>✓</Text>}
      </View>
      <Text style={[styles.checkText, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const CGU_TEXT = `CONDITIONS GENERALES D'UTILISATION — KOTIZO

Derniere mise a jour : Mars 2026

1. OBJET
Kotizo est une application de cotisations collectives et de paiements rapides via Mobile Money au Togo.

2. INSCRIPTION
L'utilisateur doit avoir au moins 18 ans. Un compte actif necessite la verification via email ou WhatsApp dans les 48 heures.

3. NIVEAUX DE COMPTE
- Compte Basique : gratuit, 3 cotisations par jour, 12 par semaine
- Compte Verifie : verification d'identite requise, 20 cotisations par jour
- Compte Business : abonnement annuel, cotisations illimitees

4. FRAIS
Les frais totaux sont de 5% par transaction (0,5% Kotizo + 4,5% PayDunya). Le createur recoit le montant original sans deduction.

5. SECURITE
L'utilisateur s'engage a ne pas utiliser l'application a des fins frauduleuses. Tout abus entraine une suspension immediate.

6. RESPONSABILITE
Kotizo est un intermediaire technique. Kotizo n'est pas responsable des litiges entre utilisateurs.

7. DONNEES PERSONNELLES
Vos donnees sont protegees conformement a notre Politique de Confidentialite. Nous ne vendons pas vos donnees.

8. MODIFICATIONS
Kotizo se reserve le droit de modifier ces CGU. Les utilisateurs seront informes par notification.

9. LOI APPLICABLE
Les presentes CGU sont regies par le droit togolais.

POLITIQUE DE CONFIDENTIALITE

Nous collectons uniquement les donnees necessaires au fonctionnement du service : email, telephone, historique des transactions.

Vos donnees sont stockees de maniere securisee et ne sont jamais revendues a des tiers.

Vous pouvez demander la suppression de votre compte et de vos donnees a tout moment depuis l'application.`;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13 },
  scrollContainer: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cguText: {
    fontSize: 13,
    lineHeight: 22,
    padding: 16,
  },
  fadeHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    alignItems: 'center',
  },
  footer: { padding: 24, paddingTop: 16 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkText: { flex: 1, fontSize: 13, lineHeight: 20 },
});