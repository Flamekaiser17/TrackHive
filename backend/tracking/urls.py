from django.urls import path
from .views import LocationUpdateView

urlpatterns = [
    path('update/', LocationUpdateView.as_view(), name='location_update'),
]
