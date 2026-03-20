from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'agent', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('customer__username', 'agent__user__username')
