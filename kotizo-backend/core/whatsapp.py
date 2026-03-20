import random
import time
import requests
from django.conf import settings
from core.logger import logger


def envoyer_whatsapp(telephone, message, media_url=None):
    delai = random.uniform(3, 6)
    time.sleep(delai)

    try:
        url = f'{settings.EVOLUTION_API_URL}/message/sendText/kotizo-bot'
        headers = {
            'apikey': settings.EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
        }
        payload = {
            'number': telephone,
            'text': message,
        }

        response = requests.post(url, json=payload, headers=headers, timeout=30)

        if response.status_code == 201:
            logger.whatsapp(
                f'Message envoye a {telephone}',
                numero=telephone,
                statut='succes'
            )
            return True
        else:
            logger.whatsapp(
                f'Echec envoi a {telephone} : {response.status_code}',
                numero=telephone,
                statut='echec'
            )
            return False

    except Exception as e:
        logger.error(f'Erreur WhatsApp {telephone} : {str(e)}')
        return False


def envoyer_whatsapp_image(telephone, image_url, caption=''):
    delai = random.uniform(3, 6)
    time.sleep(delai)

    try:
        url = f'{settings.EVOLUTION_API_URL}/message/sendMedia/kotizo-bot'
        headers = {
            'apikey': settings.EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
        }
        payload = {
            'number': telephone,
            'mediatype': 'image',
            'media': image_url,
            'caption': caption,
        }

        response = requests.post(url, json=payload, headers=headers, timeout=30)
        return response.status_code == 201

    except Exception as e:
        logger.error(f'Erreur WhatsApp image {telephone} : {str(e)}')
        return False


def verifier_statut_bot():
    try:
        url = f'{settings.EVOLUTION_API_URL}/instance/fetchInstances'
        headers = {'apikey': settings.EVOLUTION_API_KEY}
        response = requests.get(url, headers=headers, timeout=10)
        return response.status_code == 200
    except Exception:
        return False
