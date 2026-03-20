from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from core.logger import logger
from core.decorators import log_action
from core.utils import calculer_frais_kotizo, calculer_total_participant, detecter_operateur_togo
from paiements.utils import creer_invoice_payin, verifier_hash_webhook
from paiements.models import Transaction
from .models import QuickPay
from .serializers import QuickPayCreateSerializer, QuickPaySerializer
from .utils import generer_code_quickpay
from cotisations.utils import peut_creer_cotisation


class QuickPayListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        quickpays = QuickPay.objects.filter(createur=request.user)
        type_qp = request.query_params.get('type')
        if type_qp == 'actifs':
            quickpays = quickpays.filter(statut='actif')
        elif type_qp == 'payes':
            quickpays = quickpays.filter(statut='paye')
        return Response(QuickPaySerializer(quickpays, many=True).data)

    @log_action('creer_quickpay')
    def post(self, request):
        user = request.user

        if not user.email_verifie and not user.whatsapp_verifie:
            return Response(
                {'error': 'Verifiez votre compte avant de creer un Quick Pay'},
                status=status.HTTP_403_FORBIDDEN
            )

        peut, message = peut_creer_cotisation(user)
        if not peut:
            return Response({'error': message}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        serializer = QuickPayCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        operateur = detecter_operateur_togo(serializer.validated_data['numero_receveur'])

        quickpay = serializer.save(
            createur=user,
            code=generer_code_quickpay(),
            operateur_receveur=operateur,
            date_expiration=timezone.now() + timedelta(hours=1),
            montant_avec_frais=calculer_total_participant(serializer.validated_data['montant']),
            frais_kotizo=calculer_frais_kotizo(serializer.validated_data['montant']),
        )

        user.cotisations_creees_aujourd_hui += 1
        user.cotisations_creees_fenetre += 1
        user.save(update_fields=['cotisations_creees_aujourd_hui', 'cotisations_creees_fenetre'])

        logger.info('QuickPay cree', user_id=str(user.id))
        return Response(QuickPaySerializer(quickpay).data, status=status.HTTP_201_CREATED)


class QuickPayDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, code):
        quickpay = get_object_or_404(QuickPay, code=code)

        if quickpay.date_expiration <= timezone.now() and quickpay.statut == 'actif':
            quickpay.statut = 'expire'
            quickpay.save(update_fields=['statut'])

        if quickpay.statut == 'expire':
            return Response(
                {'error': 'Ce Quick Pay a expire', 'code': 'expire'},
                status=status.HTTP_410_GONE
            )
        if quickpay.statut == 'paye':
            return Response(
                {'error': 'Ce paiement a deja ete effectue', 'code': 'deja_paye'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(QuickPaySerializer(quickpay).data)


class InitierPaiementQuickPayView(APIView):
    permission_classes = [IsAuthenticated]

    @log_action('initier_paiement_quickpay')
    def post(self, request, code):
        quickpay = get_object_or_404(QuickPay, code=code, statut='actif')

        if quickpay.createur == request.user:
            return Response(
                {'error': 'Vous ne pouvez pas payer votre propre Quick Pay'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quickpay.date_expiration <= timezone.now():
            quickpay.statut = 'expire'
            quickpay.save(update_fields=['statut'])
            return Response({'error': 'Ce Quick Pay a expire'}, status=status.HTTP_410_GONE)

        montant_total = calculer_total_participant(quickpay.montant)
        frais = calculer_frais_kotizo(quickpay.montant)

        transaction = Transaction.objects.create(
            user=request.user,
            type_transaction='payin',
            source='quickpay',
            source_id=str(quickpay.id),
            montant=montant_total,
            frais_kotizo=frais,
            statut='initie',
        )

        result = creer_invoice_payin(
            montant=montant_total,
            description=f'Quick Pay {quickpay.code}',
            token_reference=str(transaction.id),
            return_url=f'kotizo://quickpay-success?transaction={transaction.id}',
            cancel_url='kotizo://paiement-cancel',
            ipn_url='https://api.kotizo.app/api/quickpay/webhook/',
        )

        if result.get('response_code') != '00':
            transaction.statut = 'echoue'
            transaction.save(update_fields=['statut'])
            return Response({'error': 'Erreur creation paiement'}, status=status.HTTP_502_BAD_GATEWAY)

        invoice_token = result.get('token')
        transaction.paydunya_token = invoice_token
        transaction.statut = 'en_attente'
        transaction.save(update_fields=['paydunya_token', 'statut'])

        quickpay.paydunya_token = invoice_token
        quickpay.save(update_fields=['paydunya_token'])

        return Response({
            'payment_url': result.get('response_text'),
            'invoice_token': invoice_token,
            'montant': montant_total,
            'frais_kotizo': frais,
        })


@method_decorator(csrf_exempt, name='dispatch')
class WebhookQuickPayView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        logger.webhook('Webhook QuickPay recu', source='paydunya')

        hash_recu = request.headers.get('X-PAYDUNYA-SIGNATURE', '')
        hash_attendu = verifier_hash_webhook(settings.PAYDUNYA_MASTER_KEY)
        if hash_recu != hash_attendu:
            logger.fraude('Hash webhook QuickPay invalide')
            return Response(status=403)

        # IMPORTANT : request.POST pas json.loads
        invoice_token = request.POST.get('data[invoice][token]', '')
        invoice_status = request.POST.get('data[invoice][status]', '')

        if not invoice_token:
            return Response(status=400)

        try:
            quickpay = QuickPay.objects.get(paydunya_token=invoice_token)
            transaction = Transaction.objects.get(paydunya_token=invoice_token)
        except (QuickPay.DoesNotExist, Transaction.DoesNotExist):
            return Response(status=404)

        if invoice_status == 'completed':
            transaction.statut = 'complete'
            transaction.date_completion = timezone.now()
            transaction.save(update_fields=['statut', 'date_completion'])

            quickpay.statut = 'paye'
            quickpay.date_paiement = timezone.now()
            quickpay.payeur = transaction.user
            quickpay.save(update_fields=['statut', 'date_paiement', 'payeur'])

            from .tasks import traiter_payout_quickpay
            traiter_payout_quickpay.delay(str(quickpay.id))
        else:
            transaction.statut = 'echoue'
            transaction.save(update_fields=['statut'])

        return Response({'status': 'ok'})


class QuickPayRecusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        quickpays = QuickPay.objects.filter(payeur=request.user, statut='paye')
        return Response(QuickPaySerializer(quickpays, many=True).data)