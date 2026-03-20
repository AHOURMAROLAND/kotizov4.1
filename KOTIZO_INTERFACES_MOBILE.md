# KOTIZO — 67 INTERFACES MOBILES

## SYSTÈME DE DESIGN

### Couleurs — Thème sombre (défaut)
- Fond principal        : #0A0F1E
- Cartes                : #111827
- Cartes secondaires    : #1E293B
- Accent primaire       : #2563EB
- Accent secondaire     : #3B82F6
- Succès                : #22C55E
- Erreur                : #EF4444
- Warning               : #F59E0B
- Texte principal       : #FFFFFF
- Texte secondaire      : rgba(255,255,255,0.45)
- Texte tertiaire       : rgba(255,255,255,0.25)
- Bordures              : rgba(255,255,255,0.06)

### Couleurs — Thème clair
- Fond principal        : #F8FAFC
- Cartes                : #FFFFFF
- Cartes secondaires    : #F1F5F9
- Texte principal       : #0F172A
- Texte secondaire      : #64748B
- Bordures              : rgba(0,0,0,0.08)
- Accent primaire       : #2563EB (identique)

### Gestion thème
- Toggle dans F12a Paramètres
- Persistance AsyncStorage
- Zustand ThemeStore global
- Tous les composants utilisent les tokens de couleur (pas de valeurs hardcodées)

### Typographie
- Titre principal    : 28-32px, font-weight 700
- Titre secondaire   : 20-22px, font-weight 700
- Label              : 14-15px, font-weight 600
- Corps              : 13-14px, font-weight 400
- Caption            : 11-12px, font-weight 400

### Composants globaux
- Bouton primaire    : fond #2563EB, border-radius 28px, hauteur 52px
- Bouton secondaire  : fond rgba(255,255,255,0.05), bordure rgba(255,255,255,0.12)
- Carte              : fond #111827 (dark) / #FFFFFF (light), border-radius 16px
- Input              : fond #1E293B, border-radius 12px, hauteur 52px, label flottant
- Badge succès       : fond rgba(34,197,94,0.15), texte #22C55E
- Badge info         : fond rgba(37,99,235,0.15), texte #60A5FA
- Bottom navigation  : 4 icônes, fond #111827

### Animations de chargement
- Skeleton      : chargement listes et données
- Spinner       : actions bouton en attente
- Arc           : chargement écran entier
- Pulse         : attente confirmation paiement
- Barres        : dictée vocale active
- Ripple        : confirmation action réussie
- Bounce        : réponse Gemini en cours
- Tirets        : mode hors ligne
- Double ring   : liveness check actif

---

## FLUX A — ONBOARDING (6 écrans)

### A1 — Splash Screen
- Fond #0A0F1E plein écran
- Logo Kotizo centré animé (Lottie)
- Animation : logo apparaît, pulse une fois, fondu vers A2
- Durée : 2,5 secondes

### A2 — Tutoriel 1
- Illustration animée : cotisation collective
- Titre : "Créez vos cotisations"
- Points de navigation (1er actif)
- Bouton "Suivant" + lien "Ignorer"

### A3 — Tutoriel 2
- Illustration : partage QR code
- Titre : "Partagez et collectez"
- Points navigation (2e actif)

### A4 — Tutoriel 3
- Illustration : Quick Pay instantané
- Titre : "Quick Pay instantané"
- Points navigation (3e actif)
- Bouton "Commencer"

### A5 — CGU scrollable
- ScrollView avec texte CGU complet
- Checkbox "J'accepte les CGU"
- Bouton "Continuer" activé uniquement si case cochée
- Indicateur de lecture (barre de progression scroll)

### A6 — Politique confidentialité
- Même structure que A5
- Checkbox "J'accepte la politique de confidentialité"
- Case supplémentaire "J'ai 18 ans ou plus"
- Case supplémentaire "J'autorise Kotizo à utiliser
  ma ville approximative pour améliorer le service"

---

## FLUX B — AUTHENTIFICATION (6 écrans)

### B1 — Connexion
- Illustration animée en haut
- Titre "Bon retour !"
- Champ email avec label flottant
- Champ mot de passe avec œil toggle
- Lien "Mot de passe oublié"
- Bouton "Se connecter"
- Séparateur "ou"
- Boutons Google + Apple (iOS) — Version 2
- Lien "Pas encore inscrit ? Créer un compte"

### B2 — Inscription
- Champs : Prénom, Nom, Pseudo (@...), Pays (sélecteur),
  Téléphone, Email, Mot de passe, Confirmation mdp
- Cases : CGU, Politique, 18 ans confirmés
- Champ optionnel : Code parrainage
- Labels flottants au focus
- Validation en temps réel
- Bouton "Créer mon compte"

### B3 — Vérification double canal
- Titre "Vérifiez votre compte"
- Compte à rebours 5 minutes visible
- Bouton WhatsApp vert (deep link pré-rempli)
- Bouton email bleu avec statut
- Message : "Au moins un canal obligatoire"
- Bouton "Renvoyer" après expiration

### B4 — Mot de passe oublié
- Champ email
- Bouton "Envoyer le lien"
- Message générique affiché

### B5 — Réinitialisation mot de passe
- Champ nouveau mot de passe
- Champ confirmation
- Indicateur force du mot de passe
- Bouton "Réinitialiser"
- États : token valide / token expiré

### B6 — Compte en attente 48h
- Illustration "En attente"
- Titre "Votre compte est en attente"
- Bouton "Renvoyer le lien WhatsApp"
- Bouton "Renvoyer l'email"
- Compte à rebours 48h

NOTE : B7 Biométrie → reporté en VERSION 2

---

## FLUX C — APP PRINCIPALE (13 écrans)

### C1 — Dashboard
- Carte solde style fintech (fond bleu)
  → Total collecté du mois + variation %
- 4 actions rapides : Créer, Rejoindre, Quick Pay, Historique
- Section "Cotisations actives" (mini cartes)
- Section "Activité récente" (3 dernières transactions)
- État zéro si nouveau compte : illustration + CTA
- Indicateur formule Basique : "X cotisations restantes cette semaine"
- Bottom navigation : Accueil, Cotisations, Quick Pay, Profil

### C2 — Mes cotisations
- Tabs : Créées / Participées
- Liste cartes avec : nom, progression, montant, date expiration
- Filtre par statut
- Bouton flottant "+"
- État vide illustré

### C3 — Créer une cotisation
- Formulaire : Nom, Description, Montant (200–250 000 FCFA),
  Nb participants, Numéro receveur, Date expiration (max 30j)
- Toggle : Cotisation récurrente (tontine)
- Aperçu montant total + frais (0,5% Kotizo affiché)
- KeyboardAvoidingView behavior="padding" iOS / behavior="height" Android
- Bouton "Voir l'aperçu"

### C4 — Aperçu avant confirmation
- Récapitulatif : nom, montant unitaire, total, frais Kotizo (0,5%),
  frais totaux (5%), nb participants, date expiration, numéro receveur
- Bouton "Confirmer et créer"
- Bouton "Modifier"

### C5 — Cotisation créée
- Animation Ripple succès
- QR Code
- Lien de partage + bouton "Copier"
- Bouton "Partager sur WhatsApp"
- Slug : KTZ-XXXXXX
- Bouton "Voir la cotisation"

### C6 — Détail cotisation (vue créateur)
- Nom + progression barre
- Stats : collecté / total, participants payés / total
- QR code miniature + agrandir
- Bouton "Rappeler les non-payeurs"
- Liste participants + statut paiement
- Bouton "Confirmer reçu" par participant
- Menu : supprimer, exporter PDF, exporter Excel (Business)

### C7 — Payer une cotisation (vue participant)
- Nom cotisation + créateur (pseudo + nom si Vérifié)
- Montant + frais Kotizo (0,5%) + total (5%)
- Bouton "Choisir mon opérateur"

### C8 — Choix opérateur
- Liste : Moov Money, Mixx by Yas, T-Money
- Logo + numéro détecté automatiquement

### C9 — Confirmation + reçu
- Animation succès
- Reçu stylisé dark :
  → Badge "Confirmé" vert
  → Montant en grand
  → Section créateur : pseudo + nom + avatar + coche vérification
  → Tous les détails transaction
  → Frais Kotizo (0,5%) affichés séparément
  → QR code de vérification
- Bouton "Télécharger PDF"
- Bouton "Partager"

### C10 — Rejoindre via lien ou QR
- Champ "Coller un lien KTZ-XXXXXX"
- Bouton "Scanner QR"
- Historique 3 derniers liens

### C11 — Lien expiré
- Illustration 404
- Message contextuel
- Bouton retour

### C12 — Rappel envoyé confirmation
- Animation Bounce
- Nombre de personnes rappelées
- Liste non-payeurs rappelés
- Bouton retour

### C13 — Cotisation récurrente — configuration
- Toggle activation récurrence
- Sélecteur fréquence : Mensuelle
- Sélecteur jour du mois
- Date de début
- Aperçu calendrier 3 prochains cycles
- Bouton "Activer la récurrence"

---

## FLUX D — QUICK PAY (6 écrans)

### D1 — Quick Pay principal
- Tabs : Envoyés / Reçus
- Liste avec code, montant, statut, temps restant
- Bouton flottant "Nouveau Quick Pay"

### D2 — Créer Quick Pay
- Champ montant (200–250 000 FCFA)
- Champ numéro receveur
- Champ note optionnelle
- Aperçu frais (0,5% Kotizo affiché)
- Bouton "Générer"

### D3 — Quick Pay généré
- Code unique en grand (style ticket)
- Compte à rebours 1h temps réel
- QR Code
- Bouton "Partager sur WhatsApp"
- Bouton "Copier le lien"

### D4 — Quick Pay expiré
- Illustration expired
- Bouton "Créer un nouveau"

### D5 — Confirmation réception (créateur)
- Animation succès
- Montant reçu
- Nom du payeur
- Message "Reversement en cours"

### D6 — Paiement Quick Pay (côté payeur)
- Montant en grand
- Note du créateur
- Pseudo + nom créateur
- Frais affichés (5% total)
- Bouton "Payer maintenant"
- Compte à rebours visible

---

## FLUX E — HISTORIQUE (5 écrans)

### E1 — Historique cotisations créées
- Liste avec filtre : tout, actif, complété, expiré
- Chaque item : nom, date, montant, nb participants, statut badge

### E2 — Historique cotisations participées
- Liste : nom cotisation, créateur (pseudo), montant payé, date

### E3 — Historique Quick Pay envoyés
- Liste : code, montant, destinataire, date, statut

### E4 — Historique Quick Pay reçus
- Liste : code, montant, expéditeur, date

### E5 — Détail participation + reçu
- Reçu stylisé complet (même design C9)
- Bouton "Télécharger PDF"
- Bouton "Exporter image"

---

## FLUX F — PROFIL ET COMPTE (15 écrans)

### F1 — Profil
- Avatar + pseudo + nom (si Vérifié/Business)
- Badge niveau avec couleur
- Mini statistiques : total collecté, participations, parrainages
- Lien vers section Statistiques complètes
- Indicateur formule Basique (X/12 cotisations cette semaine)
- Bouton "Modifier le profil"

### F2 — Modifier profil
- Changer photo (Cloudinary)
- Modifier pseudo (unique)
- Modifier téléphone
- Nom et prénom : verrouillés si compte Vérifié

### F3 — Vérification identité — Recto
- Instruction + illustration
- Bouton "Prendre en photo"
- Preview + "Utiliser" / "Reprendre"

### F4 — Vérification identité — Verso
- Même structure que F3

### F5 — Liveness check
- Caméra frontale active
- Cercle guide visage
- Instructions : "Tournez la tête / Clignez des yeux"
- Animation Double ring pendant analyse
- Progress indicator des étapes

### F6 — En attente de validation
- Illustration "En cours d'analyse"
- Message "Votre dossier est en cours de vérification (24-48h)"
- Date de soumission
- Bouton "Contacter le support"

### F7 — Vérification approuvée → paiement
- Badge "Identité vérifiée" vert
- Avantages niveau Vérifié
- Montant affiché : 1 000 FCFA (ou 500 FCFA si promo active)
- Badge "Promo active" si prix réduit
- Bouton "Payer et activer"

### F8 — Demande Business
- Formulaire : nom entreprise, type activité, volume mensuel, raison
- Bouton "Soumettre la demande"

### F9 — Demande Business en attente
- Statut "En cours d'examen"
- Délai estimé

### F10 — Business approuvé → paiement
- Avantages Business
- Période gratuite 2 semaines
- Montant 5 000 FCFA/an
- Bouton "Activer mon compte Business"

### F11 — Centre notifications
- Liste toutes notifications
- Filtre par type
- Marquer tout comme lu

### F12a — Paramètres généraux
- Toggle thème clair/sombre
- Sélecteur langue
- Toggles notifications : WhatsApp, Email, Push
- Toggle rapport journalier

### F12b — Paramètres sécurité
- Changer mot de passe
- Changer email
- Changer numéro WhatsApp
- Gérer sessions actives → F14
- Supprimer le compte (confirmation double)
NOTE : Biométrie → version 2

### F13 — Parrainage et ambassadeur
- Code parrainage personnel
- Bouton "Partager mon lien"
- Barre progression vers seuil Vérifié (ex: 12/25)
- Barre progression vers seuil Business (ex: 12/50)
- Liste 5 derniers filleuls actifs
- Date estimée d'atteinte du seuil

### F14 — Sécurité et sessions
- Liste appareils connectés (type, date, localisation approx)
- Bouton "Révoquer" par session
- Bouton "Déconnecter tous les appareils"
NOTE : Biométrie → version 2

### F15 — Reconfirmation action sensible
- Titre de l'action en cours
- Champ "Entrez votre mot de passe pour confirmer"
- Bouton "Confirmer" / "Annuler"

---

## FLUX G — ÉTATS SPÉCIAUX (6 écrans)

### G1 — Hors ligne
- Banner orange "Pas de connexion — historique uniquement"
- Historique AsyncStorage accessible
- Bouton "Réessayer"

### G2 — Erreur réseau
- Illustration réseau coupé
- Bouton "Réessayer"

### G3 — Lien/QR expiré
- Illustration expired
- Message selon contexte

### G4 — Cotisation non trouvée (404)
- Illustration 404
- Bouton retour

### G5 — Maintenance
- Illustration maintenance
- Durée estimée
- Lien status.kotizo.app

### G6 — WhatsApp indisponible
- Illustration WhatsApp barré
- "Notifications WhatsApp temporairement indisponibles"
- "Vous recevrez vos alertes par email"
- Lien "Activer les notifications email"

---

## FLUX H — AGENT IA (3 écrans)

### H1 — Interface messagerie
- Bouton flottant depuis tous les écrans
- Interface chat dark style fintech
- Suggestions rapides en chips
- Compteur messages restants
- Input + bouton micro + bouton envoi

### H2 — Micro dictée active
- Visualisation ondes sonores (Barres animées)
- Bouton stop
- Transcription en temps réel

### H3 — Réclamation avec image
- Champ description
- Bouton "Ajouter une capture d'écran"
- Preview image
- Note : "Votre réclamation sera transmise à notre équipe"
- Bouton "Envoyer la réclamation"

---

## FLUX S — STATISTIQUES (5 écrans)

### S1 — Vue globale
- Carte bancaire style : total collecté ce mois + variation %
- Sélecteur : Semaine / Mois / Année
- Donut chart répartition cotisations
- Courbe revenus reçus
- Navigation vers S2, S3, S4, S5

### S2 — Statistiques financières
- Graphique barres : montants collectés par mois (Chart.js)
- Courbe : Quick Pay envoyés vs reçus
- Frais Kotizo (0,5%) payés sur la période
- Filtres par type transaction

### S3 — Statistiques cotisations
- Taux de complétion moyen (donut %)
- Top 3 cotisations les plus actives
- Répartition statuts en donut
- Nombre participants uniques

### S4 — Statistiques ambassadeur
- Progression vers seuil Vérifié (barre animée)
- Progression vers seuil Business (barre animée)
- Liste 5 derniers filleuls actifs
- Date estimée d'atteinte du seuil

### S5 — Statistiques Quick Pay
- Volume Quick Pay par période
- Taux d'expiration sans paiement
- Montant moyen
- Graphique courbe tendance

---

## FLUX I — POST-INSCRIPTION (2 écrans)

### I1 — Onboarding contextuel
- 3 slides après activation :
  1. "Voici votre dashboard"
  2. "Créez votre première cotisation"
  3. "Invitez vos proches"
- Bouton "C'est parti !"

### I2 — État zéro dashboard
- Illustration fintech motivante
- "Bienvenue sur Kotizo, [pseudo] !"
- Indicateur formule Basique
- Bouton "Créer ma première cotisation"
- Bouton "Rejoindre une cotisation"

---

## COMPOSANT GLOBAL — N1

### N1 — Notification push foreground
- Toast/banner non bloquant en haut
- Icône colorée + titre + message court
- Durée : 4 secondes, swipe pour fermer
- Tap → navigation vers l'écran concerné