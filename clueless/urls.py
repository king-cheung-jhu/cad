"""clueless URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
# from django.urls import path
from django.conf.urls import include, url
from chat.views import *
from game.views import *

urlpatterns = [
    url(r'^chat/', include('chat.urls')),
    url(r'^game/', include('game.urls')),
    # url(r'^admin/', admin.site.urls),
    url(r'', include('chat.urls')),
    url(r'^chat/(?P<room_name>[^/]+)/(?P<user_name>[^/]+)/$', RoomView.as_view()),
    url(r'^game/(?P<room_name>[^/]+)/(?P<user_name>[^/]+)/$', GameView.as_view()),
]
