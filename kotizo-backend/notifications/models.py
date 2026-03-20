from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ('paiement_recu', 'Paiement recu'),
        ('cotisation_complete', 'Cotisation complete'),
        ('cotisation_expiree', 'Cotisation expiree'),
        ('quickpay_expire', 'Quick Pay expire'),
        ('verification_approuvee', 'Verification approuvee'),
        ('verification_rejetee', 'Verification rejetee'),
        ('sanction', 'Sanction'),
        ('remboursement', 'Remboursement'),
        ('rappel', 'Rappel'),
        ('ambassadeur', 'Ambassadeur'),
        ('whatsapp_panne', 'WhatsApp panne'),
        ('whatsapp_retabli', 'WhatsApp retabli'),
        ('promo_verification', 'Promo verification'),
        ('systeme', 'Systeme'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type_notification = models.CharField(max_length=30, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200)
    message = models.TextField()
    lue = models.BooleanField(default=False)
    data = models.JSONField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_lecture = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-date_creation']


class StatutWhatsApp(models.Model):
    actif = models.BooleanField(default=True)
    numero_actuel = models.CharField(max_length=20, blank=True)
    dernier_ping = models.DateTimeField(null=True, blank=True)
    nb_pings_echoues = models.IntegerField(default=0)
    date_derniere_panne = models.DateTimeField(null=True, blank=True)
    date_retablissement = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'statut_whatsapp'