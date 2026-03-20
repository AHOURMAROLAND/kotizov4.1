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

        creer_notification(
            user=participation.participant,
            type_notification='paiement_recu',
            titre='Paiement confirme',
            message=f'Votre paiement de {participation.montant} FCFA pour "{cotisation.nom}" est confirme.',
            data={'cotisation_slug': cotisation.slug},
        )
        creer_notification(
            user=cotisation.createur,
            type_notification='paiement_recu',
            titre='Nouveau paiement recu',
            message=f'{participation.participant.pseudo} a paye pour "{cotisation.nom}".',
            data={'cotisation_slug': cotisation.slug},
        )
    except Exception as e:
        logger.error(f'Erreur notification paiement : {str(e)}')


@shared_task
def envoyer_notification_cotisation_complete(cotisation_id):
    from cotisations.models import Cotisation
    from .utils import creer_notification
    try:
        cotisation = Cotisation.objects.get(id=cotisation_id)
        creer_notification(
            user=cotisation.createur,
            type_notification='cotisation_complete',
            titre='Cotisation complete !',
            message=f'Tous les participants ont paye pour "{cotisation.nom}". Total : {cotisation.montant_collecte} FCFA.',
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
            titre='Quick Pay paye !',
            message=f'Votre Quick Pay de {quickpay.montant} FCFA a ete paye. Reversement en cours.',
            data={'quickpay_code': quickpay.code},
        )
        if quickpay.payeur:
            creer_notification(
                user=quickpay.payeur,
                type_notification='paiement_recu',
                titre='Paiement confirme',
                message=f'Votre paiement de {quickpay.montant} FCFA via Quick Pay est confirme.',
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
                'Le bot WhatsApp est de nouveau actif.'
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
                'Le bot WhatsApp ne repond plus. Changez le numero dans le dashboard admin.'
            )

    statut.save()


@shared_task
def envoyer_rapport_journalier():
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from paiements.models import Transaction
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

            message = (
                f'*Kotizo* — Resume du {aujourd_hui.strftime("%d/%m/%Y")}\n\n'
                f'Paiements effectues : {total_payin} FCFA\n'
                f'Reversements recus : {total_payout} FCFA\n\n'
                f'Bonne soiree !'
            )

            if user.whatsapp_numero and user.whatsapp_verifie:
                envoyer_whatsapp(user.whatsapp_numero, message)
            elif user.email_verifie:
                envoyer_email(
                    user.email,
                    f'Votre resume Kotizo du {aujourd_hui.strftime("%d/%m/%Y")}',
                    message.replace('*', '')
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