from django.db import models

class AnomalyLog(models.Model):
    TYPE_CHOICES = (
        ('speed_anomaly', 'Speed Anomaly'),
        ('agent_stuck', 'Agent Stuck'),
        ('route_deviation', 'Route Deviation'),
        ('unreachable', 'Unreachable'),
        ('high_fatigue', 'High Fatigue'),
    )
    agent = models.ForeignKey(
        'agents.DeliveryAgent',
        on_delete=models.CASCADE,
        related_name='anomalies'
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='anomalies'
    )
    anomaly_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    detected_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = 'anomaly'

    def __str__(self):
        return f"{self.anomaly_type} - Agent: {self.agent.user.username}"