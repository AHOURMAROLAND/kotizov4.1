# KOTIZO — CAHIER DES CHARGES v4.1

## 1. INFORMATIONS GÉNÉRALES

- Projet : Kotizo
- Version : 4.1 Final
- Développeur : Roland (solo)
- OS dev : Windows 11
- OS prod : VPS Linux
- Plateformes : iOS + Android (React Native Expo SDK 55)
- Slogan : Cotisez Ensemble, Simplement
- Repo Git : AHOURMAROLAND/kotizov4
- Répertoire : E:\kotizo django\kotizo

## 2. STACK TECHNIQUE

- Mobile : React Native + Expo SDK 55, React Navigation v6,
  Zustand, Axios, AsyncStorage
- Backend : Django 5 + DRF, JWT simplejwt, Celery + Redis
- BDD dev : SQLite / BDD prod : PostgreSQL
- Paiements : PayDunya (Mixx by Yas + Moov Money + T-Money Togo)
- Push : Firebase Cloud Messaging
- Emails : Gmail SMTP + Brevo + Mailjet + Resend (fallback chain)
- Images : Cloudinary
- Serveur prod : Nginx + Gunicorn + Docker Compose
- Admin web : React.js + Tailwind CSS
- Agent IA : Google Gemini 2.0 Flash
- Bot WhatsApp : Evolution API (open source, Docker)
- Logger : KotizoLogger custom JSON
- reCAPTCHA : Google reCAPTCHA v3 (admin web)
- Monitoring : Sentry

## 3. ARCHITECTURE URLS

- kotizo.app            → App mobile
- admin.kotizo.app      → Dashboard admin web
- api.kotizo.app        → Backend Django
- status.kotizo.app     → Page statut publique

## 4. NIVEAUX UTILISATEURS

| Niveau   | Condition                        | Cotisations/jour | Coût             |
|----------|----------------------------------|-----------------|------------------|
| Basique  | Email vérifié                    | 3/jour max 12/semaine (fenêtre 7j) | Gratuit |
| Vérifié  | Liveness + CNI + paiement        | 20              | 1 000 ou 500 FCFA |
| Business | Demande approuvée + paiement     | Illimité        | 5 000 FCFA/an    |

- Ambassadeur Vérifié gratuit : 50 parrainages OU 25 filleuls avec 3+ cotisations actives
- Ambassadeur Business gratuit : 100 parrainages OU 50 filleuls avec 3+ transactions

## 5. TARIFICATION

- Frais Kotizo : 0,5% du montant de la transaction
- Frais PayDunya PayIn : 2,5%
- Frais PayDunya PayOut : 2,0%
- Frais totaux supportés par le participant : 5,0% (tout compris)
- Montant minimum : 200 FCFA
- Montant maximum : 250 000 FCFA
- Opérateurs : Mixx by Yas, Moov Money Togo, T-Money Togo

Exemples calcul frais Kotizo (0,5%) :
- 10 000 FCFA  → frais Kotizo = 50 FCFA
- 50 000 FCFA  → frais Kotizo = 250 FCFA
- 250 000 FCFA → frais Kotizo = 1 250 FCFA

## 5b. FORMULE BASIQUE — FENÊTRE GLISSANTE 7 JOURS

Inspiré du modèle Claude Free.
- Maximum 3 cotisations par jour
- Maximum 12 cotisations par fenêtre glissante de 7 jours
- La fenêtre démarre au premier jour d'utilisation (timestamp en base)
- Se renouvelle automatiquement 7 jours après le début de la fenêtre courante
- Géré par Celery avec timestamp — pas un reset lundi minuit
- Les deux limites s'appliquent simultanément (la plus restrictive gagne)
- Objectif : inciter à passer Vérifié (20/jour, illimité sur 7j)

Exemple :
  Jour 1 : 3 créées (semaine : 3/12)
  Jour 2 : 3 créées (semaine : 6/12)
  Jour 3 : 3 créées (semaine : 9/12)
  Jour 4 : 3 créées (semaine : 12/12) → bloqué pour 3 jours restants
  Jour 5-7 : bloqué jusqu'au renouvellement de la fenêtre

## 5c. PRIX VÉRIFICATION

- Prix normal : 1 000 FCFA
- Prix promo (lancée par admin) : 500 FCFA
- Prix réduit manuel (choisi par admin à la validation) : 500 FCFA
- Promo : notification automatique à tous les non-vérifiés
  → dès soumission dossier pendant promo → tarif 500 FCFA appliqué
- Validation manuelle : admin choisit 1 000 ou 500 FCFA avant d'approuver
  → champ note interne obligatoire si 500 FCFA (raison de la réduction)

## 5d. THÈMES

- Thème sombre (défaut) : fond #0A0F1E
- Thème clair : fond #F8FAFC, cartes #FFFFFF, texte #0F172A
- Toggle dans F12a Paramètres
- Persistance : AsyncStorage
- Gestion globale : Zustand ThemeStore

## 6. LES 6 BOTS

- Bot WA1 : Notifications WhatsApp sortantes via Evolution API
- Bot WA2 : Interactif — reçoit messages entrants, gère confirmations et commandes
- Bot Email : Chaîne fallback 4 providers
  (Gmail 500/j → Brevo 300/j → Mailjet 200/j → Resend 100/j)
- Bot IA App : Gemini 2.0 Flash accessible depuis écran H1
- Bot IA Conversationnel : Gemini avec mémoire session du jour, censure périmètre Kotizo
- Bot Scheduler : Celery Beat toutes les tâches automatiques

## 7. MESSAGES IA PAR NIVEAU

- Basique  : 3 messages/jour
- Vérifié  : 25 messages/jour
- Business : illimité
- Compteur Redis remis à zéro chaque nuit à minuit

## 8. ANTI-FRAUDE — SEUILS

| Déclencheur                          | Seuil     | Action                       |
|--------------------------------------|-----------|------------------------------|
| Multi-comptes même device            | Détecté   | Alerte admin                 |
| 3 signalements en 7 jours            | 3         | Avertissement niveau 0       |
| 5 signalements confirmés             | 5         | Restriction niveau 1         |
| 5 cotisations en moins de 10 min     | Détecté   | Blocage 1h                   |
| Même numéro receveur > 5/jour        | Détecté   | Alerte fraude                |
| 5 échecs connexion                   | 10 min    | Blocage 30 min               |
| 10 échecs en 24h                     | Cumulatif | Blocage 24h + ticket admin   |
| Fraude PayDunya confirmée            | 1 fois    | Suspension immédiate         |
| 5 injections IA en 1h                | 5         | Blacklist automatique        |

## 9. SANCTIONS

- Niveau 0 : Avertissement
- Niveau 1 : Restriction légère 3 jours
- Niveau 2 : Restriction moyenne 7 jours
- Niveau 3 : Dégradation compte 30 jours
- Niveau 4 : Fermeture temporaire 15–90 jours
- Niveau 5 : Bannissement permanent

## 10. ORDRE DE TRAVAIL (21 ÉTAPES)

| Étape | Tâche |
|-------|-------|
| 1  | Setup projet Django + structure dossiers |
| 2  | Models Django + migrations |
| 3  | Core (logger, middleware, email_router, utils) |
| 4  | Auth JWT + double canal WhatsApp/email |
| 5  | API Cotisations complète |
| 6  | API Paiements + webhooks (request.POST) |
| 7  | API QuickPay |
| 8  | API Notifications |
| 9  | Docker Compose (Redis + Evolution API) |
| 10 | DIM 67 interfaces validées (AVANT tout mobile) |
| 11 | Mobile Flux A + B + I (Onboarding + Auth + Post-inscription) |
| 12 | Mobile Flux C + D + E (App principale + QP + Historique) |
| 13 | Mobile Flux F + S (Profil + Statistiques) |
| 14 | Mobile Flux G + H (États spéciaux + Agent IA) |
| 15 | Intégration PayDunya sandbox (tests réels) |
| 16 | Agent IA (kotizo_knowledge.py + Gemini + censure) |
| 17 | Bot WhatsApp Evolution API (core/whatsapp.py) |
| 18 | Admin Web React.js (74 fonctionnalités) |
| 19 | Tests complets tous endpoints + flows |
| 20 | Déploiement VPS (Nginx, Gunicorn, PostgreSQL, SSL) |
| 21 | Page statut + Sentry monitoring |

## 11. CONSIGNES DE TRAVAIL ABSOLUES

- Pas d'emoji dans le code ni l'UI (Ionicons uniquement)
- Commentaires minimalistes
- Commandes copy-paste PowerShell Windows 11
- Pourcentage d'avancement après chaque étape
- git add + commit + push après chaque bloc terminé
- DIM validé AVANT tout code mobile
- Script de création fichiers avant contenu
- Fichier complet fourni, pas de diffs partiels
- Node.js dépendances une par une

## 12. VERSION 2 — REPORTÉ

- Cotisation privée complète (15 contacts, liens uniques, expiration 7j)
- Inscription automatique depuis lien privé WhatsApp
- Google Sign-In + Apple Sign-In
- Biométrie Face ID / empreinte (dépend hardware, tests approfondis nécessaires)