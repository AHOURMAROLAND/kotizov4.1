from rest_framework import serializers
from .models import Transaction, DemandeRemboursement


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'type_transaction', 'source', 'source_id',
            'montant', 'frais_kotizo', 'frais_paydunya',
            'montant_net', 'statut', 'operateur',
            'date_creation', 'date_completion',
        ]


class DemandeRemboursementSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeRemboursement
        fields = [
            'id', 'transaction', 'raison', 'description',
            'preuves_urls', 'statut', 'date_demande',
        ]
        read_only_fields = ['statut', 'date_demande']