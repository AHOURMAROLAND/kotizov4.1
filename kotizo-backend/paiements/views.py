from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings
from core.logger import logger
from core.decorators import log_action
from core.utils import calculer_frais_kotizo, calculer_total_participant
from cotisations.models import Cotisation, Participation
from .models import Transaction, DemandeRemboursement
from .serializers import TransactionSerializer, DemandeRemboursementSerializer
from .utils import creer_invoice_payin, verifier_hash_webhook, confirmer_invoice


class InitierPaiementCotisationView(APIView):
    permission_classes = [IsAuthenticated]

    @log_action('initier_paiement_cotisation')
    def post(self, request, slug):
        cotisation = get_object_or_404(Cotisation, slug=slug, statut='active')
        participation = get_object_or_404(
            Participation,
            cotisation=cotisation,
            participant=request.user,
            statut='en_attente',
        )

        montant_total = calculer_total_participant(cotisation.montant_unitaire)
        frais = calculer_frais_kotizo(cotisation.montant_unitaire)

        transaction = Transaction.objects.create(
            user=request.user,
            type_transaction='payin',
            source='cotisation',
            source_id=str(cotisation.id),
            montant=montant_total,
            frais_kotizo=frais,
            statut='initie',
        )

        result = creer_invoice_payin(
            montant=montant_total,
            description=f'Cotisation : {cotisation.nom}',
            token_reference=str(transaction.id),
            return_url=f'kotizo://paiement-success?transaction={transaction.id}',
            cancel_url='kotizo://paiement-cancel',
            ipn_url='https://api.kotizo.app/api/paiements/webhook/payin/',
        )

        if result.get('response_code') != '00':
            transaction.statut = 'echoue'
            transaction.save(update_fields=['statut'])
            return Response(
                {'error': 'Erreur creation paiement PayDunya'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        invoice_token = result.get('token')
        payment_url = result.get('response_text')

        transaction.paydunya_token = invoice_token
        transaction.statut = 'en_attente'
        transaction.save(update_fields=['paydunya_token', 'statut'])

        participation.paydunya_token = invoice_token
        participation.save(update_fields=['paydunya_token'])

        logger.paiement('Invoice cree', user_id=str(request.user.id), montant=montant_total)

        return Response({
            'payment_url': payment_url,
            'invoice_token': invoice_token,
            'montant': montant_total,
            'frais_kotizo': frais,
        })


class VerifierPaiementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, invoice_token):
        result = confirmer_invoice(invoice_token)
        try:
            transaction = Transaction.objects.get(
                paydunya_token=invoice_token,
                user=request.user,
            )
        except Transaction.DoesNotExist:
            return Response({'error': 'Transaction introuvable'}, status=status.HTTP_404_NOT_FOUND)

        invoice_status = result.get('invoice', {}).get('status')
        if invoice_status == 'completed' and transaction.statut != 'complete':
            transaction.statut = 'complete'
            transaction.date_completion = timezone.now()
            transaction.save(update_fields=['statut', 'date_completion'])
            from .tasks import traiter_paiement_confirme
            traiter_paiement_confirme.delay(str(transaction.id))

        return Response({'statut': transaction.statut, 'paydunya_statut': invoice_status})


@method_decorator(csrf_exempt, name='dispatch')
class WebhookPayinView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        logger.webhook('Webhook PayIn recu', source='paydunya')

        hash_recu = request.headers.get('X-PAYDUNYA-SIGNATURE', '')
        hash_attendu = verifier_hash_webhook(settings.PAYDUNYA_MASTER_KEY)
        if hash_recu != hash_attendu:
            logger.fraude('Hash webhook invalide')
            return Response(status=403)

        # IMPORTANT : request.POST pas json.loads
        invoice_token = request.POST.get('data[invoice][token]', '')
        invoice_status = request.POST.get('data[invoice][status]', '')

        if not invoice_token:
            return Response(status=400)

        try:
            transaction = Transaction.objects.get(paydunya_token=invoice_token)
        except Transaction.DoesNotExist:
            return Response(status=404)

        transaction.webhook_recu = True
        transaction.webhook_data = dict(request.POST)

        if invoice_status == 'completed':
            transaction.statut = 'complete'
            transaction.date_completion = timezone.now()
            transaction.save()
            from .tasks import traiter_paiement_confirme
            traiter_paiement_confirme.delay(str(transaction.id))
        elif invoice_status in ['cancelled', 'failed']:
            transaction.statut = 'echoue'
            transaction.save()

        return Response({'status': 'ok'})


@method_decorator(csrf_exempt, name='dispatch')
class WebhookPayoutView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        logger.webhook('Webhook PayOut recu', source='paydunya')

        # IMPORTANT : request.POST pas json.loads
        reference = request.POST.get('reference_id', '')
        payout_status = request.POST.get('status', '')

        if not reference:
            return Response(status=400)

        try:
            transaction = Transaction.objects.get(id=reference, type_transaction='payout')
        except Transaction.DoesNotExist:
            return Response(status=404)

        if payout_status == 'SUCCESS':
            transaction.statut = 'complete'
            transaction.date_completion = timezone.now()
            transaction.save(update_fields=['statut', 'date_completion'])
        else:
            transaction.statut = 'echoue'
            transaction.save(update_fields=['statut'])

        return Response({'status': 'ok'})


class HistoriqueTransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)
        type_t = request.query_params.get('type')
        source = request.query_params.get('source')
        if type_t:
            transactions = transactions.filter(type_transaction=type_t)
        if source:
            transactions = transactions.filter(source=source)
        return Response(TransactionSerializer(transactions, many=True).data)


class DemandeRemboursementView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DemandeRemboursementSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        transaction = serializer.validated_data['transaction']
        if transaction.user != request.user:
            return Response({'error': 'Acces refuse'}, status=status.HTTP_403_FORBIDDEN)

        if DemandeRemboursement.objects.filter(transaction=transaction).exists():
            return Response(
                {'error': 'Une demande existe deja pour cette transaction'},
                status=status.HTTP_400_BAD_REQUEST
            )

        demande = serializer.save(user=request.user)
        logger.info('Demande remboursement creee', user_id=str(request.user.id))
        return Response(DemandeRemboursementSerializer(demande).data, status=status.HTTP_201_CREATED)