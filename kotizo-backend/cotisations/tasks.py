from celery import shared_task
from core.logger import logger


@shared_task
def expirer_cotisations():
    from django.utils import timezone
    from .models import Cotisation
    expirees = Cotisation.objects.filter(
        statut='active',
        date_expiration__lte=timezone.now()
    )
    count = expirees.update(statut='expiree')
    if count:
        logger.info(f'{count} cotisations expirees')


@shared_task
def envoyer_rappel_non_payeurs(cotisation_id):
    from .models import Cotisation, Participation
    from core.whatsapp import envoyer_whatsapp
    from core.email_router import envoyer_email

    try:
        cotisation = Cotisation.objects.get(id=cotisation_id, statut='active')
        non_payes = Participation.objects.filter(
            cotisation=cotisation,
            statut='en_attente',
        ).select_related('participant')

        for participation in non_payes:
            user = participation.participant
            message = (
                f'*Kotizo* — Rappel de cotisation\n\n'
                f'{cotisation.createur.pseudo} vous rappelle que vous n\'avez pas encore paye '
                f'pour "{cotisation.nom}".\n\n'
                f'Montant : {cotisation.montant_unitaire} FCFA\n'
                f'Deadline : {cotisation.date_expiration.strftime("%d/%m/%Y")}\n\n'
                f'Payez maintenant : kotizo.app/c/{cotisation.slug}'
            )

            if user.whatsapp_numero and user.whatsapp_verifie:
                envoyer_whatsapp(user.whatsapp_numero, message)
            elif user.email_verifie:
                envoyer_email(
                    user.email,
                    f'Rappel - {cotisation.nom}',
                    message.replace('*', '')
                )

        logger.cotisation(
            f'Rappels envoyes a {non_payes.count()} participants',
            cotisation_id=str(cotisation_id)
        )
    except Exception as e:
        logger.error(f'Erreur rappel non payeurs : {str(e)}')


@shared_task
def generer_pdf_participants(cotisation_id):
    try:
        logger.cotisation(
            'Generation PDF participants demandee',
            cotisation_id=str(cotisation_id)
        )
    except Exception as e:
        logger.error(f'Erreur generation PDF : {str(e)}')