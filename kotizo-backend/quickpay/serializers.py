from rest_framework import serializers
from .models import QuickPay


class QuickPayCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuickPay
        fields = ['montant', 'description', 'numero_receveur']

    def validate_montant(self, value):
        if value < 200:
            raise serializers.ValidationError('Montant minimum 200 FCFA')
        if value > 250000:
            raise serializers.ValidationError('Montant maximum 250 000 FCFA')
        return value

    def validate_numero_receveur(self, value):
        from core.utils import normaliser_numero
        return normaliser_numero(value)


class QuickPaySerializer(serializers.ModelSerializer):
    createur_pseudo = serializers.SerializerMethodField()
    createur_nom = serializers.SerializerMethodField()
    secondes_restantes = serializers.SerializerMethodField()
    montant_avec_frais = serializers.SerializerMethodField()
    frais_kotizo = serializers.SerializerMethodField()

    class Meta:
        model = QuickPay
        fields = [
            'id', 'code', 'montant', 'montant_avec_frais',
            'frais_kotizo', 'description', 'statut',
            'date_creation', 'date_expiration', 'date_paiement',
            'createur_pseudo', 'createur_nom', 'secondes_restantes',
            'recu_pdf_url',
        ]

    def get_createur_pseudo(self, obj):
        return obj.createur.pseudo

    def get_createur_nom(self, obj):
        if obj.createur.nom_verifie:
            return f'{obj.createur.prenom} {obj.createur.nom}'
        return None

    def get_secondes_restantes(self, obj):
        from django.utils import timezone
        if obj.statut != 'actif':
            return 0
        delta = obj.date_expiration - timezone.now()
        return max(0, int(delta.total_seconds()))

    def get_montant_avec_frais(self, obj):
        from core.utils import calculer_total_participant
        return float(calculer_total_participant(obj.montant))

    def get_frais_kotizo(self, obj):
        from core.utils import calculer_frais_kotizo
        return float(calculer_frais_kotizo(obj.montant))