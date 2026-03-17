import os
import json
import logging
from pathlib import Path
from datetime import timedelta

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Standard Celery fields if available
        if hasattr(record, "task_id"):
            log_record["task_id"] = record.task_id
        if hasattr(record, "task_name"):
            log_record["task_name"] = record.task_name
            
        # Add extra fields if provided via 'extra={...}'
        for key, value in record.__dict__.items():
            if key not in ["args", "asctime", "created", "exc_info", "exc_text", "filename", "funcName", "levelname", "levelno", "lineno", "module", "msecs", "msg", "name", "pathname", "process", "processName", "relativeCreated", "stack_info", "thread", "threadName"]:
                log_record[key] = value
                
        return json.dumps(log_record)

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-temp-key'
DEBUG = True
ALLOWED_HOSTS = ['*']
CITY_CONFIG = {
    'name': 'Bengaluru',
    'lat': 12.97,
    'lng': 77.59,
    'lat_range': [12.85, 13.05],
    'lng_range': [77.45, 77.65],
    'bounds': {
        'lat_min': 12.85,
        'lat_max': 13.05,
        'lng_min': 77.45,
        'lng_max': 77.65,
    }
}


INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'channels',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    'users',
    'agents',
    'orders',
    'tracking',
    'anomaly',
    'simulator',
    'core',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [("redis", 6379)],
        },
    },
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'trackhive',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'db',
        'PORT': '5432',
    }
}

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator' },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10000/minute',
        'user': '10000/minute',
        'simulator': '100000/minute',
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CELERY_BROKER_URL = 'redis://redis:6379/0'
CELERY_RESULT_BACKEND = 'redis://redis:6379/0'

REDIS_URL = 'redis://redis:6379/1'

if DEBUG:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }


CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = list(default_headers) + [
    "authorization",
    "content-type",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_EXPOSE_HEADERS = ["Authorization"]

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'config.settings.JsonFormatter',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'loggers': {
        'trackhive.anomaly': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'trackhive.assignment': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'trackhive.simulator': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'trackhive.tracking': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'trackhive.celery': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}