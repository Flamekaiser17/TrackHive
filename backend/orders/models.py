from django.db import models
from django.conf import settings

class Order(models.Model):
    STATUS_CHOICES = (
        ('created', 'Created'),
        ('assigned', 'Assigned'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    agent = models.ForeignKey(
        'agents.DeliveryAgent',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_orders'
    )
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    drop_lat = models.FloatField()
    drop_lng = models.FloatField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='created'
    )
    eta_minutes = models.FloatField(null=True, blank=True)
    eta_confidence_range = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'orders'

    def __str__(self):
        return f"Order #{self.id} - {self.status}"