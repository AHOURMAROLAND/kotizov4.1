KOTIZO_KNOWLEDGE = """
== KOTIZO — BASE DE CONNAISSANCE COMPLETE ==

[APPLICATION]
Kotizo est une application mobile de cotisations collectives et de paiements
rapides via Mobile Money au Togo.
Slogan : Cotisez Ensemble, Simplement
Disponible sur iOS et Android.

[NIVEAUX UTILISATEURS]
- Basique : gratuit, 3 cotisations/jour, max 12/semaine (fenetre 7 jours)
- Verifie : 1000 FCFA unique (ou 500 FCFA si promo), 20 cotisations/jour
- Business : 5000 FCFA/an, cotisations illimitees

[COTISATIONS]
- Creation : nom, description, montant (200-250000 FCFA), nb participants,
  numero receveur Mobile Money, duree max 30 jours
- Frais Kotizo : 0.5% du montant
- Frais totaux participant : 5% (0.5% Kotizo + 2.5% PayDunya PayIn + 2% PayOut)
- Le createur recoit le montant original sans frais
- Slug unique genere automatiquement : KTZ-XXXXXX
- QR Code et lien de partage disponibles
- Rappel aux non-payeurs en 1 clic
- Export PDF (tous) / Excel (Business uniquement)
- Cotisation recurrente mensuelle (tontine) disponible

[QUICK PAY]
- Demande de paiement instantanee
- Montant 200-250000 FCFA + note optionnelle
- Code unique 6 caracteres + QR + lien
- Expire automatiquement apres 1 heure
- 1 Quick Pay = 1 seul paiement

[OPERATEURS SUPPORTES]
- Moov Money Togo
- Mixx by Yas (Togocel)
- T-Money Togo

[VERIFICATION IDENTITE]
- Documents acceptes : CNI, Passeport, Carte consulaire
- Etapes : photo recto + verso + liveness check
- Traitement admin 24-48h
- Cout : 1000 FCFA (ou 500 FCFA si promo active)
- Apres approbation : nom et prenom verrouilles

[PARRAINAGE AMBASSADEUR]
- Niveau Verifie gratuit : 50 parrainages OU 25 filleuls avec 3+ cotisations
- Niveau Business gratuit : 100 parrainages OU 50 filleuls avec 3+ transactions
- Code parrainage personnel disponible dans le profil

[NOTIFICATIONS]
- WhatsApp et/ou email selon preference
- Confirmation paiement, cotisation complete, rappels, alertes securite
- Rapport journalier chaque soir si activite

[SECURITE]
- Tokens expiration 5 minutes
- Blocage 12h apres 3 tentatives echouees
- JWT Access 30min / Refresh 7 jours
- Signalement disponible sur chaque cotisation

[SUPPORT]
- Agent IA disponible depuis le bouton flottant
- Tickets support pour les problemes complexes
- Reclamations avec capture d'ecran possibles
"""