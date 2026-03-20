from rest_framework import serializers
from django.utils import timezone
from .models import Cotisation, Participation, Signalement


class CotisationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cotisation
        fields = [
            'nom', 'description', 'montant_unitaire',
            'nombre_participants', 'numero_receveur',
            'date_expiration', 'est_recurrente', 'periodicite',
        ]

    def validate_montant_unitaire(self, value):
        if value < 200:
            raise serializers.ValidationError('Montant minimum 200 FCFA')
        if value > 250000:
            raise serializers.ValidationError('Montant maximum 250 000 FCFA')
        return value

    def validate_nombre_participants(self, value):
        if value < 2:
            raise serializers.ValidationError('Minimum 2 participants')
        return value

    def validate_date_expiration(self, value):
        maintenant = timezone.now()
        delta = value - maintenant
        if delta.days > 30:
            raise serializers.ValidationError('Duree maximum 30 jours')
        if value <= maintenant:
            raise serializers.ValidationError('La date doit etre dans le futur')
        return value

    def validate_numero_receveur(self, value):
        from core.utils import normaliser_numero
        return normaliser_numero(value)


class CotisationSerializer(serializers.ModelSerializer):
    createur_pseudo = serializers.SerializerMethodField()
    createur_nom = serializers.SerializerMethodField()
    createur_niveau = serializers.SerializerMethodField()
    est_complete = serializers.SerializerMethodField()
    montant_total = serializers.SerializerMethodField()
    montant_total_avec_frais = serializers.SerializerMethodField()
    frais_kotizo = serializers.SerializerMethodField()
    progression = serializers.SerializerMethodField()

    class Meta:
        model = Cotisation
        fields = [
            'id', 'nom', 'description', 'montant_unitaire',
            'nombre_participants', 'participants_payes',
            'montant_collecte', 'montant_total',
            'montant_total_avec_frais', 'frais_kotizo',
            'progression', 'statut', 'slug',
            'est_recurrente', 'periodicite',
            'date_expiration', 'date_creation',
            'createur_pseudo', 'createur_nom', 'createur_niveau',
            'est_complete', 'pdf_participants_url',
        ]

    def get_createur_pseudo(self, obj):
        return obj.createur.pseudo

    def get_createur_nom(self, obj):
        if obj.createur.nom_verifie:
            return f'{obj.createur.prenom} {obj.createur.nom}'
        return None

    def get_createur_niveau(self, obj):
        return obj.createur.niveau

    def get_est_complete(self, obj):
        return obj.is_complete()

    def get_montant_total(self, obj):
        return float(obj.get_montant_total())

    def get_montant_total_avec_frais(self, obj):
        return float(obj.get_montant_total_avec_frais())

    def get_frais_kotizo(self, obj):
        return float(obj.get_frais_kotizo())

    def get_progression(self, obj):
        return obj.get_progression()


class ParticipationSerializer(serializers.ModelSerializer):
    participant_pseudo = serializers.SerializerMethodField()
    participant_nom = serializers.SerializerMethodField()
    participant_telephone = serializers.SerializerMethodField()

    class Meta:
        model = Participation
        fields = [
            'id', 'participant_pseudo', 'participant_nom',
            'participant_telephone', 'statut', 'montant',
            'montant_avec_frais', 'frais_kotizo',
            'date_participation', 'date_paiement',
            'recu_confirme', 'recu_pdf_url',
        ]

    def get_participant_pseudo(self, obj):
        return obj.participant.pseudo

    def get_participant_nom(self, obj):
        if obj.participant.nom_verifie:
            return f'{obj.participant.prenom} {obj.participant.nom}'
        return None

    def get_participant_telephone(self, obj):
        return obj.participant.telephone


class SignalementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signalement
        fields = ['raison', 'description']