from celery import shared_task
from core.logger import logger


@shared_task
def envoyer_email_verification(user_id):
    from django.contrib.auth import get_user_model
    from core.email_router import envoyer_email
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        lien = f'https://api.kotizo.app/api/auth/verifier-email/{user.token_verification_email}/'
        corps = (
            f'Bonjour {user.prenom},\n\n'
            f'Cliquez sur ce lien pour verifier votre email (valable 5 minutes) :\n{lien}\n\n'
            f'L\'equipe Kotizo'
        )
        envoyer_email(user.email, 'Verifiez votre adresse email - Kotizo', corps)
        logger.auth('Email verification envoye', user_id=str(user.id))
    except Exception as e:
        logger.error(f'Erreur envoi email verification : {str(e)}')


@shared_task
def envoyer_email_reset_password(user_id):
    from django.contrib.auth import get_user_model
    from core.email_router import envoyer_email
    import secrets
    from django.utils import timezone
    from datetime import timedelta
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        token = secrets.token_urlsafe(16)
        user.token_verification_email = token
        user.token_email_expires = timezone.now() + timedelta(minutes=5)
        user.save(update_fields=['token_verification_email', 'token_email_expires'])
        lien = f'https://kotizo.app/reset/{token}'
        corps = (
            f'Bonjour {user.prenom},\n\n'
            f'Reinitialisation mot de passe (valable 5 minutes) :\n{lien}\n\n'
            f'L\'equipe Kotizo'
        )
        envoyer_email(user.email, 'Reinitialisation mot de passe - Kotizo', corps)
    except Exception as e:
        logger.error(f'Erreur envoi reset password : {str(e)}')


@shared_task
def reset_compteurs_quotidiens():
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    User = get_user_model()
    User.objects.all().update(
        cotisations_creees_aujourd_hui=0,
        date_reset_compteur=timezone.now().date()
    )
    logger.info('Compteurs quotidiens reinitialises')


@shared_task
def supprimer_tokens_expires():
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    User = get_user_model()
    maintenant = timezone.now()
    User.objects.filter(
        token_email_expires__lt=maintenant,
        email_verifie=False
    ).update(token_verification_email='', token_email_expires=None)
    User.objects.filter(
        whatsapp_token_expires__lt=maintenant,
        whatsapp_verifie=False
    ).update(whatsapp_verify_token='', whatsapp_token_expires=None)
    logger.info('Tokens expires supprimes')


@shared_task
def supprimer_comptes_non_verifies():
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from datetime import timedelta
    User = get_user_model()
    limite = timezone.now() - timedelta(hours=48)
    supprimes = User.objects.filter(
        email_verifie=False,
        whatsapp_verifie=False,
        date_inscription__lt=limite,
        is_staff=False,
    )
    count = supprimes.count()
    supprimes.delete()
    if count:
        logger.info(f'{count} comptes non verifies supprimes apres 48h')


@shared_task
def verifier_business_expires():
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from users.models import DemandeBusinessLevel
    User = get_user_model()
    demandes = DemandeBusinessLevel.objects.filter(
        statut='approuve',
        paiement_effectue=False,
        date_expiration_gratuite__lte=timezone.now(),
    )
    for demande in demandes:
        demande.statut = 'expire'
        demande.save()
        demande.user.niveau = 'verifie'
        demande.user.save(update_fields=['niveau'])
        logger.info(f'Business expire retrograde verifie', user_id=str(demande.user.id))


@shared_task
def verifier_seuils_ambassadeur():
    from django.contrib.auth import get_user_model
    User = get_user_model()
    for user in User.objects.filter(niveau='basique'):
        if user.peut_obtenir_verifie_ambassadeur():
            from notifications.utils import creer_notification
            creer_notification(
                user=user,
                type_notification='ambassadeur',
                titre='Niveau Verifie disponible gratuitement !',
                message='Seuil ambassadeur atteint. Allez dans Profil > Verification.',
            )
    for user in User.objects.filter(niveau='verifie'):
        if user.peut_obtenir_business_ambassadeur():
            from notifications.utils import creer_notification
            creer_notification(
                user=user,
                type_notification='ambassadeur',
                titre='Niveau Business disponible gratuitement !',
                message='Seuil ambassadeur Business atteint. Faites votre demande.',
            )


@shared_task
def notifier_promo_verification():
    from users.models import PromoVerification
    from django.utils import timezone
    promo = PromoVerification.objects.filter(active=True).first()
    if not promo:
        return
    if promo.date_fin and promo.date_fin < timezone.now():
        promo.active = False
        promo.save()
        return
    from django.contrib.auth import get_user_model
    from notifications.utils import creer_notification
    User = get_user_model()
    non_verifies = User.objects.filter(
        niveau='basique',
        email_verifie=True,
    ).exclude(verification__statut='approuve')
    for user in non_verifies[:100]:
        creer_notification(
            user=user,
            type_notification='promo_verification',
            titre='Verification a 500 FCFA !',
            message=f'Offre limitee : verifiez votre identite pour seulement 500 FCFA au lieu de 1 000 FCFA.',
        )