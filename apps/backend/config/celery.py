import os
from celery import Celery
from celery.schedules import crontab

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

import time
import logging
from celery.signals import task_prerun, task_postrun

app = Celery('trackhive')
app.config_from_object('django.conf:settings', namespace='CELERY')

@task_prerun.connect
def task_prerun_handler(task_id, task, *args, **kwargs):
    logger = logging.getLogger('trackhive.celery')
    logger.info(
        f"Task {task.name} started",
        extra={
            "task_id": task_id,
            "task_name": task.name,
            "task_args": str(args),
            "task_kwargs": str(kwargs),
            "event": "task_started"
        }
    )
    task._start_time = time.time()

@task_postrun.connect
def task_postrun_handler(task_id, task, *args, **kwargs):
    logger = logging.getLogger('trackhive.celery')
    duration = 0
    if hasattr(task, '_start_time'):
        duration = (time.time() - task._start_time) * 1000  # in ms
        
    state = kwargs.get('state', 'UNKNOWN')
    logger.info(
        f"Task {task.name} finished",
        extra={
            "task_id": task_id,
            "task_name": task.name,
            "duration_ms": round(duration, 2),
            "status": state,
            "event": "task_finished"
        }
    )

app.autodiscover_tasks([
    'anomaly',
    'agents',
    'simulator', 
    'tracking',
    'orders',
])


app.conf.beat_schedule = {
    'sync-fatigue-every-15-min': {
        'task': 'agents.tasks.sync_fatigue_to_db',
        'schedule': crontab(minute='*/15'),
    },
    'reset-fatigue-midnight': {
        'task': 'agents.tasks.reset_fatigue_scores',
        'schedule': crontab(hour=0, minute=0),
    },
    'check-unreachable-every-1-min': {
        'task': 'anomaly.tasks.check_unreachable_agents',
        'schedule': crontab(minute='*'),
    }
}