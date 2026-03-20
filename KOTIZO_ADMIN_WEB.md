# KOTIZO — DASHBOARD ADMIN WEB

## DESIGN

- Style : dark fintech
- Fond : #0A0F1E, cartes #111827, sidebar #0D1520
- Accent : #2563EB / #3B82F6
- Stack : React.js + Tailwind CSS + Chart.js
- URL : admin.kotizo.app
- Auth : email + mdp + reCAPTCHA v3 + 2FA (Super Admin)

## RÔLES ADMIN

| Rôle         | Accès                                          |
|--------------|------------------------------------------------|
| Super Admin  | Tout sans restriction                          |
| Modérateur   | Signalements, sanctions, tickets               |
| Support      | Tickets + réclamations + conversations IA      |
| Finance      | Transactions, remboursements, solde PayDunya   |
| Vérification | Identités + demandes Business                  |
| Lecteur      | Statistiques et rapports uniquement            |

## PERMISSIONS GRANULAIRES

- Voir liste utilisateurs / profil détaillé / modifier niveau
- Suspendre / Réactiver / Bannir
- Voir vérifications / Approuver / Rejeter vérification
- Voir demandes Business / Approuver / Rejeter Business
- Voir transactions / Valider remboursement / Rejeter remboursement
- Voir alertes fraude / Appliquer sanction / Lever sanction
- Voir signalements / Confirmer / Rejeter signalement
- Voir tickets / Répondre / Fermer ticket
- Voir stats IA / Voir tentatives injection
- Générer rapports / Télécharger rapports
- Créer notifications / Gérer admins (Super Admin uniquement)

---

## AW1 — DASHBOARD GLOBAL

- 6 metric cards : nouveaux users, users actifs, transactions du jour,
  revenus Kotizo (0,5%), cotisations actives, Quick Pay actifs
- Graphique barres : revenus par mois (Chart.js)
- Graphique courbe : nouveaux utilisateurs par semaine
- Carte Togo : densité utilisateurs par ville (D3.js + GeoJSON Togo)
  → Lomé, Kpalimé, Sokodé, Kara, Atakpamé, Dapaong
  → Position ville approx enregistrée à la connexion (consentement requis)
- Panel alertes critiques temps réel (badge rouge)
- 5 dernières transactions

---

## AW2 — GESTION UTILISATEURS

- Table : avatar, pseudo, nom, niveau (badge), date inscription,
  dernière connexion, statut
- Filtres : niveau, statut, pays, date
- Recherche par pseudo/nom/email
- Motifs optimisés sur chaque ligne (style fintech)

Détail utilisateur au clic :
- Profil complet + indicateur formule Basique (X/12 cette semaine)
- Onglet Historique : transactions, cotisations, Quick Pay
- Onglet Sanctions : historique
- Onglet Alertes : alertes fraude associées
- Actions : modifier niveau, suspendre, réactiver, bannir, notifier

---

## AW3 — VÉRIFICATIONS IDENTITÉ

- Dossiers en attente en priorité
- Photos recto/verso + résultat liveness + comparaison nom/document
- Bouton "Approuver à 1 000 FCFA" (prix normal)
- Bouton "Approuver à 500 FCFA" (étudiant / cas particulier)
  → Champ note interne obligatoire si 500 FCFA
- Bouton "Rejeter" avec sélection raison :
  document illisible, nom ne correspond pas,
  liveness échoué, document expiré
- Historique vérifications traitées

---

## AW4 — DEMANDES BUSINESS

- Liste demandes : nom entreprise, type activité, volume, date
- Détail demande au clic
- Bouton "Approuver" → 2 semaines gratuites
- Bouton "Rejeter" avec raison
- Suivi Business actifs + dates expiration abonnement

---

## AW5 — TRANSACTIONS ET FINANCES

- Tabs : PayIn / PayOut / Remboursements
- Filtres : date, opérateur, statut, montant
- Affichage frais Kotizo (0,5%) séparé des frais PayDunya
- Solde PayDunya temps réel (bouton refresh)
- Section remboursements en attente :
  → Transaction originale complète
  → Historique compte du demandeur
  → Alertes fraude passées associées
  → Bouton "Valider le remboursement" → Celery Disburse
  → Bouton "Rejeter + signaler arnaque" → AlerteFraude créée

---

## AW6 — ALERTES FRAUDE

- Liste alertes avec niveau criticité
- Types : multi_comptes, signalements_multiples, creation_rapide,
  numero_suspect, ip_suspecte, fraude_paydunya
- Actions : examiner, faux positif, lier à sanction
- Historique alertes par utilisateur

---

## AW7 — SANCTIONS

- Appliquer sanction : niveaux 0-5, raison, durée
- Liste sanctions actives
- Lever une sanction
- Contestations en attente
- Accepter / Rejeter contestation

---

## AW8 — SIGNALEMENTS

- Cotisations signalées avec nombre signalements
- Détail chaque signalement
- Confirmer (suspension) / Rejeter
- Auto-suspension à 3 signalements gérée backend

---

## AW9 — CONVERSATIONS IA

- Volume messages IA par période (graphique)
- Top 10 questions les plus posées
- Questions sans bonne réponse
- Tentatives injection prompt avec message exact
- Utilisateurs blacklistés IA
- Bouton "Mettre à jour kotizo_knowledge.py" (éditeur inline)
- Tickets créés par IA avec statut
NOTE : admin ne voit PAS le contenu des conversations

---

## AW10 — TICKETS SUPPORT ET RÉCLAMATIONS

- Liste tickets : sujet, priorité, statut, date
- Filtres : statut, priorité, source
- Détail + historique messages
- Bouton "Répondre" + "Fermer"
- Captures d'écran réclamations visibles

---

## AW11 — TÉMOIGNAGES

- Déclenchés après 2 mois ou 150 transactions
- Approuver pour landing page / rejeter
- Stats : note moyenne, répartition étoiles

---

## AW12 — STATISTIQUES

- Graphiques revenus mensuels (0,5% Kotizo visible séparément)
- Courbe croissance utilisateurs
- Répartition niveaux (donut)
- Volume transactions par opérateur
- Carte Togo densité utilisateurs
- Taux de rétention
- Sélecteurs : semaine / mois / trimestre / année

---

## AW13 — RAPPORTS EXCEL (générés par Celery)

Flux : cliquer "Générer" → Celery → Excel → Cloudinary →
notification WhatsApp admin avec lien téléchargement

1. Rapport financier mensuel :
   revenus Kotizo (0,5%), volume transactions, répartition opérateurs,
   frais PayDunya, remboursements, balance nette

2. Rapport utilisateurs :
   nouveaux inscrits, taux vérification (dont promos 500F),
   conversion niveaux, actifs vs inactifs, ambassadeurs

3. Rapport cotisations :
   créées, taux complétion, montants moyens, signalées

4. Rapport sécurité :
   échecs connexion, comptes bloqués, alertes fraude,
   sanctions, injections IA

5. Rapport Quick Pay :
   volume, taux expiration, montants moyens

6. Rapport support :
   tickets ouverts/résolus, délai moyen, réclamations

---

## AW14 — GESTION ADMINS

- Créer sous-admin : nom, email, rôle, permissions granulaires
- Modifier permissions d'un admin existant
- Désactiver un admin
- Journal des actions de chaque admin

### Section promotions vérification
- Bouton "Lancer promo 500 FCFA" avec date de fin
- Notification automatique → tous les non-vérifiés
- Indicateur promo active + compte à rebours
- Bouton "Arrêter la promo"
- Historique des promos passées

### Section reCAPTCHA v3
- Configuration clé publique/privée

### Section bot WhatsApp admin
- Enregistrer numéro admin WhatsApp
- Définir PIN (min 6 chiffres)
- Associer username admin
- Modifier PIN

### Section changement numéro bot utilisateurs
- Saisir nouveau numéro + credentials Evolution API
- Historique numéros précédents avec dates
- Bouton "Activer le nouveau numéro"

---

## NOTIFICATIONS ADMIN MANUELLES

- Rédiger titre + message
- Canal : WhatsApp / In-app / Les deux
- Cibler : Tous / Basique / Vérifié / Business
- Planifier : immédiat ou date/heure programmée
- Prévisualisation avant envoi

---

## BOT WHATSAPP ADMIN — COMMANDES

Niveau 1 (sans PIN) — lecture :
- "stats"   → chiffres clés du jour
- "alertes" → dernières alertes fraude
- "tickets" → tickets ouverts
- "solde"   → solde PayDunya

Niveau 2 (PIN 6 chiffres) — actions :
- "rapport [type] [période]" → génère Excel + envoie lien
- "suspend [email]"         → suspension compte
- "rembourse [référence]"   → validation remboursement
- "statut [email]"          → infos complètes utilisateur

Niveau 3 (PIN + "CONFIRMER") — irréversible :
- "banni [email]"               → bannissement permanent
- "supprime données [email]"    → suppression RGPD

Délai réponse : 10 à 20 secondes (anti-ban)
Alertes critiques Roland : immédiates