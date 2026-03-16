from django.contrib import admin
from .models import LocationUpdate

@admin.register(LocationUpdate)
class LocationUpdateAdmin(admin.ModelAdmin):
    list_display = ('agent', 'lat', 'lng', 'speed_kmph', 'timestamp')
    list_filter = ('agent',)
    date_hierarchy = 'timestamp'
