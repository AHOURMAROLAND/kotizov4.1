import logging
from django.core.mail import get_connection, EmailMessage
from django.conf import settings

log = logging.getLogger('kotizo')


def get_provider_actif():
    try:
        from django.core.cache import cache
        for provider in settings.EMAIL_PROVIDERS:
            count = cache.get(f'email_count_{provider["name"]}', 0)
            if count < provider['daily_limit']:
                return provider
    except Exception as e:
        log.error(f'Erreur selection provider email : {str(e)}')
    return None


def envoyer_email(destinataire, sujet, corps, html=False):
    provider = get_provider_actif()
    if not provider:
        log.error('Tous les quotas email sont atteints')
        return False

    try:
        connection = get_connection(
            backend=provider['backend'],
            host=provider['host'],
            port=provider['port'],
            username=provider['user'],
            password=provider['password'],
            use_tls=provider['use_tls'],
        )

        email = EmailMessage(
            subject=sujet,
            body=corps,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[destinataire],
            connection=connection,
        )

        if html:
            email.content_subtype = 'html'

        email.send()

        from django.core.cache import cache
        cache.incr(f'email_count_{provider["name"]}')

        log.info(f'Email envoye via {provider["name"]} a {destinataire}')
        return True

    except Exception as e:
        log.error(f'Erreur envoi email via {provider["name"]} : {str(e)}')
        return False