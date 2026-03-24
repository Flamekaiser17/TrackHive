import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

logger = logging.getLogger('trackhive.tracking')

class TrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            print(f"WS_REJECT: TrackingConsumer connection rejected - AnonymousUser")
            await self.close()
            return

        print(f"WS_CONNECT: TrackingConsumer joined by {self.user.email} (Role: {self.user.role})")
        
        if self.user.role == 'admin':
            await self.channel_layer.group_add("admins", self.channel_name)
            
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user.role == 'admin':
            await self.channel_layer.group_discard("admins", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data.get('type') == 'location_update' and self.user.role == 'agent':
            lat = data['lat']
            lng = data['lng']
            speed = data['speed']
            
            # Save to DB (triggers signals for GEO + Anomaly)
            update = await self.save_location(lat, lng, speed)
            
            # Find active order
            order_id = await self.get_active_order_id()
            
            # LOCATION_UPDATE Logging
            logger.info(
                "location_update", 
                extra={
                    "agent_id": str(self.user.id), 
                    "order_id": str(order_id) if order_id else None,
                    "lat": lat, 
                    "lng": lng, 
                    "speed_kmph": speed
                }
            )
            
            agent_profile = update.agent
            agent_user = getattr(agent_profile, 'user', None)
            
            # Broadcast update
            payload = {
                "type": "tracking_message",
                "data": {
                    "agent_id": agent_profile.id,
                    "agent_name": agent_user.username if agent_user else f"Agent_{agent_profile.id}",
                    "lat": lat,
                    "lng": lng,
                    "speed": speed,
                    "battery": agent_profile.battery_level,
                    "km_today": agent_profile.total_km_today,
                    "orders_today": agent_profile.orders_last_4hrs,
                    "fatigue_score": agent_profile.fatigue_score,
                    "status": agent_profile.status,
                    "order_id": order_id
                }
            }
            
            await self.channel_layer.group_send("admins", payload)
            
            if order_id:
                group_name = f"order_{order_id}"
                await self.channel_layer.group_add(group_name, self.channel_name) # Ensure joined
                await self.channel_layer.group_send(group_name, payload)

    @database_sync_to_async
    def save_location(self, lat, lng, speed):
        from agents.models import DeliveryAgent
        from tracking.models import LocationUpdate
        agent_profile = DeliveryAgent.objects.get(user=self.user)
        
        # PERSIST: Update agent profile for list views/refresh
        agent_profile.current_lat = lat
        agent_profile.current_lng = lng
        agent_profile.current_speed = speed
        agent_profile.save()
        
        return LocationUpdate.objects.create(
            agent=agent_profile,
            lat=lat,
            lng=lng,
            speed_kmph=speed
        )

    @database_sync_to_async
    def get_active_order_id(self):
        from agents.models import DeliveryAgent
        from orders.models import Order
        agent_profile = DeliveryAgent.objects.get(user=self.user)
        order = Order.objects.filter(agent=agent_profile, status__in=['assigned', 'picked_up', 'in_transit']).first()
        return order.id if order else None

    async def tracking_message(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def anomaly_alert(self, event):
        await self.send(text_data=json.dumps({
            "type": "anomaly",
            "data": event["data"]
        }))


class AdminConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            print(f"WS_REJECT: AdminConsumer connection rejected - AnonymousUser")
            await self.close()
            return

        if self.user.role != 'admin':
            print(f"WS_REJECT: AdminConsumer connection rejected - User {self.user.email} is NOT Admin (Role: {self.user.role})")
            await self.close()
            return

        print(f"WS_CONNECT: AdminConsumer authorized for {self.user.email}")
        await self.channel_layer.group_add("admins", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("admins", self.channel_name)

    async def receive(self, text_data):
        pass  # Admin only receives, doesn't send

    async def tracking_message(self, event):
        # Simply pass the payload forward after ensuring it's flat
        await self.send(text_data=json.dumps(event))
    
    async def agent_location_update(self, event):
        # Fallback for old tracking signals
        await self.send(text_data=json.dumps(event))

    async def anomaly_alert(self, event):
        await self.send(text_data=json.dumps({
            "type": "anomaly_detected",
            **event["data"]
        }))