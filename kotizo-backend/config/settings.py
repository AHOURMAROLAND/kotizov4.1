from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='dev-secret-key')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'cloudinary',
    'cloudinary_storage',
    'users',
    'cotisations',
    'paiements',
    'quickpay',
    'notifications',
    'agent_ia',
    'admin_panel',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.KotizoRequestMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'users.User'

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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Lome'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/min',
        'user': '200/min',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:8081,http://192.168.213.40:8081'
).split(',')
CORS_ALLOW_CREDENTIALS = True

REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'TIMEOUT': 300,
    }
}

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TIMEZONE = 'Africa/Lome'
CELERY_BEAT_SCHEDULE = {
    'expirer-quickpay': {
        'task': 'quickpay.tasks.expirer_quickpay',
        'schedule': 60,
    },
    'verifier-payout-pending': {
        'task': 'paiements.tasks.verifier_payout_pending',
        'schedule': 300,
    },
    'ping-evolution-api': {
        'task': 'notifications.tasks.ping_evolution_api',
        'schedule': 300,
    },
    'expirer-cotisations': {
        'task': 'cotisations.tasks.expirer_cotisations',
        'schedule': 3600,
    },
    'supprimer-tokens-expires': {
        'task': 'users.tasks.supprimer_tokens_expires',
        'schedule': 3600,
    },
    'reset-compteurs-quotidiens': {
        'task': 'users.tasks.reset_compteurs_quotidiens',
        'schedule': 86400,
    },
    'reset-compteurs-ia': {
        'task': 'agent_ia.tasks.reset_compteurs_ia',
        'schedule': 86400,
    },
    'envoyer-rapport-journalier': {
        'task': 'notifications.tasks.envoyer_rapport_journalier',
        'schedule': 72000,
    },
    'verifier-seuils-ambassadeur': {
        'task': 'users.tasks.verifier_seuils_ambassadeur',
        'schedule': 86400,
    },
    'verifier-business-expires': {
        'task': 'users.tasks.verifier_business_expires',
        'schedule': 86400,
    },
    'supprimer-comptes-non-verifies': {
        'task': 'users.tasks.supprimer_comptes_non_verifies',
        'schedule': 86400,
    },
    'supprimer-conversations-ia': {
        'task': 'agent_ia.tasks.supprimer_conversations_ia',
        'schedule': 86400,
    },
    'reset-compteurs-email': {
        'task': 'notifications.tasks.reset_compteurs_email',
        'schedule': 86400,
    },
    'notifier-promo-verification': {
        'task': 'users.tasks.notifier_promo_verification',
        'schedule': 3600,
    },
}

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': config('CLOUDINARY_CLOUD_NAME', default=''),
    'API_KEY': config('CLOUDINARY_API_KEY', default=''),
    'API_SECRET': config('CLOUDINARY_API_SECRET', default=''),
}
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

EMAIL_PROVIDERS = [
    {
        'name': 'gmail',
        'backend': 'django.core.mail.backends.smtp.EmailBackend',
        'host': 'smtp.gmail.com',
        'port': 587,
        'use_tls': True,
        'user': config('GMAIL_USER', default=''),
        'password': config('GMAIL_PASSWORD', default=''),
        'daily_limit': 500,
    },
    {
        'name': 'brevo',
        'backend': 'django.core.mail.backends.smtp.EmailBackend',
        'host': 'smtp-relay.brevo.com',
        'port': 587,
        'use_tls': True,
        'user': config('BREVO_USER', default=''),
        'password': config('BREVO_PASSWORD', default=''),
        'daily_limit': 300,
    },
    {
        'name': 'mailjet',
        'backend': 'django.core.mail.backends.smtp.EmailBackend',
        'host': 'in-v3.mailjet.com',
        'port': 587,
        'use_tls': True,
        'user': config('MAILJET_USER', default=''),
        'password': config('MAILJET_PASSWORD', default=''),
        'daily_limit': 200,
    },
    {
        'name': 'resend',
        'backend': 'django.core.mail.backends.smtp.EmailBackend',
        'host': 'smtp.resend.com',
        'port': 587,
        'use_tls': True,
        'user': config('RESEND_USER', default=''),
        'password': config('RESEND_PASSWORD', default=''),
        'daily_limit': 100,
    },
]

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Kotizo <noreply@kotizo.app>')

PAYDUNYA_MASTER_KEY = config('PAYDUNYA_MASTER_KEY', default='')
PAYDUNYA_PRIVATE_KEY = config('PAYDUNYA_PRIVATE_KEY', default='')
PAYDUNYA_TOKEN = config('PAYDUNYA_TOKEN', default='')
PAYDUNYA_MODE = config('PAYDUNYA_MODE', default='test')

GEMINI_API_KEY = config('GEMINI_API_KEY', default='')
FCM_SERVER_KEY = config('FCM_SERVER_KEY', default='')
RECAPTCHA_SECRET_KEY = config('RECAPTCHA_SECRET_KEY', default='')

EVOLUTION_API_URL = config('EVOLUTION_API_URL', default='http://localhost:8080')
EVOLUTION_API_KEY = config('EVOLUTION_API_KEY', default='kotizo-evolution-key-2026')

SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=0.2)

LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'kotizo_json': {
            '()': 'core.logger.KotizoJsonFormatter',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'kotizo_json',
        },
        'file_general': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(LOGS_DIR / 'kotizo.log'),
            'maxBytes': 10 * 1024 * 1024,
            'backupCount': 5,
            'formatter': 'kotizo_json',
        },
        'file_errors': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(LOGS_DIR / 'errors.log'),
            'maxBytes': 10 * 1024 * 1024,
            'backupCount': 10,
            'formatter': 'kotizo_json',
            'level': 'ERROR',
        },
        'file_paiements': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(LOGS_DIR / 'paiements.log'),
            'maxBytes': 20 * 1024 * 1024,
            'backupCount': 30,
            'formatter': 'kotizo_json',
        },
        'file_fraude': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(LOGS_DIR / 'fraude.log'),
            'maxBytes': 5 * 1024 * 1024,
            'backupCount': 20,
            'formatter': 'kotizo_json',
        },
    },
    'loggers': {
        'kotizo': {
            'handlers': ['console', 'file_general'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'kotizo.errors': {
            'handlers': ['console', 'file_errors'],
            'level': 'ERROR',
            'propagate': False,
        },
        'kotizo.paiements': {
            'handlers': ['console', 'file_paiements'],
            'level': 'INFO',
            'propagate': False,
        },
        'kotizo.fraude': {
            'handlers': ['console', 'file_fraude'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
# CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', ...).split(',')

CORS_ALLOW_ALL_ORIGINS = True