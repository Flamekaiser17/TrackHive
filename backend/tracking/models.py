from django.db import models

class LocationUpdate(models.Model):
    agent = models.ForeignKey(
        'agents.DeliveryAgent',
        on_delete=models.CASCADE,
        related_name='location_updates'
    )
    lat = models.FloatField()
    lng = models.FloatField()
    speed_kmph = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'tracking'
        indexes = [
            models.Index(fields=['agent', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.agent.user.username} at {self.timestamp}"