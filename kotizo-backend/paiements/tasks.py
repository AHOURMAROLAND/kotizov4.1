from celery import shared_task
from core.logger import logger


@shared_task(bind=True, max_retries=3)
def traiter_paiement_confirme(self, transaction_id):
    from django.utils import timezone
    from .models import Transaction
    from cotisations.models import Participation, Cotisation
    from .utils import initier_payout
    from core.utils import calculer_frais_kotizo

    try:
        transaction = Transaction.objects.get(id=transaction_id)

        participation = Participation.objects.get(
            paydunya_token=transaction.paydunya_token
        )
        cotisation = participation.cotisation

        participation.statut = 'paye'
        participation.date_paiement = timezone.now()
        participation.save(update_fields=['statut', 'date_paiement'])

        cotisation.participants_payes += 1
        cotisation.montant_collecte += participation.montant
        if cotisation.is_complete():
            cotisation.statut = 'complete'
        cotisation.save(update_fields=['participants_payes', 'montant_collecte', 'statut'])

        frais_paydunya = round(float(cotisation.montant_unitaire) * 0.02, 0)
        montant_net = float(cotisation.montant_unitaire)

        payout_transaction = Transaction.objects.create(
            user=cotisation.createur,
            type_transaction='payout',
            source='cotisation',
            source_id=str(cotisation.id),
            montant=cotisation.montant_unitaire,
            frais_paydunya=frais_paydunya,
            montant_net=montant_net,
            statut='initie',
            telephone_receveur=cotisation.numero_receveur,
            operateur=cotisation.operateur_receveur,
        )

        result = initier_payout(
            montant=montant_net,
            telephone=cotisation.numero_receveur,
            operateur=cotisation.operateur_receveur,
            description=f'Reversement cotisation {cotisation.nom}',
            reference=str(payout_transaction.id),
        )

        if result.get('response_code') == '00':
            payout_transaction.statut = 'en_attente'
            logger.paiement('PayOut initie', user_id=str(cotisation.createur.id), montant=montant_net)
        else:
            payout_transaction.statut = 'echoue'
            logger.error(f'PayOut echoue : {result}')
        payout_transaction.save(update_fields=['statut'])

        from notifications.tasks import envoyer_notification_paiement
        envoyer_notification_paiement.delay(str(participation.id))

        if cotisation.is_complete():
            from notifications.tasks import envoyer_notification_cotisation_complete
            envoyer_notification_cotisation_complete.delay(str(cotisation.id))

        from cotisations.utils import invalider_cache_cotisations
        invalider_cache_cotisations(str(cotisation.createur.id))

    except Exception as e:
        logger.error(f'Erreur traitement paiement : {str(e)}')
        raise self.retry(exc=e, countdown=60)


@shared_task
def verifier_payout_pending():
    from .models import Transaction
    from .utils import verifier_statut_payout
    from django.utils import timezone

    pending = Transaction.objects.filter(
        type_transaction='payout',
        statut='en_attente',
    )
    for transaction in pending:
        try:
            result = verifier_statut_payout(str(transaction.id))
            if result.get('status') == 'SUCCESS':
                transaction.statut = 'complete'
                transaction.date_completion = timezone.now()
                transaction.save(update_fields=['statut', 'date_completion'])
                logger.paiement('PayOut complete', user_id=str(transaction.user.id))
        except Exception as e:
            logger.error(f'Erreur verification payout {transaction.id} : {str(e)}')