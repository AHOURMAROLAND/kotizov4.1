from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.permissions import IsAdminKotizo
from core.logger import logger
from users.models import (
    VerificationIdentite, Sanction, AlerteFraude,
    DemandeBusinessLevel, PromoVerification
)
from paiements.models import Transaction, DemandeRemboursement
from agent_ia.models import TicketSupport
from .models import RapportJournalier, StateLog
from .serializers import (
    UserAdminSerializer, VerificationAdminSerializer,
    SanctionAdminSerializer, AlerteFraudeAdminSerializer,
    TransactionAdminSerializer, DemandeRemboursementAdminSerializer,
    TicketAdminSerializer, StateLogSerializer,
)

User = get_user_model()


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def get(self, request):
        from django.db import models as db_models
        from cotisations.models import Cotisation
        from quickpay.models import QuickPay

        aujourd_hui = timezone.now().date()

        stats = {
            'nouveaux_users_aujourd_hui': User.objects.filter(
                date_inscription__date=aujourd_hui
            ).count(),
            'users_actifs_total': User.objects.filter(is_active=True).count(),
            'transactions_aujourd_hui': Transaction.objects.filter(
                date_creation__date=aujourd_hui,
                statut='complete'
            ).count(),
            'revenus_kotizo_aujourd_hui': float(
                Transaction.objects.filter(
                    date_creation__date=aujourd_hui,
                    statut='complete',
                    type_transaction='payin',
                ).aggregate(total=db_models.Sum('frais_kotizo'))['total'] or 0
            ),
            'cotisations_actives': Cotisation.objects.filter(statut='active').count(),
            'quickpay_actifs': QuickPay.objects.filter(statut='actif').count(),
            'verifications_en_attente': VerificationIdentite.objects.filter(
                statut='en_attente'
            ).count(),
            'remboursements_en_attente': DemandeRemboursement.objects.filter(
                statut='en_attente'
            ).count(),
            'alertes_fraude_nouvelles': AlerteFraude.objects.filter(
                statut='nouvelle'
            ).count(),
            'tickets_ouverts': TicketSupport.objects.filter(statut='ouvert').count(),
        }
        return Response(stats)


class UsersAdminListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def get(self, request):
        users = User.objects.filter(is_staff=False).order_by('-date_inscription')

        niveau = request.query_params.get('niveau')
        search = request.query_params.get('search')
        actif = request.query_params.get('actif')

        if niveau:
            users = users.filter(niveau=niveau)
        if actif:
            users = users.filter(is_active=actif == 'true')
        if search:
            users = users.filter(
                pseudo__icontains=search
            ) | users.filter(
                email__icontains=search
            ) | users.filter(
                nom__icontains=search
            )

        return Response(UserAdminSerializer(users[:100], many=True).data)


class UserAdminDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def get(self, request, user_id):
        from django.shortcuts import get_object_or_404
        user = get_object_or_404(User, id=user_id)
        data = UserAdminSerializer(user).data

        data['sanctions'] = SanctionAdminSerializer(
            user.sanctions.all(), many=True
        ).data
        data['alertes'] = AlerteFraudeAdminSerializer(
            user.alertes_fraude.all(), many=True
        ).data
        data['transactions'] = TransactionAdminSerializer(
            user.transactions.all()[:20], many=True
        ).data

        return Response(data)

    def patch(self, request, user_id):
        from django.shortcuts import get_object_or_404
        user = get_object_or_404(User, id=user_id)

        niveau = request.data.get('niveau')
        is_active = request.data.get('is_active')

        if niveau and niveau in ['basique', 'verifie', 'business']:
            user.niveau = niveau
            user.save(update_fields=['niveau'])

        if is_active is not None:
            user.is_active = is_active
            user.save(update_fields=['is_active'])

        logger.info(
            f'User {user.pseudo} modifie par admin',
            user_id=str(user.id)
        )
        return Response(UserAdminSerializer(user).data)


class VerificationsAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def get(self, request):
        verifs = VerificationIdentite.objects.select_related('user').order_by('-date_soumission')
        statut = request.query_params.get('statut', 'en_attente')
        if statut:
            verifs = verifs.filter(statut=statut)
        return Response(VerificationAdminSerializer(verifs, many=True).data)


class ApprouverVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def post(self, request, verif_id):
        from django.shortcuts import get_object_or_404
        verif = get_object_or_404(VerificationIdentite, id=verif_id, statut='en_attente')

        prix = request.data.get('prix', 1000)
        raison_prix_reduit = request.data.get('raison_prix_reduit', '')

        if prix not in [500, 1000]:
            return Response({'error': 'Prix invalide (500 ou 1000 FCFA)'}, status=400)

        verif.statut = 'approuve'
        verif.prix_applique = prix
        verif.raison_prix_reduit = raison_prix_reduit
        verif.note_admin = request.data.get('note_admin', '')
        verif.date_traitement = timezone.now()
        verif.user.prix_verification = prix
        verif.user.nom_verifie = True
        verif.user.save(update_fields=['prix_verification', 'nom_verifie'])
        verif.save()

        from notifications.utils import creer_notification
        creer_notification(
            user=verif.user,
            type_notification='verification_approuvee',
            titre='Identite verifiee !',
            message=f'Votre identite a ete verifiee. Payez {prix} FCFA pour activer le niveau Verifie.',
        )

        logger.info(f'Verification approuvee pour {verif.user.pseudo} a {prix} FCFA')
        return Response({'message': f'Verification approuvee a {prix} FCFA'})


class RejeterVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def post(self, request, verif_id):
        from django.shortcuts import get_object_or_404
        verif = get_object_or_404(VerificationIdentite, id=verif_id, statut='en_attente')

        raison = request.data.get('raison', '')
        if not raison:
            return Response({'error': 'Raison obligatoire'}, status=400)

        verif.statut = 'rejete'
        verif.note_admin = raison
        verif.date_traitement = timezone.now()
        verif.save()

        from notifications.utils import creer_notification
        creer_notification(
            user=verif.user,
            type_notification='verification_rejetee',
            titre='Verification rejetee',
            message=f'Raison : {raison}. Vous pouvez resoumettre dans 30 jours.',
        )

        return Response({'message': 'Verification rejetee'})


class SanctionsAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def post(self, request):
        user_id = request.data.get('user_id')
        niveau = request.data.get('niveau')
        raison = request.data.get('raison', '')

        if not all([user_id, niveau is not None, raison]):
            return Response({'error': 'user_id, niveau et raison obligatoires'}, status=400)

        from django.shortcuts import get_object_or_404
        from datetime import timedelta

        user = get_object_or_404(User, id=user_id)
        durees = {0: None, 1: 3, 2: 7, 3: 30, 4: 15, 5: None}
        date_fin = None
        if durees.get(niveau):
            date_fin = timezone.now() + timedelta(days=durees[niveau])

        sanction = Sanction.objects.create(
            user=user,
            niveau=niveau,
            raison=raison,
            appliquee_par=request.user,
            date_fin=date_fin,
        )

        if niveau == 3:
            user.niveau = 'basique'
            user.save(update_fields=['niveau'])
        elif niveau >= 4:
            user.is_active = False
            user.save(update_fields=['is_active'])

        from notifications.utils import creer_notification
        creer_notification(
            user=user,
            type_notification='sanction',
            titre=f'Sanction appliquee',
            message=f'Raison : {raison}',
        )

        return Response({'message': 'Sanction appliquee', 'id': sanction.id})


class RemboursementsAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def get(self, request):
        demandes = DemandeRemboursement.objects.filter(
            statut='en_attente'
        ).select_related('user', 'transaction')
        return Response(DemandeRemboursementAdminSerializer(demandes, many=True).data)


class ValiderRemboursementView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def post(self, request, demande_id):
        from django.shortcuts import get_object_or_404
        demande = get_object_or_404(DemandeRemboursement, id=demande_id, statut='en_attente')

        action = request.data.get('action')
        if action not in ['valider', 'rejeter']:
            return Response({'error': 'Action invalide (valider ou rejeter)'}, status=400)

        if action == 'valider':
            from paiements.utils import initier_payout
            from core.utils import detecter_operateur_togo

            telephone = demande.user.telephone
            operateur = detecter_operateur_togo(telephone)

            result = initier_payout(
                montant=float(demande.transaction.montant),
                telephone=telephone,
                operateur=operateur,
                description=f'Remboursement Kotizo #{demande.id}',
                reference=str(demande.id),
            )

            if result.get('response_code') == '00':
                demande.statut = 'rembourse'
                demande.date_traitement = timezone.now()
                demande.save()
                demande.transaction.statut = 'rembourse'
                demande.transaction.save(update_fields=['statut'])
                logger.paiement(f'Remboursement valide #{demande.id}')
                return Response({'message': 'Remboursement initie avec succes'})
            else:
                return Response({'error': 'Erreur PayDunya', 'detail': result}, status=502)

        else:
            note = request.data.get('note', '')
            if request.data.get('signaler_arnaque'):
                AlerteFraude.objects.create(
                    user=demande.user,
                    type_alerte='fraude_paydunya',
                    description=f'Tentative arnaque remboursement #{demande.id}',
                )
            demande.statut = 'rejete'
            demande.note_admin = note
            demande.date_traitement = timezone.now()
            demande.save()
            return Response({'message': 'Remboursement rejete'})


class TicketsAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def get(self, request):
        tickets = TicketSupport.objects.select_related('user').order_by('-date_creation')
        statut = request.query_params.get('statut')
        if statut:
            tickets = tickets.filter(statut=statut)
        return Response(TicketAdminSerializer(tickets[:50], many=True).data)

    def patch(self, request, ticket_id):
        from django.shortcuts import get_object_or_404
        ticket = get_object_or_404(TicketSupport, id=ticket_id)
        nouveau_statut = request.data.get('statut')
        note = request.data.get('note_admin', '')

        if nouveau_statut:
            ticket.statut = nouveau_statut
        if note:
            ticket.note_admin = note
        if nouveau_statut == 'resolu':
            ticket.date_resolution = timezone.now()

        ticket.save()
        return Response(TicketAdminSerializer(ticket).data)


class PromoVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminKotizo]

    def post(self, request):
        from datetime import timedelta
        duree_jours = request.data.get('duree_jours', 7)

        PromoVerification.objects.filter(active=True).update(active=False)

        promo = PromoVerification.objects.create(
            prix=500,
            active=True,
            date_fin=timezone.now() + timedelta(days=duree_jours),
            creee_par=request.user,
        )

        from notifications.tasks import notifier_promo_verification
        notifier_promo_verification.delay()

        return Response({
            'message': f'Promo 500 FCFA activee pour {duree_jours} jours',
            'date_fin': promo.date_fin,
        })

    def delete(self, request):
        PromoVerification.objects.filter(active=True).update(active=False)
        return Response({'message': 'Promo desactivee'})


class StateLogs(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        etat = request.data.get('etat', '')
        if not etat:
            return Response({'error': 'Etat requis'}, status=400)

        StateLog.objects.create(
            user_id=str(request.user.id) if request.user.is_authenticated else '',
            etat=etat,
            plateforme=request.data.get('plateforme', ''),
            version_app=request.data.get('version_app', ''),
            data=request.data.get('data'),
        )
        return Response({'ok': True})