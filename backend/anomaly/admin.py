from django.contrib import admin
from .models import AnomalyLog

@admin.register(AnomalyLog)
class AnomalyLogAdmin(admin.ModelAdmin):
    list_display = ('anomaly_type', 'agent', 'order', 'detected_at', 'resolved')
    list_filter = ('anomaly_type', 'resolved')
    date_hierarchy = 'detected_at'
