from django.db import models
from django.conf import settings

class DeliveryAgent(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('offline', 'Offline'),
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='agent_profile'
    )
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)
    current_speed = models.FloatField(default=0.0)
    battery_level = models.FloatField(default=100.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    fatigue_score = models.FloatField(default=0.0)
    total_km_today = models.FloatField(default=0.0)
    orders_last_4hrs = models.IntegerField(default=0)
    hours_active = models.FloatField(default=0.0)
    is_simulated = models.BooleanField(default=False)
    is_permanent = models.BooleanField(default=False)

    def calculate_fatigue(self):
        """
        Calculates agent fatigue score based on:
        - Recent order intensity (40% weight)
        - Distance covered (30% weight)
        - Active hours (30% weight)
        Score capped at 10.0 for safety baseline.
        """
        score = (self.orders_last_4hrs * 0.4) + (self.total_km_today * 0.3) + (self.hours_active * 0.3)
        self.fatigue_score = min(score, 10.0)
        self.save()
        return self.fatigue_score

    class Meta:
        app_label = 'agents'

    def __str__(self):
        return f"Agent: {self.user.username} - {self.status}"