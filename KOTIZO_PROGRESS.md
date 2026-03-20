# KOTIZO — ÉTAT D'AVANCEMENT

## PROGRESSION GLOBALE : 0% — NOUVEAU DÉPART

Le projet repart de zéro dans cette nouvelle discussion.
Le code précédent existe sur GitHub comme référence uniquement.

Repo référence : AHOURMAROLAND/kotizov4
Répertoire local : E:\kotizo django\kotizo

---

## CE QUI EST DÉFINI ET VALIDÉ (pas encore codé)

### Architecture complète validée
- Stack technique complet
- 6 bots avec rôles définis
- 3 niveaux utilisateurs + tarification (0,5% Kotizo / 5% total)
- Montant max 250 000 FCFA
- Formule Basique fenêtre glissante 7j (3/jour, 12/semaine)
- Système ambassadeur 2 voies
- Anti-fraude + 6 niveaux sanctions
- Flux PayDunya (webhook request.POST confirmé)
- Auth double canal (tokens 5 min, blocage 12h)
- Bot WhatsApp admin (PIN 6 chiffres, 3 niveaux)
- Agent IA Gemini (censure, mémoire session, kotizo_knowledge.py)
- Gestion panne WhatsApp avec fallback email
- Thèmes clair et sombre
- Promotions vérification (1 000 ou 500 FCFA)
- Biométrie reportée en v2

### Interfaces validées
- 67 écrans mobiles définis (B7 biométrie reporté v2)
- 74 fonctionnalités admin définies
- 55 fonctionnalités utilisateur définies
- Système de design dark fintech validé
- Logo Kotizo bleu validé (SVG disponible)
- Aperçu reçu validé (SVG disponible)

### Fichiers de contexte à la racine
- KOTIZO_CDC.md
- KOTIZO_LOGIQUE_METIER.md
- KOTIZO_INTERFACES_MOBILE.md
- KOTIZO_ADMIN_WEB.md
- KOTIZO_BACKEND_REFERENCE.md
- KOTIZO_PROGRESS.md (ce fichier)

---

## ORDRE DE TRAVAIL (21 ÉTAPES)

| Étape | Tâche                                              | Statut  |
|-------|----------------------------------------------------|---------|
| 1     | Setup projet Django + structure dossiers           | A faire |
| 2     | Models Django + migrations                         | A faire |
| 3     | Core (logger, middleware, email_router, utils)     | A faire |
| 4     | Auth JWT + double canal WhatsApp/email             | A faire |
| 5     | API Cotisations + logique fenêtre glissante        | A faire |
| 6     | API Paiements + webhooks (request.POST)            | A faire |
| 7     | API QuickPay                                       | A faire |
| 8     | API Notifications                                  | A faire |
| 9     | Docker Compose (Redis + Evolution API)             | A faire |
| 10    | DIM 67 interfaces validées (AVANT tout mobile)     | A faire |
| 11    | Mobile Flux A + B + I                              | A faire |
| 12    | Mobile Flux C + D + E                              | A faire |
| 13    | Mobile Flux F + S                                  | A faire |
| 14    | Mobile Flux G + H                                  | A faire |
| 15    | Intégration PayDunya sandbox                       | A faire |
| 16    | Agent IA (kotizo_knowledge.py + Gemini)            | A faire |
| 17    | Bot WhatsApp Evolution API                         | A faire |
| 18    | Admin Web React.js (74 fonctionnalités)            | A faire |
| 19    | Tests complets                                     | A faire |
| 20    | Déploiement VPS                                    | A faire |
| 21    | Page statut + Sentry monitoring                    | A faire |

---

## POINTS CRITIQUES À NE PAS OUBLIER

1. Webhooks PayDunya : TOUJOURS request.POST
2. Frais Kotizo : 0,5% — total participant 5%
3. Montant max : 250 000 FCFA
4. Délai bot WhatsApp : random.uniform(3, 6)
5. Hash webhook PayDunya : valider en sandbox (étape 15)
6. expo-face-detector : vérifier Expo SDK 55 avant écran F5
7. Mémoire Gemini : session du jour uniquement
8. Compteurs IA : Redis uniquement
9. Blocage 12h : sur numéro téléphone, pas IP
10. Fenêtre 7j : glissante par user — pas reset lundi minuit
11. DIM OBLIGATOIRE avant tout code mobile
12. Pas d'emoji dans le code — Ionicons uniquement
13. Biométrie : reportée en VERSION 2
14. Consentement position GPS : case à l'inscription (A6)

---

## CONSIGNES DE TRAVAIL ABSOLUES

- Pas d'emoji dans le code ni l'UI
- Commentaires minimalistes
- Commandes copy-paste PowerShell Windows 11
- Pourcentage d'avancement après chaque étape
- git add + commit + push après chaque bloc terminé
- DIM validé AVANT tout code mobile
- Script de création fichiers avant contenu
- Fichier complet fourni, pas de diffs partiels
- Node.js dépendances une par une

---

## AVANCEMENT PAR DOMAINE

| Domaine                        | Avancement |
|-------------------------------|------------|
| Setup projet                  | 0%         |
| Models Django                 | 0%         |
| Core (logger, utils)          | 0%         |
| Auth JWT                      | 0%         |
| API Cotisations               | 0%         |
| API Paiements                 | 0%         |
| API QuickPay                  | 0%         |
| API Notifications             | 0%         |
| Agent IA                      | 0%         |
| Admin Panel API               | 0%         |
| Bot WhatsApp                  | 0%         |
| Docker Compose                | 0%         |
| Mobile (67 écrans)            | 0%         |
| Admin Web (74 fonctionnalités)| 0%         |
| Tests sandbox PayDunya        | 0%         |
| Déploiement VPS               | 0%         |