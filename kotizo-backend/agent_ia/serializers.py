from rest_framework import serializers
from .models import ConversationIA, MessageIA, TicketSupport


class MessageIASerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageIA
        fields = ['id', 'role', 'contenu', 'image_url', 'date_creation', 'est_reclamation']


class ConversationIASerializer(serializers.ModelSerializer):
    messages = MessageIASerializer(many=True, read_only=True)

    class Meta:
        model = ConversationIA
        fields = ['id', 'date_creation', 'date_derniere_activite', 'nb_messages', 'messages']


class TicketSupportSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketSupport
        fields = [
            'id', 'sujet', 'description', 'capture_ecran_url',
            'statut', 'priorite', 'date_creation',
        ]
        read_only_fields = ['statut', 'date_creation']