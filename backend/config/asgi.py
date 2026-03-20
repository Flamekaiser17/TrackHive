import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from tracking.routing import websocket_urlpatterns


@database_sync_to_async
def get_user_from_token(token_key):
    User = get_user_model()
    try:
        # Robustly handle Bearer prefix if accidentally sent
        if token_key.startswith('Bearer '):
            token_key = token_key.split(' ')[1]
            
        token = AccessToken(token_key)
        user_id = token['user_id']
        user = User.objects.get(id=user_id)
        return user
    except Exception as e:
        print(f"ASGI_AUTH_ERROR: Token failed for user retrieval: {str(e)}")
        return AnonymousUser()


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        from urllib.parse import parse_qs
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token_list = params.get('token', [None])
        token = token_list[0] if token_list else None

        if token:
            user = await get_user_from_token(token)
            scope['user'] = user
            print(f"ASGI_WS_CONNECT: URL={scope['path']}, User={user.email if not user.is_anonymous else 'Anonymous'}, Role={getattr(user, 'role', 'N/A')}")
        else:
            scope['user'] = AnonymousUser()
            print(f"ASGI_WS_CONNECT: URL={scope['path']}, Reason=No Token Provided")

        return await self.app(scope, receive, send)


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})