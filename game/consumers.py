from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import json
from .models import Game

User = get_user_model()

class GameConsumer(WebsocketConsumer):

    def fetch_messages(self, data):
        messages = Message.all_messages()
        content = {
            'command': 'messages',
            'messages': self.messages_to_json(messages)
        }
        self.send_message(content)

    def new_message(self, data):
        author = data['from']
        author_user = User.objects.filter(username=author)[0]
        message = Message.objects.create(author=author_user, content=data['message'])
        content = {
            'command' : 'new_message',
            'message' : self.message_to_json(message),
        }
        return self.send_chat_message(content)

    def messages_to_json(self, messages):
        result= []
        for message in messages:
            result.append(self.message_to_json(message))
        return result

    def message_to_json(self, message):
        return {
            'author': message.author.username,
            'content': message.content,
            'timestamp':str(message.timestamp)
        }

    def location_to_json(self, location):
        return {
            'player': location.player.username,
            'location':location.location,
            'timestamp':str(location.timestamp)
        }

    def player_moves_to_new_location(self, data):
        # author_user = User.objects.filter(username=player)[0]
        # location = Game.objects.create(player=author_user)
        content = {
            'command' : 'new_location',
            'player': data['player'],
            'location' : data['location']
        }
        return self.assign_to_new_location(content)

    def assign_to_new_location(self, content):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'move',
                'location': content
            }
        )

    def assign_to_new_character(self, content):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'choose_character',
                'character': content
            }
        )

        # var subjects = ['colonelmustard','professorpulm','mrgreen','mrspeacock','missscarlet','mrswhite'];
        # var weapons = ['candlestick','revolver','knife','leadpipe','rope','abc'];
        
    def update_turn(self,content):
        
        #get latest row data
        turnnum = Game.objects.latest('id').getTurnNum()+1
        turnuser = Game.objects.latest('id').getTurnUser()
        playerlist = Game.objects.latest('id').getPlayerList()       
        
        #if last turn_user is the last in the array, wrap back around to first user
        if playerlist.split(',').index(turnuser) == len(playerlist.split(','))-1:
            boardGame = Game(turn_num = turnnum, turn_user = playerlist.split(',')[0], player_list = playerlist)
        else:
            boardGame = Game(turn_num = turnnum, turn_user = playerlist.split(',')[playerlist.split(',').index(turnuser)+1],player_list = playerlist)       
          
        boardGame.save();

        data = {
            'command' : 'next_turn',
            'turn_num': boardGame.getTurnNum(),
            'turn_user' : boardGame.getTurnUser(),
            'player_list' : boardGame.getPlayerList()           
        }
        return self.advance_turn(data)

    def advance_turn(self, content):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'next_data',
                'turn_data': content
            }
        )    

    def assign_secret(self, content):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'secret',
                'cards': content
            }
        )
    def assign_hands(self, content):
        print(content)
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'hands',
                'hands': content
            }
        )

    def kill_player(self, content):
        
        #get latest row data
        turnnum = Game.objects.latest('id').getTurnNum()+1
        turnuser = Game.objects.latest('id').getTurnUser()
        playerlist = Game.objects.latest('id').getPlayerList()
        
        #find next player turn
        if playerlist.split(',').index(turnuser) == len(playerlist.split(','))-1:
            turnuser_new = playerlist.split(',')[0]
        else:
            turnuser_new = playerlist.split(',')[playerlist.split(',').index(turnuser)+1]
              
        #eliminate user from player_list
        removed = playerlist.split(',')
        removed.remove(content['eliminated'])
        removedstring = ",".join(removed)
        
        #add new row for auto next turn
        boardGame = Game(turn_num = turnnum, turn_user = turnuser_new, player_list = removedstring)
        boardGame.save()
           
        data = {
            'command' : 'wrong_acc',
            'turn_num': boardGame.getTurnNum(),
            'turn_user' : boardGame.getTurnUser(),
            'player_list' : boardGame.getPlayerList()           
        }
        return self.killed_player(data)
        
    def killed_player(self,content):

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'kill',
                'alive_list': content
            }
        )
    
    def init_game(self,content):

        #players, location, timestamp of class not implemented yet
        boardGame = Game(turn_num=1, turn_user=content['playerlist'].split(',')[0],
                         player_list=content['playerlist'])
        boardGame.save()

        data = {
            'command' : 'start_game',
            'turn_num': boardGame.getTurnNum(),
            'turn_user' : boardGame.getTurnUser(),
            'player_list' : boardGame.getPlayerList()           
        }
        return self.start_game(data)
        
    def start_game(self,content):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'start',
                'start_data': content
            }
        )
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'game_%s' % self.room_name

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        data = json.loads(text_data)
        self.game_commands[data['command']](self, data)

    def send_chat_message(self, message):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    def send_message(self, content):
        data = content['location']
        return self.send(text_data=json.dumps(data))

    # Receive message from room group
    # def chat_message(self, event):
    #     location = event['message']
    #     # Send message to WebSocket
    #     self.send(text_data=json.dumps(location))

    def move(self, content):
        return self.send(text_data=json.dumps(content['location']))

    def choose_character(self, content):
        return self.send(text_data=json.dumps(content['character']))

    def secret(self, content):
        return self.send(text_data=json.dumps(content['cards']))

    def hands(self, content):
        return self.send(text_data=json.dumps(content['hands']))

    def next_data(self, content):
        return self.send(text_data=json.dumps(content['turn_data']))

    def start(self, content):
        return self.send(text_data=json.dumps(content['start_data']))  
     
    def kill(self, content):
        return self.send(text_data=json.dumps(content['alive_list']))

    game_commands = {
        'fetch_messages' : fetch_messages,
        'new_messages' : new_message,
        'move': player_moves_to_new_location,
        'choose_character': assign_to_new_character,
        'secret': assign_secret,
        'hands': assign_hands,
        'next_turn': update_turn,
        'start_game': init_game,
        'wrong_accusation': kill_player,
    }
