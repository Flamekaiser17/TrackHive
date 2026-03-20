import json
import time
import random
import uuid
from locust import HttpUser, task, between, events
from websocket import create_connection

# Global lat/lng for Bengaluru
BENGALURU_LAT = 12.9716
BENGALURU_LNG = 77.5946

class TrackHiveWSUser(HttpUser):
    # This keeps it from running tasks until abstract classes are formed
    abstract = True

    def on_start(self):
        # We assume simulation has already created these users or we'll bypass auth for load testing
        # For professional testing, we use a single test token
        self.auth_headers = {"Authorization": "Bearer TEST_TOKEN"}
        self.ws = None

    def connect_ws(self, path):
        # We use websocket-client to connect to Daphne
        # Note: In a real test, replace 'localhost' with 'web' if running inside docker network
        url = f"ws://localhost:8000{path}"
        try:
            self.ws = create_connection(url)
            self.ws.settimeout(2.0)
        except Exception as e:
            events.request.fire(
                request_type="WebSocket",
                name="Connection",
                response_time=0,
                response_length=0,
                exception=e,
            )

    def on_stop(self):
        if self.ws:
            self.ws.close()

class AgentUser(TrackHiveWSUser):
    wait_time = between(2, 4)

    def on_start(self):
        super().on_start()
        self.agent_id = random.randint(100, 9999)
        self.connect_ws(f"/ws/tracking/")

    @task
    def send_location_update(self):
        start_time = time.perf_counter()
        lat = BENGALURU_LAT + random.uniform(-0.1, 0.1)
        lng = BENGALURU_LNG + random.uniform(-0.1, 0.1)
        
        self.client.post("/api/tracking/update_location/", json={
            "agent_id": self.agent_id,
            "lat": lat,
            "lng": lng,
            "speed_kmph": random.uniform(20, 60)
        })
        
        if self.ws:
            try:
                payload = {
                    "type": "location_update",
                    "lat": lat,
                    "lng": lng,
                    "speed": random.uniform(20, 80)
                }
                self.ws.send(json.dumps(payload))
                # Measure time for server to respond if server sends ACKs
                # Since TrackHive is broadcast-only right now, we measure send latency
                total_time = (time.perf_counter() - start_time) * 1000
                events.request.fire(
                    request_type="WebSocket",
                    name="Agent Update Send",
                    response_time=total_time,
                    response_length=len(json.dumps(payload)),
                )
            except Exception as e:
                events.request.fail.fire(
                    request_type="WebSocket",
                    name="Agent Update Send",
                    response_time=0,
                    exception=e
                )

class CustomerUser(TrackHiveWSUser):
    wait_time = between(1, 1)

    def on_start(self):
        super().on_start()
        # Bind to a random order id
        self.order_id = random.randint(1, 1000)
        self.connect_ws(f"/ws/tracking/") # All connect here for now

    @task
    def wait_for_updates(self):
        if self.ws:
            try:
                start_time = time.perf_counter()
                msg = self.ws.recv()
                total_time = (time.perf_counter() - start_time) * 1000
                
                data = json.loads(msg)
                if data.get('type') == 'eta_update':
                    events.request.fire(
                        request_type="WebSocket",
                        name="Customer ETA Received",
                        response_time=total_time,
                        response_length=len(msg),
                    )
            except Exception:
                pass

class AdminUser(HttpUser):
    wait_time = between(5, 15)

    @task(3)
    def fetch_active_orders(self):
        self.client.get("/api/orders/?status=active", name="Admin Fetch Orders")

    @task(2)
    def fetch_busy_agents(self):
        self.client.get("/api/agents/?status=busy", name="Admin Fetch Agents")

    @task(1)
    def fetch_anomalies(self):
        # Hypothetical endpoint or standard list
        self.client.get("/api/tracking/anomalies/", name="Admin Fetch Anomalies")
