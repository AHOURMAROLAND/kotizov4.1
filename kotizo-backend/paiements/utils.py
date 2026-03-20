import hashlib
import requests
from django.conf import settings

PAYDUNYA_BASE_URL = 'https://app.paydunya.com/api'


def get_headers():
    return {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': settings.PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': settings.PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': settings.PAYDUNYA_TOKEN,
    }


def verifier_hash_webhook(master_key):
    return hashlib.sha512(master_key.encode()).hexdigest()


def creer_invoice_payin(montant, description, token_reference, return_url, cancel_url, ipn_url):
    payload = {
        'invoice': {
            'total_amount': int(montant),
            'description': description,
        },
        'store': {
            'name': 'Kotizo',
            'tagline': 'Cotisez ensemble, simplement',
            'postal_address': 'Lome, Togo',
        },
        'actions': {
            'cancel_url': cancel_url,
            'return_url': return_url,
            'callback_url': ipn_url,
        },
        'custom_data': {
            'token_reference': token_reference,
        },
    }
    try:
        response = requests.post(
            f'{PAYDUNYA_BASE_URL}/v1/checkout-invoice/create',
            json=payload,
            headers=get_headers(),
            timeout=30,
        )
        return response.json()
    except Exception as e:
        return {'response_code': 'error', 'message': str(e)}


def confirmer_invoice(token):
    try:
        response = requests.get(
            f'{PAYDUNYA_BASE_URL}/v1/checkout-invoice/confirm/{token}',
            headers=get_headers(),
            timeout=30,
        )
        return response.json()
    except Exception as e:
        return {'response_code': 'error', 'message': str(e)}


def initier_payout(montant, telephone, operateur, description, reference):
    payload = {
        'account_alias': telephone,
        'amount': int(montant),
        'network': operateur,
        'description': description,
        'reference_id': reference,
    }
    try:
        response_invoice = requests.post(
            f'{PAYDUNYA_BASE_URL}/v2/disburse/get-invoice',
            json=payload,
            headers=get_headers(),
            timeout=30,
        )
        data = response_invoice.json()
        if data.get('response_code') != '00':
            return data
        disburse_token = data.get('disburse_invoice', {}).get('disburse_token')
        response_submit = requests.post(
            f'{PAYDUNYA_BASE_URL}/v2/disburse/submit-invoice',
            json={'disburse_token': disburse_token},
            headers=get_headers(),
            timeout=30,
        )
        return response_submit.json()
    except Exception as e:
        return {'response_code': 'error', 'message': str(e)}


def verifier_statut_payout(reference):
    try:
        response = requests.post(
            f'{PAYDUNYA_BASE_URL}/v2/disburse/check-status',
            json={'reference_id': reference},
            headers=get_headers(),
            timeout=30,
        )
        return response.json()
    except Exception as e:
        return {'response_code': 'error', 'message': str(e)}


def get_solde():
    try:
        response = requests.get(
            f'{PAYDUNYA_BASE_URL}/v2/disburse/check-balance',
            headers=get_headers(),
            timeout=30,
        )
        return response.json()
    except Exception as e:
        return {'success': False, 'message': str(e)}