from django.core.cache import cache
from core.utils import generer_code


def generer_slug():
    from cotisations.models import Cotisation
    while True:
        slug = 'KTZ-' + generer_code(6)
        if not Cotisation.objects.filter(slug=slug).exists():
            return slug


def get_cache_cotisations(user_id):
    return cache.get(f'cotisations_actives_{user_id}')


def set_cache_cotisations(user_id, data):
    cache.set(f'cotisations_actives_{user_id}', data, 300)


def invalider_cache_cotisations(user_id):
    cache.delete(f'cotisations_actives_{user_id}')


def peut_creer_cotisation(user):
    if user.niveau != 'basique':
        return True, None

    from django.utils import timezone
    from datetime import timedelta

    maintenant = timezone.now()

    if user.debut_fenetre_7j:
        jours = (maintenant - user.debut_fenetre_7j).days
        if jours >= 7:
            user.debut_fenetre_7j = maintenant
            user.cotisations_creees_fenetre = 0
            user.cotisations_creees_aujourd_hui = 0
            user.save(update_fields=[
                'debut_fenetre_7j',
                'cotisations_creees_fenetre',
                'cotisations_creees_aujourd_hui'
            ])
    else:
        user.debut_fenetre_7j = maintenant
        user.cotisations_creees_fenetre = 0
        user.save(update_fields=['debut_fenetre_7j', 'cotisations_creees_fenetre'])

    if user.cotisations_creees_aujourd_hui >= 3:
        return False, 'Limite de 3 cotisations par jour atteinte'

    if user.cotisations_creees_fenetre >= 12:
        return False, 'Limite de 12 cotisations par semaine atteinte'

    return True, None