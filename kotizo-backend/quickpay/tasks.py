from celery import shared_task
from core.logger import logger


@shared_task
def expirer_quickpay():
    from django.utils import timezone
    from .models import QuickPay
    expires = QuickPay.objects.filter(
        statut='actif',
        date_expiration__lte=timezone.now()
    )
    count = expires.update(statut='expire')
    if count:
        logger.info(f'{count} quickpay expires')


@shared_task(bind=True, max_retries=3)
def traiter_payout_quickpay(self, quickpay_id):
    from django.utils import timezone
    from .models import QuickPay
    from paiements.models import Transaction
    from paiements.utils import initier_payout

    try:
        quickpay = QuickPay.objects.get(id=quickpay_id)
        frais_paydunya = round(float(quickpay.montant) * 0.02, 0)
        montant_net = float(quickpay.montant)

        payout_transaction = Transaction.objects.create(
            user=quickpay.createur,
            type_transaction='payout',
            source='quickpay',
            source_id=str(quickpay.id),
            montant=quickpay.montant,
            frais_paydunya=frais_paydunya,
            montant_net=montant_net,
            statut='initie',
            telephone_receveur=quickpay.numero_receveur,
            operateur=quickpay.operateur_receveur,
        )

        result = initier_payout(
            montant=montant_net,
            telephone=quickpay.numero_receveur,
            operateur=quickpay.operateur_receveur,
            description=f'Quick Pay {quickpay.code}',
            reference=str(payout_transaction.id),
        )

        if result.get('response_code') == '00':
            payout_transaction.statut = 'en_attente'
            logger.paiement('QuickPay payout initie', user_id=str(quickpay.createur.id))
        else:
            payout_transaction.statut = 'echoue'
            logger.error(f'QuickPay payout echoue : {result}')
        payout_transaction.save(update_fields=['statut'])

        from notifications.tasks import envoyer_notification_quickpay_paye
        envoyer_notification_quickpay_paye.delay(str(quickpay.id))

    except Exception as e:
        logger.error(f'Erreur payout quickpay : {str(e)}')
        raise self.retry(exc=e, countdown=60)