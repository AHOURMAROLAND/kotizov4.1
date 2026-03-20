from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from core.logger import logger
from core.decorators import log_action
from core.utils import detecter_operateur_togo, calculer_frais_kotizo, calculer_total_participant
from .models import Cotisation, Participation, Signalement
from .serializers import (
    CotisationCreateSerializer, CotisationSerializer,
    ParticipationSerializer, SignalementSerializer,
)
from .utils import (
    generer_slug, get_cache_cotisations,
    set_cache_cotisations, invalider_cache_cotisations,
    peut_creer_cotisation,
)


class CotisationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cached = get_cache_cotisations(str(request.user.id))
        if cached:
            return Response(cached)

        cotisations = Cotisation.objects.filter(
            createur=request.user
        ).select_related('createur')

        serializer = CotisationSerializer(cotisations, many=True)
        set_cache_cotisations(str(request.user.id), serializer.data)
        return Response(serializer.data)

    @log_action('creer_cotisation')
    def post(self, request):
        user = request.user

        if not user.email_verifie and not user.whatsapp_verifie:
            return Response(
                {'error': 'Verifiez votre compte avant de creer une cotisation'},
                status=status.HTTP_403_FORBIDDEN
            )

        peut, message = peut_creer_cotisation(user)
        if not peut:
            return Response(
                {'error': message},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        serializer = CotisationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        operateur = detecter_operateur_togo(
            serializer.validated_data['numero_receveur']
        )

        cotisation = serializer.save(
            createur=user,
            slug=generer_slug(),
            operateur_receveur=operateur,
        )

        user.cotisations_creees_aujourd_hui += 1
        user.cotisations_creees_fenetre += 1
        user.save(update_fields=[
            'cotisations_creees_aujourd_hui',
            'cotisations_creees_fenetre'
        ])

        invalider_cache_cotisations(str(user.id))

        logger.cotisation(
            'Cotisation creee',
            user_id=str(user.id),
            cotisation_id=str(cotisation.id)
        )

        return Response(
            CotisationSerializer(cotisation).data,
            status=status.HTTP_201_CREATED
        )


class CotisationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        cotisation = get_object_or_404(Cotisation, slug=slug)
        serializer = CotisationSerializer(cotisation)
        data = dict(serializer.data)

        participation = Participation.objects.filter(
            cotisation=cotisation,
            participant=request.user
        ).first()

        data['ma_participation'] = (
            ParticipationSerializer(participation).data
            if participation else None
        )
        data['est_createur'] = cotisation.createur == request.user
        return Response(data)

    def delete(self, request, slug):
        cotisation = get_object_or_404(
            Cotisation, slug=slug, createur=request.user
        )

        if cotisation.participants_payes > 0:
            return Response(
                {'error': 'Impossible de supprimer une cotisation avec des paiements'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cotisation.statut = 'annulee'
        cotisation.save(update_fields=['statut'])
        invalider_cache_cotisations(str(request.user.id))

        logger.cotisation(
            'Cotisation annulee',
            user_id=str(request.user.id),
            cotisation_id=str(cotisation.id)
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class CotisationPubliqueView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        cotisation = get_object_or_404(Cotisation, slug=slug)

        if cotisation.statut == 'annulee':
            return Response(
                {'error': 'Ce lien a expire', 'code': 'lien_expire'},
                status=status.HTTP_410_GONE
            )
        if cotisation.statut == 'expiree':
            return Response(
                {'error': 'Cette cotisation a expire', 'code': 'cotisation_expiree'},
                status=status.HTTP_410_GONE
            )

        data = dict(CotisationSerializer(cotisation).data)

        if request.user.is_authenticated:
            participation = Participation.objects.filter(
                cotisation=cotisation,
                participant=request.user
            ).first()
            data['ma_participation'] = (
                ParticipationSerializer(participation).data
                if participation else None
            )
            data['est_createur'] = cotisation.createur == request.user

        return Response(data)


class RejoindreView(APIView):
    permission_classes = [IsAuthenticated]

    @log_action('rejoindre_cotisation')
    def post(self, request, slug):
        cotisation = get_object_or_404(Cotisation, slug=slug, statut='active')

        if cotisation.is_complete():
            return Response(
                {'error': 'Cotisation complete'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Participation.objects.filter(
            cotisation=cotisation, participant=request.user
        ).exists():
            return Response(
                {'error': 'Vous participez deja a cette cotisation'},
                status=status.HTTP_400_BAD_REQUEST
            )

        frais = calculer_frais_kotizo(cotisation.montant_unitaire)
        montant_avec_frais = calculer_total_participant(cotisation.montant_unitaire)

        participation = Participation.objects.create(
            cotisation=cotisation,
            participant=request.user,
            montant=cotisation.montant_unitaire,
            montant_avec_frais=montant_avec_frais,
            frais_kotizo=frais,
        )

        logger.cotisation(
            'Participation creee',
            user_id=str(request.user.id),
            cotisation_id=str(cotisation.id)
        )

        return Response(
            ParticipationSerializer(participation).data,
            status=status.HTTP_201_CREATED
        )


class ConfirmerRecuView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, participation_id):
        participation = get_object_or_404(
            Participation,
            id=participation_id,
            cotisation__createur=request.user,
            statut='paye',
        )
        participation.recu_confirme = True
        participation.date_confirmation_recu = timezone.now()
        participation.save(update_fields=['recu_confirme', 'date_confirmation_recu'])

        from core.whatsapp import envoyer_whatsapp
        if participation.participant.whatsapp_numero:
            envoyer_whatsapp(
                participation.participant.whatsapp_numero,
                f'*Kotizo* — Recu confirme\n\n'
                f'{participation.cotisation.createur.pseudo} a confirme la reception de votre paiement '
                f'de {participation.montant} FCFA pour "{participation.cotisation.nom}".'
            )

        return Response({'message': 'Recu confirme'})


class ParticipantsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        cotisation = get_object_or_404(Cotisation, slug=slug)
        if cotisation.createur != request.user:
            return Response(
                {'error': 'Acces refuse'},
                status=status.HTTP_403_FORBIDDEN
            )
        participants = cotisation.participations.all().select_related('participant')
        return Response(ParticipationSerializer(participants, many=True).data)


class RappelerNonPayeursView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        cotisation = get_object_or_404(
            Cotisation, slug=slug, createur=request.user, statut='active'
        )
        from .tasks import envoyer_rappel_non_payeurs
        envoyer_rappel_non_payeurs.delay(str(cotisation.id))

        non_payes = cotisation.participations.filter(statut='en_attente').count()
        return Response({
            'message': f'Rappel envoye a {non_payes} participant(s)',
            'nb_rappeles': non_payes,
        })


class SignalerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        cotisation = get_object_or_404(Cotisation, slug=slug)

        if cotisation.createur == request.user:
            return Response(
                {'error': 'Vous ne pouvez pas signaler votre propre cotisation'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Signalement.objects.filter(
            cotisation=cotisation, signaleur=request.user
        ).exists():
            return Response(
                {'error': 'Vous avez deja signale cette cotisation'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SignalementSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(cotisation=cotisation, signaleur=request.user)
        logger.fraude(
            f'Signalement cotisation {slug}',
            user_id=str(request.user.id)
        )

        nb_signalements = cotisation.signalements.count()
        if nb_signalements >= 3:
            cotisation.statut = 'suspendue'
            cotisation.save(update_fields=['statut'])
            logger.fraude(f'Cotisation {slug} suspendue apres 3 signalements')

        return Response(
            {'message': 'Signalement enregistre'},
            status=status.HTTP_201_CREATED
        )


class MesParticipationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        participations = Participation.objects.filter(
            participant=request.user
        ).select_related('cotisation', 'cotisation__createur')
        return Response(ParticipationSerializer(participations, many=True).data)