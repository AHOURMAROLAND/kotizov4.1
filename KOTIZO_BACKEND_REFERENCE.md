# KOTIZO — RÉFÉRENCE TECHNIQUE BACKEND

## STRUCTURE DU PROJET
```
kotizo/
├── kotizo-backend/
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── celery.py
│   │   └── wsgi.py
│   ├── core/
│   │   ├── logger.py
│   │   ├── middleware.py
│   │   ├── decorators.py
│   │   ├── permissions.py
│   │   ├── utils.py
│   │   ├── email_router.py
│   │   └── whatsapp.py         (À CRÉER)
│   ├── users/
│   ├── cotisations/
│   ├── paiements/
│   ├── quickpay/
│   ├── notifications/
│   ├── agent_ia/
│   │   └── kotizo_knowledge.py (À CRÉER en priorité)
│   ├── admin_panel/
│   ├── run.py
│   └── .env
├── kotizo-mobile/
└── kotizo-admin/
```

## MODÈLES DJANGO — CHAMPS CLÉS

### User
```python
id                              = UUIDField(primary_key=True)
email                           = EmailField(unique=True)
nom                             = CharField(max_length=100)
prenom                          = CharField(max_length=100)
pseudo                          = CharField(max_length=20, unique=True)
nom_verifie                     = BooleanField(default=False)
telephone                       = CharField(max_length=20)
pays                            = CharField(max_length=5)
niveau                          = CharField(choices=['basique','verifie','business'])
email_verifie                   = BooleanField(default=False)
token_verification_email        = CharField(max_length=100, blank=True)
token_email_expires             = DateTimeField(null=True)
whatsapp_numero                 = CharField(max_length=20, unique=True, null=True)
whatsapp_verifie                = BooleanField(default=False)
whatsapp_verify_token           = CharField(max_length=20, blank=True)
whatsapp_token_expires          = DateTimeField(null=True)
whatsapp_nouveau_numero_pending = CharField(max_length=20, blank=True)

# Formule fenêtre glissante Basique
cotisations_creees_aujourd_hui  = IntegerField(default=0)
cotisations_creees_fenetre      = IntegerField(default=0)
debut_fenetre_7j                = DateTimeField(null=True)
date_reset_compteur             = DateField(null=True)

# Parrainage
nb_parrainages_actifs           = IntegerField(default=0)
code_parrainage                 = CharField(max_length=10, unique=True)
parrain                         = ForeignKey('self', null=True)

# Prix vérification
prix_verification               = IntegerField(default=1000)

# Admin
fcm_token                       = TextField(blank=True)
device_id                       = CharField(max_length=200, blank=True)
admin_role                      = CharField(choices=[...], null=True)
admin_permissions               = JSONField(default=list)
admin_whatsapp_numero           = CharField(max_length=20, blank=True)
admin_whatsapp_pin              = CharField(max_length=128, blank=True)

# Position
ville_approx                    = CharField(max_length=100, blank=True)
consentement_position           = BooleanField(default=False)
```

### Cotisation
```python
id                  = UUIDField
createur            = ForeignKey(User)
nom                 = CharField
montant_unitaire    = DecimalField  # 200–250 000
nombre_participants = IntegerField
numero_receveur     = CharField
statut              = CharField(choices=['active','complete','expiree',
                                         'suspendue','annulee'])
slug                = CharField(unique=True)  # KTZ-XXXXXX
date_expiration     = DateTimeField  # max 30 jours
est_recurrente      = BooleanField
```

### Transaction
```python
user              = ForeignKey(User)
type_transaction  = CharField(choices=['payin','payout',
                                        'frais_verification','frais_business'])
source            = CharField(choices=['cotisation','quickpay',
                                        'verification','business'])
montant           = DecimalField
frais_kotizo      = DecimalField  # 0,5% du montant
frais_paydunya    = DecimalField  # 4,5% du montant
statut            = CharField(choices=['initie','en_attente',
                                        'complete','echoue','rembourse'])
paydunya_token    = CharField
```

## CALCUL DES FRAIS
```python
def calculer_frais_kotizo(montant):
    """0,5% du montant."""
    return round(float(montant) * 0.005, 0)

def calculer_total_participant(montant):
    """5% total (0,5% Kotizo + 4,5% PayDunya)."""
    return round(float(montant) * 1.05, 0)

def calculer_montant_net_createur(montant):
    """Créateur reçoit le montant original."""
    return float(montant)
```

## LOGIQUE FENÊTRE GLISSANTE BASIQUE
```python
def peut_creer_cotisation(user):
    if user.niveau != 'basique':
        return True, None
    maintenant = timezone.now()
    if user.debut_fenetre_7j:
        jours = (maintenant - user.debut_fenetre_7j).days
        if jours >= 7:
            user.debut_fenetre_7j = maintenant
            user.cotisations_creees_fenetre = 0
            user.cotisations_creees_aujourd_hui = 0
            user.save(update_fields=['debut_fenetre_7j',
                      'cotisations_creees_fenetre',
                      'cotisations_creees_aujourd_hui'])
    else:
        user.debut_fenetre_7j = maintenant
        user.cotisations_creees_fenetre = 0
        user.save(update_fields=['debut_fenetre_7j',
                  'cotisations_creees_fenetre'])
    if user.cotisations_creees_aujourd_hui >= 3:
        return False, 'Limite de 3 cotisations par jour atteinte'
    if user.cotisations_creees_fenetre >= 12:
        return False, 'Limite de 12 cotisations par semaine atteinte'
    return True, None
```

## ENDPOINTS API

### Auth (/api/auth/)
- POST inscription/
- POST connexion/
- POST deconnexion/
- POST token/refresh/
- GET  verifier-email/<token>/
- POST mot-de-passe-oublie/
- POST reinitialisation/<token>/
- GET  moi/
- PATCH moi/
- GET  moi/stats/
- POST fcm-token/
- POST whatsapp/webhook/      (À CRÉER — bot interactif)
- POST whatsapp/confirmer/    (À CRÉER — confirmation numéro)

### Cotisations (/api/cotisations/)
- GET + POST
- GET mes-participations/
- GET publique/<slug>/
- GET + DELETE <slug>/
- POST <slug>/rejoindre/
- GET  <slug>/participants/
- POST <slug>/signaler/
- POST participation/<id>/confirmer-recu/

### Paiements (/api/paiements/)
- POST initier/<slug>/
- GET  verifier/<invoice_token>/
- POST webhook/payin/        # TOUJOURS request.POST
- POST webhook/payout/
- GET  historique/
- POST remboursement/

### QuickPay (/api/quickpay/)
- GET + POST
- GET  recus/
- POST webhook/              # TOUJOURS request.POST
- GET  <code>/
- POST <code>/payer/

### Notifications (/api/notifications/)
- GET (liste)
- GET non-lues/
- POST tout-lire/
- POST <id>/lire/

### Agent IA (/api/agent-ia/)
- POST message/              (À CRÉER)
- GET  historique/           (À CRÉER)
- POST reclamation/          (À CRÉER)

### Logs (/api/logs/)
- POST state/                (À CRÉER — state loggers mobile)

## CELERY BEAT — TÂCHES PLANIFIÉES

| Tâche | Fréquence |
|-------|-----------|
| expirer_quickpay | 60 secondes |
| verifier_payout_pending | 5 minutes |
| ping_evolution_api | 5 minutes |
| expirer_cotisations | 1 heure |
| supprimer_tokens_expires | 1 heure |
| lever_blocages_30min | 1 heure |
| reset_compteurs_quotidiens | Minuit |
| reset_compteurs_ia | Minuit |
| envoyer_rapport_journalier | 20h chaque soir |
| verifier_seuils_ambassadeur | 1 fois/jour |
| verifier_business_expires | 1 fois/jour |
| supprimer_comptes_non_verifies | 1 fois/jour (48h) |
| supprimer_conversations_ia | 1 fois/jour (90j) |
| reset_compteurs_email | Minuit |
| generer_rapport_admin_journalier | 1 fois/jour |
| notifier_promo_verification | 1 heure (si promo active) |

NOTE : pas de reset hebdomadaire fixe —
la fenêtre 7j est glissante par utilisateur (logique dans la vue)

## DOCKER COMPOSE
```yaml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes:
      - redis_data:/data
  evolution:
    image: atendai/evolution-api:latest
    ports: ["8080:8080"]
    environment:
      - AUTHENTICATION_API_KEY=kotizo-evolution-key-2026
      - WEBHOOK_GLOBAL_URL=http://host.docker.internal:8000/api/whatsapp/webhook/
    volumes:
      - evolution_data:/evolution/instances
volumes:
  redis_data:
  evolution_data:
```

Commandes de démarrage :
  docker compose up -d
  python run.py runserver
  celery -A config worker --loglevel=info --pool=solo

## POINTS CRITIQUES TECHNIQUES

1. Webhooks PayDunya : request.POST — JAMAIS json.loads(request.body)
2. Frais Kotizo : 0,5% — calculer_frais_kotizo(montant)
3. Délai bot WhatsApp : random.uniform(3, 6) — jamais délai fixe
4. Hash webhook PayDunya : sha512(MASTER_KEY) — valider en sandbox
5. expo-face-detector : vérifier compatibilité Expo SDK 55 avant F5
6. Compteurs IA Redis : clé ia_msgs_{user_id}_{date}
7. Blocage 12h : sur numéro téléphone, pas IP
8. Fenêtre 7j : glissante par user (timestamp) — pas reset lundi
9. Consentement position : case cochée à l'inscription (A6)