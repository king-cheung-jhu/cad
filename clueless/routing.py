# mysite/routing.py
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
import chat.consumers as cc
import game.consumers as gc
from django.conf.urls import url

application = ProtocolTypeRouter({
    # (http->django views is added by default)
    'websocket': AuthMiddlewareStack(
        URLRouter([
            url(r'^ws/chat/(?P<room_name>[^/]+)/(?P<user_name>[^/]+)/$', cc.ChatConsumer),
            url(r'^ws/game/(?P<room_name>[^/]+)/(?P<user_name>[^/]+)/$', gc.GameConsumer),
        ])
    )
})
