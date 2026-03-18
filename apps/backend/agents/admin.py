from django.contrib import admin
from .models import DeliveryAgent

@admin.register(DeliveryAgent)
class DeliveryAgentAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'fatigue_score', 'total_km_today')
    list_filter = ('status',)
    search_fields = ('user__username',)
