from rest_framework import serializers
from users.models import User, VerificationIdentite, DemandeBusinessLevel, Sanction, AlerteFraude
from paiements.models import Transaction, DemandeRemboursement
from agent_ia.models import TicketSupport
from .models import RapportJournalier, StateLog


class UserAdminSerializer(serializers.ModelSerializer):
    nb_sanctions = serializers.SerializerMethodField()
    nb_alertes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'nom', 'prenom', 'pseudo',
            'niveau', 'pays', 'telephone', 'photo',
            'email_verifie', 'whatsapp_verifie', 'nom_verifie',
            'is_active', 'date_inscription', 'derniere_connexion_app',
            'nb_parrainages_actifs', 'cotisations_creees_fenetre',
            'prix_verification', 'ville_approx',
            'nb_sanctions', 'nb_alertes',
        ]

    def get_nb_sanctions(self, obj):
        return obj.sanctions.filter(active=True).count()

    def get_nb_alertes(self, obj):
        return obj.alertes_fraude.filter(statut='nouvelle').count()


class VerificationAdminSerializer(serializers.ModelSerializer):
    user_pseudo = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = VerificationIdentite
        fields = [
            'id', 'user', 'user_pseudo', 'user_email',
            'type_document', 'photo_recto', 'photo_verso',
            'liveness_valide', 'statut', 'note_admin',
            'prix_applique', 'raison_prix_reduit',
            'date_soumission', 'date_traitement', 'paiement_effectue',
        ]

    def get_user_pseudo(self, obj):
        return obj.user.pseudo

    def get_user_email(self, obj):
        return obj.user.email


class SanctionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sanction
        fields = [
            'id', 'user', 'niveau', 'raison',
            'date_debut', 'date_fin', 'active', 'contestee',
        ]


class AlerteFraudeAdminSerializer(serializers.ModelSerializer):
    user_pseudo = serializers.SerializerMethodField()

    class Meta:
        model = AlerteFraude
        fields = [
            'id', 'user', 'user_pseudo', 'type_alerte',
            'description', 'statut', 'data', 'date_creation',
        ]

    def get_user_pseudo(self, obj):
        return obj.user.pseudo


class TransactionAdminSerializer(serializers.ModelSerializer):
    user_pseudo = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'user_pseudo', 'type_transaction',
            'source', 'montant', 'frais_kotizo', 'frais_paydunya',
            'montant_net', 'statut', 'operateur',
            'date_creation', 'date_completion',
        ]

    def get_user_pseudo(self, obj):
        return obj.user.pseudo


class DemandeRemboursementAdminSerializer(serializers.ModelSerializer):
    user_pseudo = serializers.SerializerMethodField()

    class Meta:
        model = DemandeRemboursement
        fields = [
            'id', 'user', 'user_pseudo', 'transaction',
            'raison', 'description', 'preuves_urls',
            'statut', 'note_admin', 'date_demande',
        ]

    def get_user_pseudo(self, obj):
        return obj.user.pseudo


class TicketAdminSerializer(serializers.ModelSerializer):
    user_pseudo = serializers.SerializerMethodField()

    class Meta:
        model = TicketSupport
        fields = [
            'id', 'user', 'user_pseudo', 'sujet',
            'description', 'capture_ecran_url',
            'statut', 'priorite', 'cree_par_ia',
            'note_admin', 'date_creation', 'date_resolution',
        ]

    def get_user_pseudo(self, obj):
        return obj.user.pseudo


class StateLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = StateLog
        fields = ['id', 'user_id', 'etat', 'plateforme', 'version_app', 'data', 'date_creation']