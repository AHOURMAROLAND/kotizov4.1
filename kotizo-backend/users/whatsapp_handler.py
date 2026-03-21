from django.utils import timezone
from core.logger import logger
from core.whatsapp import envoyer_whatsapp


def traiter_message_entrant(numero, message):
    message = message.strip()
    message_upper = message.upper()

    from django.contrib.auth import get_user_model
    User = get_user_model()

    if message_upper.startswith('KOTIZO-CONFIRM-'):
        token = message.replace('KOTIZO-CONFIRM-', '').strip()
        _traiter_confirmation(numero, token)
        return

    user = User.objects.filter(whatsapp_numero=numero).first()

    if not user:
        user_admin = User.objects.filter(
            admin_whatsapp_numero=numero,
            is_staff=True
        ).first()
        if user_admin:
            _traiter_commande_admin(numero, message, user_admin)
            return

        envoyer_whatsapp(
            numero,
            '*Kotizo*\n\nBonjour ! Vous n\'etes pas encore inscrit sur Kotizo.\n\n'
            'Telechargez l\'application pour commencer :\nkotizo.app'
        )
        return

    if message_upper == 'STOP':
        user.whatsapp_verifie = False
        user.save(update_fields=['whatsapp_verifie'])
        envoyer_whatsapp(numero, '*Kotizo*\n\nNotifications WhatsApp desactivees.')
        return

    if message_upper == 'AIDE':
        _envoyer_menu(numero, user)
        return

    if message_upper == 'SOLDE':
        _envoyer_solde(numero, user)
        return

    if message_upper == 'CONNEXION':
        _envoyer_lien_connexion(numero, user)
        return

    if message_upper.startswith('PAYER '):
        slug = message[6:].strip()
        _envoyer_lien_paiement(numero, user, slug)
        return

    if message_upper.startswith('IA:'):
        question = message[3:].strip()
        _traiter_question_ia(numero, user, question)
        return

    envoyer_whatsapp(
        numero,
        f'*Kotizo*\n\nCommande non reconnue.\nRepondez *AIDE* pour voir les commandes disponibles.'
    )


def _traiter_confirmation(numero, token):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    from django.core.cache import cache
    cle_tentatives = f'wa_tentatives_{numero}'
    tentatives = cache.get(cle_tentatives, 0)

    if tentatives >= 3:
        envoyer_whatsapp(
            numero,
            '*Kotizo*\n\nTrop de tentatives. Reessayez dans 12 heures.'
        )
        return

    if User.objects.filter(whatsapp_numero=numero).exists():
        envoyer_whatsapp(
            numero,
            '*Kotizo*\n\nCe numero est deja associe a un compte Kotizo.\n'
            'Connectez-vous sur l\'application avec vos identifiants.'
        )
        return

    try:
        user = User.objects.get(whatsapp_verify_token=token)
    except User.DoesNotExist:
        tentatives += 1
        cache.set(cle_tentatives, tentatives, 43200)
        envoyer_whatsapp(
            numero,
            '*Kotizo*\n\nCode invalide ou expire.\n'
            'Regenerez un nouveau lien depuis l\'application.'
        )
        return

    if user.whatsapp_token_expires and user.whatsapp_token_expires < timezone.now():
        envoyer_whatsapp(
            numero,
            '*Kotizo*\n\nCe code a expire (5 minutes).\n'
            'Regenerez un nouveau lien depuis l\'application.'
        )
        return

    user.whatsapp_numero = numero
    user.whatsapp_verifie = True
    user.whatsapp_verify_token = ''
    user.whatsapp_token_expires = None
    user.token_verification_email = ''
    user.token_email_expires = None
    user.save(update_fields=[
        'whatsapp_numero', 'whatsapp_verifie',
        'whatsapp_verify_token', 'whatsapp_token_expires',
        'token_verification_email', 'token_email_expires'
    ])

    cache.delete(f'wa_tentatives_{numero}')

    envoyer_whatsapp(
        numero,
        f'*Kotizo* — Compte confirme !\n\n'
        f'Bonjour {user.prenom}, votre compte est maintenant actif.\n\n'
        f'Connectez-vous sur l\'application avec vos identifiants :\n'
        f'kotizo.app\n\n'
        f'Repondez AIDE pour voir les commandes disponibles.'
    )
    logger.auth('WhatsApp confirme via bot', user_id=str(user.id))


def _envoyer_menu(numero, user):
    envoyer_whatsapp(
        numero,
        f'*Kotizo* — Commandes disponibles\n\n'
        f'AIDE → Afficher ce menu\n'
        f'SOLDE → Voir vos cotisations et Quick Pay actifs\n'
        f'PAYER KTZ-XXXXX → Lien direct de paiement\n'
        f'CONNEXION → Recevoir un lien de connexion rapide\n'
        f'IA: [question] → Poser une question a Kotizo IA\n'
        f'STOP → Desactiver les notifications WhatsApp\n\n'
        f'Niveau actuel : {user.niveau.capitalize()}'
    )


def _envoyer_solde(numero, user):
    from cotisations.models import Cotisation, Participation
    from quickpay.models import QuickPay

    cotisations_actives = Cotisation.objects.filter(
        createur=user, statut='active'
    ).count()

    non_payeurs = Participation.objects.filter(
        cotisation__createur=user,
        cotisation__statut='active',
        statut='en_attente'
    ).count()

    qp_actifs = QuickPay.objects.filter(
        createur=user, statut='actif'
    ).count()

    envoyer_whatsapp(
        numero,
        f'*Kotizo* — Votre compte\n\n'
        f'Pseudo : @{user.pseudo}\n'
        f'Niveau : {user.niveau.capitalize()}\n\n'
        f'Cotisations actives : {cotisations_actives}\n'
        f'Non-payeurs a relancer : {non_payeurs}\n'
        f'Quick Pay actifs : {qp_actifs}\n\n'
        f'Ouvrez l\'application pour plus de details.'
    )


def _envoyer_lien_connexion(numero, user):
    import secrets
    from datetime import timedelta

    token = secrets.token_urlsafe(16)
    user.token_verification_email = token
    user.token_email_expires = timezone.now() + timedelta(minutes=5)
    user.save(update_fields=['token_verification_email', 'token_email_expires'])

    lien = f'https://kotizo.app/connexion-rapide/{token}'

    envoyer_whatsapp(
        numero,
        f'*Kotizo* — Connexion rapide\n\n'
        f'Cliquez sur ce lien pour vous connecter (valable 5 minutes) :\n'
        f'{lien}\n\n'
        f'Ne partagez jamais ce lien.'
    )


def _envoyer_lien_paiement(numero, user, slug):
    from cotisations.models import Cotisation

    cotisation = Cotisation.objects.filter(slug=slug, statut='active').first()
    if not cotisation:
        envoyer_whatsapp(
            numero,
            f'*Kotizo*\n\nCotisation {slug} introuvable ou expiree.'
        )
        return

    envoyer_whatsapp(
        numero,
        f'*Kotizo* — Paiement\n\n'
        f'Cotisation : {cotisation.nom}\n'
        f'Montant : {cotisation.montant_unitaire} FCFA\n'
        f'Createur : @{cotisation.createur.pseudo}\n\n'
        f'Payez depuis l\'application :\n'
        f'kotizo.app/c/{slug}'
    )


def _traiter_question_ia(numero, user, question):
    from django.core.cache import cache
    from agent_ia.views import LIMITE_PAR_NIVEAU, get_compteur_ia, verifier_injection
    from agent_ia.kotizo_knowledge import KOTIZO_KNOWLEDGE
    from django.conf import settings

    limite = LIMITE_PAR_NIVEAU.get(user.niveau)
    if limite:
        compteur = get_compteur_ia(str(user.id))
        if compteur >= limite:
            envoyer_whatsapp(
                numero,
                f'*Kotizo IA*\n\nVous avez atteint votre limite de {limite} messages aujourd\'hui.\n'
                f'Reessayez demain ou passez au niveau superieur.'
            )
            return

    if verifier_injection(question):
        envoyer_whatsapp(
            numero,
            '*Kotizo IA*\n\nJe suis uniquement disponible pour les questions concernant Kotizo.'
        )
        return

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')

        system = f"""Tu es Kotizo IA. Reponds uniquement aux questions sur Kotizo.
Sois bref (max 3 phrases) car tu reponds sur WhatsApp.
{KOTIZO_KNOWLEDGE}"""

        response = model.generate_content(
            f'{system}\n\nQuestion : {question}',
            generation_config={'max_output_tokens': 200},
        )
        reponse = response.text

    except Exception as e:
        logger.error(f'Erreur Gemini WhatsApp : {str(e)}')
        reponse = 'Je rencontre une difficulte technique. Utilisez l\'application pour plus d\'aide.'

    envoyer_whatsapp(numero, f'*Kotizo IA*\n\n{reponse}')

    from agent_ia.views import incrementer_compteur_ia
    incrementer_compteur_ia(str(user.id))


def _traiter_commande_admin(numero, message, admin):
    from django.core.cache import cache

    cle_pin = f'admin_wa_pin_{numero}'
    cle_auth = f'admin_wa_auth_{numero}'

    message_upper = message.upper().strip()

    COMMANDES_LECTURE = ['STATS', 'ALERTES', 'TICKETS', 'SOLDE']

    if message_upper in COMMANDES_LECTURE:
        _executer_commande_admin_lecture(numero, message_upper, admin)
        return

    pin_valide = cache.get(cle_auth, False)
    if not pin_valide:
        pin_saisi = message.strip()
        if pin_saisi == admin.admin_whatsapp_pin:
            cache.set(cle_auth, True, 300)
            envoyer_whatsapp(numero, '*Kotizo Admin*\n\nPIN valide. Vous avez 5 minutes.')
        else:
            envoyer_whatsapp(numero, '*Kotizo Admin*\n\nPIN incorrect. Envoyez votre PIN pour continuer.')
        return

    _executer_commande_admin_action(numero, message, admin)


def _executer_commande_admin_lecture(numero, commande, admin):
    from django.utils import timezone
    today = timezone.now().date()

    if commande == 'STATS':
        from paiements.models import Transaction
        from django.contrib.auth import get_user_model
        from django.db import models as db_models
        User = get_user_model()

        revenus = Transaction.objects.filter(
            date_creation__date=today,
            statut='complete',
            type_transaction='payin',
        ).aggregate(total=db_models.Sum('frais_kotizo'))['total'] or 0

        nouveaux = User.objects.filter(date_inscription__date=today).count()

        envoyer_whatsapp(
            numero,
            f'*Kotizo Admin* — Stats du {today.strftime("%d/%m/%Y")}\n\n'
            f'Nouveaux users : {nouveaux}\n'
            f'Revenus Kotizo : {revenus} FCFA'
        )

    elif commande == 'ALERTES':
        from users.models import AlerteFraude
        alertes = AlerteFraude.objects.filter(statut='nouvelle').count()
        envoyer_whatsapp(numero, f'*Kotizo Admin*\n\nAlertes fraude nouvelles : {alertes}')

    elif commande == 'TICKETS':
        from agent_ia.models import TicketSupport
        tickets = TicketSupport.objects.filter(statut='ouvert').count()
        envoyer_whatsapp(numero, f'*Kotizo Admin*\n\nTickets ouverts : {tickets}')


def _executer_commande_admin_action(numero, message, admin):
    parts = message.strip().split(' ', 1)
    commande = parts[0].upper()
    arg = parts[1] if len(parts) > 1 else ''

    if commande == 'SUSPEND' and arg:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=arg)
            user.is_active = False
            user.save(update_fields=['is_active'])
            envoyer_whatsapp(numero, f'*Kotizo Admin*\n\nCompte {arg} suspendu.')
        except User.DoesNotExist:
            envoyer_whatsapp(numero, f'*Kotizo Admin*\n\nUser {arg} introuvable.')
    else:
        envoyer_whatsapp(
            numero,
            '*Kotizo Admin* — Commandes disponibles\n\n'
            'Sans PIN : STATS, ALERTES, TICKETS\n'
            'Avec PIN : SUSPEND [email]'
        )