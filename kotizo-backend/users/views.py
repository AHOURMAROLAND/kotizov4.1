from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.logger import logger
from core.decorators import log_action
from .serializers import (
    InscriptionSerializer, UserSerializer,
    UserProfilSerializer, VerificationIdentiteSerializer,
    DemandeBusinessSerializer,
)

User = get_user_model()


class InscriptionView(APIView):
    permission_classes = [AllowAny]

    @log_action('inscription')
    def post(self, request):
        serializer = InscriptionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        user.cgu_ip_acceptation = request.META.get('REMOTE_ADDR')
        user.save(update_fields=['cgu_ip_acceptation'])

        logger.auth('Nouvel utilisateur inscrit', user_id=str(user.id))

        from .tasks import envoyer_email_verification
        envoyer_email_verification.delay(str(user.id))

        wa_lien = f'https://wa.me/+228XXXXXXXX?text=KOTIZO-CONFIRM-{user.whatsapp_verify_token}'

        return Response({
            'message': 'Compte cree. Verifiez via email ou WhatsApp.',
            'email': user.email,
            'whatsapp_lien': wa_lien,
            'whatsapp_token': user.whatsapp_verify_token,
        }, status=status.HTTP_201_CREATED)


class VerifierEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            user = User.objects.get(
                token_verification_email=token,
                email_verifie=False
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Lien invalide ou deja utilise'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.token_email_expires and user.token_email_expires < timezone.now():
            return Response(
                {'error': 'Lien expire (5 minutes). Regenerez depuis l\'application.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.email_verifie = True
        user.token_verification_email = ''
        user.token_email_expires = None
        user.whatsapp_verify_token = ''
        user.whatsapp_token_expires = None
        user.save(update_fields=[
            'email_verifie', 'token_verification_email',
            'token_email_expires', 'whatsapp_verify_token',
            'whatsapp_token_expires'
        ])

        logger.auth('Email verifie', user_id=str(user.id))
        return Response({'message': 'Email verifie. Connectez-vous sur l\'application.'})


class VerifierWhatsAppView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token', '').strip()
        numero = request.data.get('numero', '').strip()

        if not token or not numero:
            return Response(
                {'error': 'Token et numero requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(whatsapp_numero=numero).exists():
            return Response(
                {'error': 'Ce numero WhatsApp est deja associe a un compte Kotizo. Connectez-vous sur l\'application.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(whatsapp_verify_token=token)
        except User.DoesNotExist:
            return Response(
                {'error': 'Code invalide ou expire'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.whatsapp_token_expires and user.whatsapp_token_expires < timezone.now():
            return Response(
                {'error': 'Code expire (5 minutes). Regenerez depuis l\'application.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.whatsapp_numero = numero
        user.whatsapp_verifie = True
        user.whatsapp_verify_token = ''
        user.whatsapp_token_expires = None
        user.token_verification_email = ''
        user.token_email_expires = None
        user.save(update_fields=[
            'whatsapp_numero', 'whatsapp_verifie',
            'whatsapp_verify_token', 'whatsapp_token_expires',
            'token_verification_email', 'token_email_expires'
        ])

        logger.auth('WhatsApp verifie', user_id=str(user.id))

        from core.whatsapp import envoyer_whatsapp
        envoyer_whatsapp(
            numero,
            f'*Kotizo* — Compte confirme !\n\n'
            f'Bonjour {user.prenom}, votre compte est maintenant actif.\n\n'
            f'Connectez-vous sur l\'application avec vos identifiants :\n'
            f'kotizo.app\n\nRepondez AIDE pour les commandes du bot.'
        )

        return Response({'message': 'WhatsApp confirme. Connectez-vous sur l\'application.'})


class ConnexionView(APIView):
    permission_classes = [AllowAny]

    @log_action('connexion')
    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')
        ip = request.META.get('REMOTE_ADDR')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Identifiants incorrects'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            logger.auth('Echec connexion', ip=ip)
            return Response(
                {'error': 'Identifiants incorrects'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.email_verifie and not user.whatsapp_verifie:
            return Response(
                {'error': 'Verifiez votre compte via email ou WhatsApp avant de vous connecter'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            return Response(
                {'error': 'Compte suspendu. Contactez le support.'},
                status=status.HTTP_403_FORBIDDEN
            )

        sanctions_actives = user.sanctions.filter(
            active=True, niveau__gte=4
        ).exists()
        if sanctions_actives:
            return Response(
                {'error': 'Acces refuse. Contactez le support.'},
                status=status.HTTP_403_FORBIDDEN
            )

        user.derniere_connexion_app = timezone.now()
        user.save(update_fields=['derniere_connexion_app'])

        refresh = RefreshToken.for_user(user)
        logger.auth('Connexion reussie', user_id=str(user.id))

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class DeconnexionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass
        return Response({'message': 'Deconnecte avec succes'})


class MoiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserProfilSerializer(
            request.user, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class MotDePasseOublieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        try:
            user = User.objects.get(email=email)
            from .tasks import envoyer_email_reset_password
            envoyer_email_reset_password.delay(str(user.id))
        except User.DoesNotExist:
            pass
        return Response({
            'message': 'Si cet email existe, un lien a ete envoye.'
        })


class ReinitialisationMotDePasseView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, token):
        try:
            user = User.objects.get(token_verification_email=token)
        except User.DoesNotExist:
            return Response(
                {'error': 'Lien invalide ou expire'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.token_email_expires and user.token_email_expires < timezone.now():
            return Response(
                {'error': 'Lien expire (5 minutes)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        password = request.data.get('password', '')
        password_confirm = request.data.get('password_confirm', '')

        if len(password) < 8:
            return Response(
                {'error': 'Mot de passe minimum 8 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if password != password_confirm:
            return Response(
                {'error': 'Les mots de passe ne correspondent pas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(password)
        user.token_verification_email = ''
        user.token_email_expires = None
        user.save(update_fields=['password', 'token_verification_email', 'token_email_expires'])

        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
        for token_obj in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token_obj)

        logger.auth('Mot de passe reinitialise', user_id=str(user.id))
        return Response({'message': 'Mot de passe reinitialise. Connectez-vous.'})


class FCMTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        fcm_token = request.data.get('fcm_token', '')
        device_id = request.data.get('device_id', '')
        request.user.fcm_token = fcm_token
        request.user.device_id = device_id
        request.user.save(update_fields=['fcm_token', 'device_id'])
        return Response({'message': 'Token FCM mis a jour'})


class StatsProfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.core.cache import cache
        from django.db import models as db_models
        cache_key = f'stats_profil_{request.user.id}'
        data = cache.get(cache_key)

        if not data:
            from cotisations.models import Cotisation, Participation
            from paiements.models import Transaction

            total_collecte = Transaction.objects.filter(
                user=request.user,
                type_transaction='payin',
                statut='complete',
            ).aggregate(total=db_models.Sum('montant'))['total'] or 0

            data = {
                'total_collecte': float(total_collecte),
                'nb_cotisations_creees': Cotisation.objects.filter(
                    createur=request.user
                ).count(),
                'nb_participations': Participation.objects.filter(
                    participant=request.user,
                    statut='paye',
                ).count(),
                'nb_parrainages': request.user.nb_parrainages_actifs,
                'peut_verifie_ambassadeur': request.user.peut_obtenir_verifie_ambassadeur(),
                'peut_business_ambassadeur': request.user.peut_obtenir_business_ambassadeur(),
                'cotisations_fenetre': request.user.cotisations_creees_fenetre,
                'cotisations_jour': request.user.cotisations_creees_aujourd_hui,
            }
            cache.set(cache_key, data, 3600)

        return Response(data)
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


@method_decorator(csrf_exempt, name='dispatch')
class WhatsAppWebhookView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        verify_token = request.query_params.get('hub.verify_token', '')
        challenge = request.query_params.get('hub.challenge', '')
        if verify_token == 'kotizo-webhook-verify-2026':
            from django.http import HttpResponse
            return HttpResponse(challenge)
        return Response(status=403)

    def post(self, request):
        try:
            data = request.data
            numero = data.get('from', '') or data.get('numero', '')
            message = data.get('message', '') or data.get('text', '')

            if not numero or not message:
                return Response(status=400)

            from .whatsapp_handler import traiter_message_entrant
            traiter_message_entrant(numero, message)

        except Exception as e:
            logger.error(f'Erreur webhook WhatsApp : {str(e)}')

        return Response({'status': 'ok'})