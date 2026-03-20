from django.db import models


class RapportJournalier(models.Model):
    date = models.DateField(unique=True)
    nb_nouveaux_users = models.IntegerField(default=0)
    nb_transactions = models.IntegerField(default=0)
    volume_total = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    revenus_kotizo = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    nb_cotisations_creees = models.IntegerField(default=0)
    nb_quickpay = models.IntegerField(default=0)
    nb_alertes_fraude = models.IntegerField(default=0)
    nb_tickets_ouverts = models.IntegerField(default=0)
    nb_verifications_soumises = models.IntegerField(default=0)
    nb_promos_utilisees = models.IntegerField(default=0)
    date_generation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rapports_journaliers'
        ordering = ['-date']


class StateLog(models.Model):
    user_id = models.CharField(max_length=100, blank=True)
    etat = models.CharField(max_length=100)
    plateforme = models.CharField(max_length=10, blank=True)
    version_app = models.CharField(max_length=20, blank=True)
    data = models.JSONField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'state_logs'
        ordering = ['-date_creation']