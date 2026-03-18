from rest_framework import serializers
from .models import AnomalyLog

class AnomalyLogSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.user.username', read_only=True)
    
    class Meta:
        model = AnomalyLog
        fields = [
            'id', 'agent', 'agent_name', 'order', 
            'anomaly_type', 'detected_at', 
            'resolved', 'resolved_at'
        ]
        read_only_fields = ['detected_at', 'resolved_at']
