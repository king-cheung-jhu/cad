# chat/urls.py
from django.conf.urls import url
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    # url(r'^chat/(?P<room_name>[^/]+)/$', RoomView.as_view()),
     # re_path(r'^(?P<room_name>[^/]+)/$', TemplateView.as_view(template_name='room.html'))

]
