# chat/views.py
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.utils.safestring import mark_safe
import json
from django.views.generic import CreateView, TemplateView, View, FormView
from django.contrib.auth import authenticate, login
from django.views.generic import View
from templates.chat.forms import UserForm


class RoomView(TemplateView):
    template_name = 'room.html'

    def dispatch(self, request, *args, **kwargs):
        # if logged in, send them to the lobby
        # if request.user.is_authenticated:
        #     return redirect('/lobby/')
        context = super(RoomView, self).dispatch(request, *args, **kwargs)
        return context


def index(request):
    return render(request, 'chat/index.html', {'username': mark_safe(json.dumps(request.user.username))})


@login_required
def room(request, room_name):
    return render(request, 'room.html', {
        'room_name_json': mark_safe(json.dumps(room_name)),
        'username': mark_safe(json.dumps(request.user.username))
    })


class UserFormView(View):
    form_class = UserForm
    template_name = 'templates/chat/register.html'

    def get(self, request):
        from = self.form_class(None)
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)

        if form.is_valid():

            user = form.save(commit=False)
            username = form.cleaned_data['username']
            user.save()
