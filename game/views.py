# chat/views.py
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.utils.safestring import mark_safe
import json
from django.views.generic import CreateView, TemplateView, View, FormView

class GameView(TemplateView):
    template_name = 'room.html'

    def dispatch(self, request, *args, **kwargs):
        # if logged in, send them to the lobby
        # if request.user.is_authenticated:
        #     return redirect('/lobby/')
        context = super(GameView, self).dispatch(request, *args, **kwargs)
        return context

def index(request):
    return render(request, 'chat/index.html', {})

@login_required
def room(request, room_name):
    return render(request, 'room.html', {
        'room_name_json': mark_safe(json.dumps(room_name)),
        'username': mark_safe(json.dumps(request.user.username))
    })
