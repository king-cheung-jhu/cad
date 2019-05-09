from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Game(models.Model):
    player = models.ForeignKey(User, related_name='game', on_delete=models.CASCADE)
    location = ((1, 'study'), (2, 'hallway1'), (3, 'Hall'))
    timestamp = models.DateTimeField(auto_now_add=True)
    # colonel_mustard = models.ForeignKey(Player)
    # professor_pulm = models.ForeignKey(Player)
    # mr_green = models.ForeignKey(Player)
    # mrs_peacock = models.ForeignKey(Player)
    # miss_scarlet = models.ForeignKey(Player)
    # mrs_white = models.ForeignKey(Player)
    # winner = models.ForeignKey(User, related_name='game', on_delete=models.CASCADE)

    def __str__(self):
        return self.player.username

    def all_messages():
        return Game.objects.all()


class Player(models.Model):
    name = models.TextField
    timestamp = models.DateTimeField(auto_now_add=True)

    def get_player(name):
        return Player.objects.filter(name=name)

    def get_all_player():
        return Player.objects.all()
#
#
# class GameLog(models.Model):
#     player = models.ForeignKey(User, related_name='game', on_delete=models.CASCADE)
#     location = ((1, 'study'), (2, 'hallway1'), (3, 'Hall'))
#     suggest = ((1, 'study'), (2, 'hallway1'), (3, 'Hall'))
#     accusation = ((1, 'study'), (2, 'hallway1'), (3, 'Hall'))
#     timestamp = models.DateTimeField(auto_now_add=True)
#
#
# class Suggest(models.Model):
#     player = models.ForeignKey(User, related_name='game', on_delete=models.CASCADE)
#     character = ((1, 'study'), (2, 'hallway1'), (3, 'Hall'))
#     room = ((1, 'study'), (2, 'hallway1'), (3, 'Hall'))
#     weapon = ((1, 'study'), (2, 'hallway1'), (3, 'Hall'))
#     timestamp = models.DateTimeField(auto_now_add=True)
#
#
# class Accusation(models.Model):
#     player = models.ForeignKey(User, related_name='game', on_delete=models.CASCADE)
#     character = ((1, 'study'), (2, 'hallway1'), (3, 'Hall'))
#     room = ((1, 'study'), (2, 'hallway1'), (3, 'Hall'))
#     weapon = ((1, 'study'), (2, 'hallway1'), (3, 'Hall'))
#     timestamp = models.DateTimeField(auto_now_add=True)
