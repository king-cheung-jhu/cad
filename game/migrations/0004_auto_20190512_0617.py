# Generated by Django 2.2 on 2019-05-12 06:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0003_player'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='game',
            name='player',
        ),
        migrations.RemoveField(
            model_name='game',
            name='timestamp',
        ),
        migrations.AddField(
            model_name='game',
            name='player_list',
            field=models.CharField(default='', max_length=200),
        ),
        migrations.AddField(
            model_name='game',
            name='turn_num',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='game',
            name='turn_user',
            field=models.CharField(default='', max_length=30),
        ),
    ]
