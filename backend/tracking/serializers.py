from rest_framework import serializers
from .models import LocationUpdate

class LocationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationUpdate
        fields = ('lat', 'lng', 'speed_kmph')

    def create(self, validated_data):
        user = self.context['request'].user
        if not hasattr(user, 'agent_profile'):
            raise serializers.ValidationError("Only agents can report locations.")
        
        return LocationUpdate.objects.create(
            agent=user.agent_profile,
            **validated_data
        )
