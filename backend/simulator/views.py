import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from agents.models import DeliveryAgent
from orders.models import Order
from core.redis_client import redis_client
from celery import current_app as celery_app
from .tasks import simulate_agent_movement

User = get_user_model()

class SimulateStartView(APIView):
    throttle_scope = 'simulator'
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        agent_count = request.data.get('agent_count', 50)
        order_count = request.data.get('order_count', 200)

        for i in range(agent_count):
            username = f'sim_agent_{i}_{random.randint(1000, 9999)}'
            user = User.objects.create(username=username, role='agent')
            agent = DeliveryAgent.objects.create(
                user=user,
                status='available',
                current_lat=12.97 + random.uniform(-0.05, 0.05),
                current_lng=77.59 + random.uniform(-0.05, 0.05),
                is_simulated=True
            )
            task = simulate_agent_movement.delay(agent.id)
            redis_client.sadd("simulation:active_tasks", task.id)

        for j in range(order_count):
            customer_name = f'sim_customer_{j}_{random.randint(100, 999)}'
            customer, _ = User.objects.get_or_create(
                username=customer_name,
                defaults={'role': 'customer'}
            )
            Order.objects.create(
                customer=customer,
                pickup_lat=12.97 + random.uniform(-0.1, 0.1),
                pickup_lng=77.59 + random.uniform(-0.1, 0.1),
                drop_lat=12.97 + random.uniform(-0.1, 0.1),
                drop_lng=77.59 + random.uniform(-0.1, 0.1),
                status='created'
            )

        return Response({
            "status": "success",
            "message": f"Simulator started with {agent_count} agents."
        })


class SimulateStopView(APIView):
    throttle_scope = 'simulator'
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # 1. Revoke Celery tasks
            task_ids = redis_client.smembers("simulation:active_tasks")
            for tid in task_ids:
                try:
                    celery_app.control.revoke(
                        tid.decode('utf-8'), terminate=True
                    )
                except Exception:
                    pass

            # 2. Get simulated agents
            simulated_agents = DeliveryAgent.objects.filter(
                is_simulated=True
            ).select_related('user')

            # 3. Remove from Redis GEO
            agent_ids = [str(a.id) for a in simulated_agents]
            if agent_ids:
                try:
                    redis_client.zrem("agents_locations", *agent_ids)
                except Exception:
                    pass

            # 4. Delete simulated agent users (cascades to DeliveryAgent)
            sim_user_ids = [a.user.id for a in simulated_agents]
            if sim_user_ids:
                User.objects.filter(id__in=sim_user_ids).delete()

            # 5. Delete simulated customers
            User.objects.filter(
                username__startswith='sim_customer_'
            ).delete()

            # 6. Redis cleanup
            redis_client.delete("simulation:active_tasks")

            return Response({
                "status": "success",
                "message": "Simulator stopped. All data cleared."
            })

        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )