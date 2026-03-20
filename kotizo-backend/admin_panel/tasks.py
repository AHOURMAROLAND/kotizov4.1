from celery import shared_task
from core.logger import logger


@shared_task
def generer_rapport_admin_journalier():
    from django.utils import timezone
    from django.contrib.auth import get_user_model
    from paiements.models import Transaction
    from cotisations.models import Cotisation
    from quickpay.models import QuickPay
    from users.models import AlerteFraude, VerificationIdentite
    from agent_ia.models import TicketSupport
    from .models import RapportJournalier
    from django.db import models as db_models

    User = get_user_model()
    aujourd_hui = timezone.now().date()

    if RapportJournalier.objects.filter(date=aujourd_hui).exists():
        return

    transactions = Transaction.objects.filter(
        date_creation__date=aujourd_hui,
        statut='complete',
        type_transaction='payin',
    )

    volume = transactions.aggregate(
        total=db_models.Sum('montant')
    )['total'] or 0

    revenus = transactions.aggregate(
        total=db_models.Sum('frais_kotizo')
    )['total'] or 0

    RapportJournalier.objects.create(
        date=aujourd_hui,
        nb_nouveaux_users=User.objects.filter(
            date_inscription__date=aujourd_hui
        ).count(),
        nb_transactions=transactions.count(),
        volume_total=volume,
        revenus_kotizo=revenus,
        nb_cotisations_creees=Cotisation.objects.filter(
            date_creation__date=aujourd_hui
        ).count(),
        nb_quickpay=QuickPay.objects.filter(
            date_creation__date=aujourd_hui
        ).count(),
        nb_alertes_fraude=AlerteFraude.objects.filter(
            date_creation__date=aujourd_hui
        ).count(),
        nb_tickets_ouverts=TicketSupport.objects.filter(
            statut='ouvert'
        ).count(),
        nb_verifications_soumises=VerificationIdentite.objects.filter(
            date_soumission__date=aujourd_hui
        ).count(),
    )
    logger.info(f'Rapport journalier admin genere pour {aujourd_hui}')