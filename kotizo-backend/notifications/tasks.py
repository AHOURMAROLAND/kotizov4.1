from celery import shared_task
from core.logger import logger


@shared_task
def envoyer_notification_paiement(participation_id):
    from cotisations.models import Participation
    from .utils import creer_notification
    try:
        participation = Participation.objects.select_related(
            'cotisation', 'cotisation__createur', 'participant'
        ).get(id=participation_id)
        cotisation = participation.cotisation
        participant = participation.participant
        createur = cotisation.createur

        creer_notification(
            user=participant,
            type_notification='paiement_recu',
            titre='Paiement confirme',
            message=(
                f'Votre paiement de {participation.montant:,} FCFA pour la cotisation '
                f'"{cotisation.nom}" a bien ete enregistre. '
                f'@{createur.pseudo} en a ete notifie.'
            ),
            data={'cotisation_slug': cotisation.slug},
        )

        creer_notification(
            user=createur,
            type_notification='paiement_recu',
            titre=f'{participant.prenom} vient de payer',
            message=(
                f'@{participant.pseudo} a paye {participation.montant:,} FCFA '
                f'pour votre cotisation "{cotisation.nom}". '
                f'Progression : {cotisation.participants_payes}/{cotisation.nombre_participants} '
                f'participants · {cotisation.get_progression()}% complete.'
            ),
            data={'cotisation_slug': cotisation.slug},
        )
    except Exception as e:
        logger.error(f'Erreur notification paiement : {str(e)}')


@shared_task
def envoyer_notification_cotisation_complete(cotisation_id):
    from cotisations.models import Cotisation
    from .utils import creer_notification
    try:
        cotisation = Cotisation.objects.select_related('createur').get(id=cotisation_id)
        creer_notification(
            user=cotisation.createur,
            type_notification='cotisation_complete',
            titre='Cotisation complete — Felicitations !',
            message=(
                f'Tous les {cotisation.nombre_participants} participants ont paye pour '
                f'"{cotisation.nom}". '
                f'Montant total collecte : {cotisation.montant_collecte:,} FCFA. '
                f'Le reversement sur votre Mobile Money est en cours de traitement.'
            ),
            data={'cotisation_slug': cotisation.slug},
        )
    except Exception as e:
        logger.error(f'Erreur notification cotisation complete : {str(e)}')


@shared_task
def envoyer_notification_quickpay_paye(quickpay_id):
    from quickpay.models import QuickPay
    from .utils import creer_notification
    try:
        quickpay = QuickPay.objects.select_related('createur', 'payeur').get(id=quickpay_id)

        creer_notification(
            user=quickpay.createur,
            type_notification='paiement_recu',
            titre='Quick Pay paye — Reversement en cours',
            message=(
                f'Votre Quick Pay de {quickpay.montant:,} FCFA (code : {quickpay.code}) '
                f'{"a ete paye par " + quickpay.payeur.prenom if quickpay.payeur else "a ete paye"}. '
                f'Le montant est en cours de reversement sur votre Mobile Money.'
            ),
            data={'quickpay_code': quickpay.code},
        )

        if quickpay.payeur:
            creer_notification(
                user=quickpay.payeur,
                type_notification='paiement_recu',
                titre='Paiement Quick Pay confirme',
                message=(
                    f'Votre paiement de {quickpay.montant:,} FCFA a ete confirme avec succes. '
                    f'Code de reference : {quickpay.code}. '
                    f'Merci d\'utiliser Kotizo !'
                ),
                data={'quickpay_code': quickpay.code},
            )
    except Exception as e:
        logger.error(f'Erreur notification quickpay : {str(e)}')


@shared_task
def ping_evolution_api():
    from core.whatsapp import verifier_statut_bot
    from notifications.models import StatutWhatsApp
    from django.utils import timezone

    statut, created = StatutWhatsApp.objects.get_or_create(id=1)
    bot_actif = verifier_statut_bot()
    statut.dernier_ping = timezone.now()

    if bot_actif:
        if statut.nb_pings_echoues >= 3:
            statut.date_retablissement = timezone.now()
            statut.nb_pings_echoues = 0
            statut.actif = True
            logger.whatsapp('Bot WhatsApp retabli')
            from core.email_router import envoyer_email
            from django.conf import settings
            envoyer_email(
                settings.GMAIL_USER,
                'Kotizo — Bot WhatsApp retabli',
                'Le bot WhatsApp est de nouveau actif et operationnel.'
            )
        else:
            statut.nb_pings_echoues = 0
            statut.actif = True
    else:
        statut.nb_pings_echoues += 1
        if statut.nb_pings_echoues == 3:
            statut.actif = False
            statut.date_derniere_panne = timezone.now()
            logger.whatsapp('Bot WhatsApp en panne - 3 pings echoues')
            from core.email_router import envoyer_email
            from django.conf import settings
            envoyer_email(
                settings.GMAIL_USER,
                'Kotizo — PANNE Bot WhatsApp',
                (
                    'ALERTE : Le bot WhatsApp ne repond plus depuis 15 minutes.\n\n'
                    'Actions requises :\n'
                    '1. Verifiez l\'etat du conteneur Evolution API\n'
                    '2. Changez le numero si necessaire depuis le dashboard admin\n\n'
                    'Dashboard : admin.kotizo.app'
                )
            )

    statut.save()


@shared_task
def envoyer_rapport_journalier():
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from paiements.models import Transaction
    from django.db import models as db_models
    from core.email_router import envoyer_email
    from core.whatsapp import envoyer_whatsapp

    User = get_user_model()
    aujourd_hui = timezone.now().date()

    users_actifs = User.objects.filter(
        transactions__date_creation__date=aujourd_hui,
        transactions__statut='complete',
    ).distinct()

    for user in users_actifs:
        try:
            transactions = Transaction.objects.filter(
                user=user,
                date_creation__date=aujourd_hui,
                statut='complete',
            )
            if not transactions.exists():
                continue

            total_payin = sum(
                float(t.montant) for t in transactions
                if t.type_transaction == 'payin'
            )
            total_payout = sum(
                float(t.montant) for t in transactions
                if t.type_transaction == 'payout'
            )
            nb_transactions = transactions.count()

            message = (
                f'*Kotizo — Resume du {aujourd_hui.strftime("%d/%m/%Y")}*\n\n'
                f'Bonjour {user.prenom},\n\n'
                f'Voici votre bilan du jour :\n'
                f'• Transactions effectuees : {nb_transactions}\n'
                f'• Montants payes : {total_payin:,.0f} FCFA\n'
                f'• Reversements recus : {total_payout:,.0f} FCFA\n\n'
                f'Merci de faire confiance a Kotizo !\n'
                f'_Cotisez Ensemble, Simplement_'
            )

            if user.whatsapp_numero and user.whatsapp_verifie:
                envoyer_whatsapp(user.whatsapp_numero, message)
            elif user.email_verifie:
                envoyer_email(
                    user.email,
                    f'Votre resume Kotizo du {aujourd_hui.strftime("%d/%m/%Y")}',
                    message.replace('*', '').replace('_', '')
                )
        except Exception as e:
            logger.error(f'Erreur rapport journalier user {user.id} : {str(e)}')


@shared_task
def reset_compteurs_email():
    from django.core.cache import cache
    providers = ['gmail', 'brevo', 'mailjet', 'resend']
    for provider in providers:
        cache.set(f'email_count_{provider}', 0, 86400)
    logger.info('Compteurs email reinitialises')