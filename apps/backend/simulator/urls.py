from django.urls import path
from .views import SimulateStartView, SimulateStopView

urlpatterns = [
    path('start/', SimulateStartView.as_view(), name='simulate_start'),
    path('stop/', SimulateStopView.as_view(), name='simulate_stop'),
]
