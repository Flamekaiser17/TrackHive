import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from agents.models import DeliveryAgent
from tracking.models import LocationUpdate
from anomaly.models import AnomalyLog
import time

def run_anomaly_test():
    print("🚀 Starting Anomaly Detection System Test...")
    
    agent = DeliveryAgent.objects.first()
    if not agent:
        print("❌ No agent found. Run phase 2 test first.")
        return

    # Clear existing logs for this agent
    AnomalyLog.objects.filter(agent=agent).delete()

    # Trigger Speed Anomaly (> 120 kmph)
    print("⚙️ Triggering Speed Anomaly (155 kmph)...")
    LocationUpdate.objects.create(
        agent=agent,
        lat=12.9720,
        lng=77.5950,
        speed_kmph=155.0
    )
    
    # Wait for Celery worker to process the task
    print("⏳ Waiting for Celery worker (2 seconds)...")
    time.sleep(2)

    anomaly = AnomalyLog.objects.filter(agent=agent, anomaly_type='speed_anomaly').first()
    if anomaly:
        print(f"🌟 TEST PASSED: Speed Anomaly detected! (Detected at: {anomaly.detected_at})")
    else:
        print("❌ TEST FAILED: Anomaly system didn't log the violation.")

if __name__ == "__main__":
    run_anomaly_test()
