from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import VerificationIdentite, DemandeBusinessLevel

User = get_user_model()


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    politique_confidentialite = serializers.BooleanField(write_only=True)
    age_confirme = serializers.BooleanField(write_only=True)
    consentement_position = serializers.BooleanField(write_only=True, required=False)
    code_parrainage_parrain = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = User
        fields = [
            'email', 'nom', 'prenom', 'pseudo', 'telephone', 'pays',
            'password', 'password_confirm',
            'cgu_acceptees', 'politique_confidentialite',
            'age_confirme', 'consentement_position',
            'code_parrainage_parrain',
        ]

    def validate_pseudo(self, value):
        if len(value) > 20:
            raise serializers.ValidationError('Pseudo maximum 20 caracteres')
        if ' ' in value:
            raise serializers.ValidationError('Pseudo sans espaces')
        return value.lower()

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError(
                {'password': 'Les mots de passe ne correspondent pas'}
            )
        if not data.get('cgu_acceptees'):
            raise serializers.ValidationError(
                {'cgu_acceptees': 'Vous devez accepter les CGU'}
            )
        if not data.get('politique_confidentialite'):
            raise serializers.ValidationError(
                {'politique_confidentialite': 'Vous devez accepter la politique de confidentialite'}
            )
        if not data.get('age_confirme'):
            raise serializers.ValidationError(
                {'age_confirme': 'Vous devez confirmer avoir 18 ans ou plus'}
            )
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data.pop('politique_confidentialite')
        validated_data.pop('age_confirme')
        code_parrain = validated_data.pop('code_parrainage_parrain', None)
        consentement = validated_data.pop('consentement_position', False)
        password = validated_data.pop('password')

        from django.utils import timezone
        import secrets
        from core.utils import generer_code

        user = User(**validated_data)
        user.set_password(password)
        user.cgu_version = '1.0'
        user.cgu_date_acceptation = timezone.now()
        user.consentement_position = consentement
        user.token_verification_email = secrets.token_urlsafe(16)
        from django.utils import timezone as tz
        user.token_email_expires = tz.now() + __import__('datetime').timedelta(minutes=5)
        user.whatsapp_verify_token = generer_code(8)
        user.whatsapp_token_expires = tz.now() + __import__('datetime').timedelta(minutes=5)
        user.code_parrainage = generer_code(8)
        user.save()

        if code_parrain:
            try:
                parrain = User.objects.get(code_parrainage=code_parrain)
                user.parrain = parrain
                user.save(update_fields=['parrain'])
            except User.DoesNotExist:
                pass

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'nom', 'prenom', 'pseudo',
            'telephone', 'pays', 'niveau', 'photo',
            'email_verifie', 'whatsapp_verifie',
            'nom_verifie', 'code_parrainage',
            'nb_parrainages_actifs', 'date_inscription',
            'cotisations_creees_aujourd_hui',
            'cotisations_creees_fenetre',
        ]
        read_only_fields = [
            'id', 'niveau', 'email_verifie', 'whatsapp_verifie',
            'nom_verifie', 'code_parrainage',
            'nb_parrainages_actifs', 'date_inscription',
        ]


class UserProfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['prenom', 'nom', 'pseudo', 'telephone', 'photo']

    def validate_nom(self, value):
        user = self.instance
        if user and user.nom_verifie:
            raise serializers.ValidationError(
                'Nom verrouille apres verification identite'
            )
        return value

    def validate_prenom(self, value):
        user = self.instance
        if user and user.nom_verifie:
            raise serializers.ValidationError(
                'Prenom verrouille apres verification identite'
            )
        return value


class VerificationIdentiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationIdentite
        fields = [
            'type_document', 'photo_recto', 'photo_verso',
            'liveness_valide', 'statut', 'prix_applique',
            'date_soumission',
        ]
        read_only_fields = ['statut', 'prix_applique', 'date_soumission']


class DemandeBusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeBusinessLevel
        fields = [
            'nom_entreprise', 'type_activite',
            'volume_mensuel_estime', 'raison_demande',
            'statut', 'date_approbation',
            'date_expiration_gratuite', 'paiement_effectue',
            'date_demande',
        ]
        read_only_fields = [
            'statut', 'date_approbation',
            'date_expiration_gratuite', 'paiement_effectue',
            'date_demande',
        ]