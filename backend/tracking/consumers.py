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
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            return

        # Handle explicit re-fetch requests (e.g. after tab focus restore)
        if data.get("type") == "INIT_FETCH":
            snapshot = await self.get_initial_snapshot()
            await self.send(text_data=json.dumps({
                "type": "INITIAL_DATA",
                "payload": snapshot
            }))

    @database_sync_to_async
    def get_initial_snapshot(self):
        """
        Synchronous DB read returning full fleet state as a dict.
        Runs in a thread pool via database_sync_to_async.
        No Celery, no delays — plain ORM reads.
        """
        from agents.models import DeliveryAgent
        from orders.models import Order
        from anomaly.models import AnomalyLog

        agents = list(
            DeliveryAgent.objects.select_related('user')
            .values(
                'id', 'current_lat', 'current_lng', 'current_speed',
                'battery_level', 'total_km_today', 'orders_last_4hrs',
                'fatigue_score', 'status', 'user__username'
            )
        )
        # Normalize field names to match what the frontend expects
        normalized_agents = [
            {
                'id': a['id'],
                'lat': a['current_lat'],
                'lng': a['current_lng'],
                'speed': a['current_speed'] or 0,
                'battery_level': a['battery_level'] or 100,
                'km_today': a['total_km_today'] or 0,
                'orders_today': a['orders_last_4hrs'] or 0,
                'fatigue_score': a['fatigue_score'] or 0,
                'status': a['status'],
                'username': a['user__username'] or f"Agent_{a['id']}",
            }
            for a in agents
        ]

        orders = list(
            Order.objects.values(
                'id', 'status', 'pickup_lat', 'pickup_lng',
                'drop_lat', 'drop_lng', 'created_at'
            )
        )
        # Serialize datetimes
        for o in orders:
            if o.get('created_at'):
                o['created_at'] = o['created_at'].isoformat()

        anomalies = list(
            AnomalyLog.objects.filter(resolved=False)
            .values('id', 'agent_id', 'anomaly_type', 'detected_at', 'resolved')
        )
        for a in anomalies:
            if a.get('detected_at'):
                a['detected_at'] = a['detected_at'].isoformat()

        return {
            "agents": normalized_agents,
            "orders": orders,
            "anomalies": anomalies,
        }

    async def tracking_message(self, event):
        # Synchronized telemetry mapper
        raw_data = event.get("data", {})
        payload = {
            "type": "agent_location_update",
            "agent_id": raw_data.get("agent_id") or event.get("agent_id"),
            "agent_name": raw_data.get("agent_name") or event.get("agent_name", ""),
            "lat": raw_data.get("lat") or event.get("lat", 0),
            "lng": raw_data.get("lng") or event.get("lng", 0),
            "speed": raw_data.get("speed") or event.get("speed", 0),
            "battery": raw_data.get("battery") or event.get("battery", 0),
            "distance": raw_data.get("distance") or event.get("km_today") or 0,
            "orders_today": raw_data.get("orders_today") or event.get("orders_today", 0),
            "fatigue_score": raw_data.get("fatigue_score") or event.get("fatigue_score", 0),
            "status": raw_data.get("status") or event.get("status", "available"),
            "timestamp": raw_data.get("timestamp") or event.get("timestamp")
        }
        await self.send(text_data=json.dumps(payload))

    async def anomaly_alert(self, event):
        data = event.get("data", event)
        await self.send(text_data=json.dumps({
            "type": "anomaly_detected",
            "agent_id": data.get("agent_id"),
            "anomaly_type": data.get("anomaly_type"),
            "order_id": data.get("order_id"),
            "detected_at": data.get("detected_at"),
            "id": data.get("id"),
            "resolved": False
        }))