from celery import shared_task
from core.logger import logger


@shared_task
def reset_compteurs_ia():
    from django.core.cache import cache
    from django.contrib.auth import get_user_model
    User = get_user_model()
    from django.utils import timezone
    today = timezone.now().date().isoformat()
    for user in User.objects.filter(is_active=True):
        cache.delete(f'ia_msgs_{user.id}_{today}')
    logger.info('Compteurs IA reinitialises')


@shared_task
def supprimer_conversations_ia():
    from django.utils import timezone
    from datetime import timedelta
    from .models import ConversationIA
    limite = timezone.now() - timedelta(days=90)
    count, _ = ConversationIA.objects.filter(date_creation__lt=limite).delete()
    if count:
        logger.info(f'{count} conversations IA supprimees apres 90 jours')