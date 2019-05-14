var parts = window.location.href.split('/');
var roomName = parts[4];
var username = parts[5];
var to = '';

var chatSocket = new WebSocket(
    'ws://' + window.location.host +
    '/ws/chat/' + roomName +'/' + username + '/');

var gameSocket = new WebSocket(
    'ws://' + window.location.host +
    '/ws/game/' + roomName +'/' + username + '/');
var subjects = ['colonelmustard','professorplum','mrgreen','mrspeacock','missscarlet','mrswhite'];
var weapons = ['candlestick','revolver','knife','leadpipe','rope','wrench'];
var rooms	=['study', 'hall', 'lounge','library', 'billiardroom',
'diningroom', 'conservatory', 'ballroom', 'kitchen'];
// var orderList = ["missscarlet", "colonelmustard", "mrswhite", "mrgreen", "mrspeacock", "professorplum"];

var secretCards = {
  'character': subjects[Math.floor(Math.random()* 6)],
  'weapon': weapons[Math.floor(Math.random()*6)],
  'room': rooms[Math.floor(Math.random()*9)],
};

var paths = {
  'study': ['hallway1', 'hallway3', 'kitchen'],
  'hallway1': ['study', 'hall'],
  'hall': ['hallway1', 'hallway2', 'hallway4'],
  'hallway2':['hall', 'lounge'],
  'lounge': ['hallway2', 'conservatory', 'hallway5'],
  'hallway3': ['study', 'library'],
  'hallway4': ['hall', 'billiardroom'],
  'hallway5': ['lounge', 'diningroom'],
  'library': ['hallway3', 'hallway6', 'hallway8'],
  'hallway6': ['library', 'billiardroom'],
  'billiardroom': ['hallway6', 'hallway4', 'hallway7', 'hallway9'],
  'hallway7': ['billiardroom', 'diningroom'],
  'diningroom': ['hallway7', 'hallway5', 'hallway10'],
  'hallway8': ['library', 'conservatory'],
  'hallway9': ['billiardroom', 'ballroom'],
  'hallway10': ['diningroom', 'kitchen'],
  'conservatory': ['hallway8', 'lounge', 'hallway11'],
  'hallway11': ['conservatory', 'ballroom'],
  'ballroom': ['hallway11', 'hallway9', 'hallway12'],
  'hallway12': ['ballroom', 'kitchen'],
  'kitchen': ['hallway12', 'study', 'hallway10'],
};

var startingPoint = {
  'colonelmustard':'hallway5',
  'missscarlet':'hallway2',
  'professorplum':'hallway3',
  'mrspeacock':'hallway8',
  'mrgreen':'hallway11',
  'mrswhite':'hallway12'
};

var currentTurn = new turnClass(0,''); //completely initialized in startGame
var playerList; //initialized in startGame, stores users still in the game, also probably unsafe
var gameStarted = false;

gameSocket.onmessage = function(e){
  var data = JSON.parse(e.data);
  if (data['command']==='new_location'){
      assignLocation(data);
  }
  if (data['command']==='choose_character'){
      assignCharacter(data);
  }
  if (data['command']==='secret'){
    assignSecret(data);
  }
  if (data['command']==='hands'){
    assignHands(data['hands'][username]);
  }
  if (data['command']==='next_turn'){
        shareTurn(data);
      }
}
gameSocket.onopen = function(e) {
}
gameSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};

chatSocket.onopen = function(e) {
  fetchMessages();
}

chatSocket.onmessage = function(e) {
    var data = JSON.parse(e.data);
    if (data['command']==='messages'){
      for (let i=0; i<data['messages'].length; i++){
        if (data['messages'][i]['author']==username ||
            data['messages'][i]['to']==username ||
            data['messages'][i]['to']=='' ||
            data['messages'][i]['to']=='all'){
        createMessage(data['messages'][i]);
        }
      }
    } else if (data['command']==='new_message'){
        if (data['message']['author']==username ||
            data['message']['to']==username ||
            data['message']['to']=='' ||
            data['message']['to']=='all'){
          createMessage(data['message']);
        }
    }
};

chatSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};

document.querySelector('#chat-message-input').focus();
document.querySelector('#chat-message-input').onkeyup = function(e) {
    if (e.keyCode === 13) {  // enter, return
        document.querySelector('#chat-message-submit').click();
    }
};


// document.querySelector('#chat-message-submit').onclick = function(e) {
//     var messageInputDom = document.querySelector('#chat-message-input');
//     // var chatTo = document.querySelector('#chat-to');
//     var message = messageInputDom.value;
//     chatSocket.send(JSON.stringify({
//         'message': message,
//         'command': 'new_messages',
//         'from': username,
//         'to': to
//     }));
//
//     messageInputDom.value = '';
// };

function turnClass(turnNum, turnUser){
    this.turnNum = turnNum;
    this.turnUser = turnUser;
    this.moved = false; //has player moved this turn
}

function sendMessageByButton(){
  var messageInputDom = document.querySelector('#chat-message-input');
  var message = messageInputDom.value;
  var toInputDom = document.querySelector('#chat-to');
  var to = toInputDom.value;
  chatSocket.send(JSON.stringify({
      'message': message,
      'command': 'new_messages',
      'from': username,
      'to': to
  }));
  messageInputDom.value = '';
}

function sendMessage(message, to){
  chatSocket.send(JSON.stringify({
      'message': message,
      'command': 'new_messages',
      'from': username,
      'to':to
  }));
}

function sendMessageFromSystem(message,to){
    chatSocket.send(JSON.stringify({
      'message': message,
      'command': 'new_messages',
      'from': 'SYSTEM',
      'to':to
  }));
}

function sendSuggestion(location, weapon, character){
  var weapon = document.getElementById(weapon).value;
  var room = document.getElementById(location).value;
  var character = document.getElementById(character).value;
  // if (character_name=='mrspeacock'){
  //   character_name='mrs-peacock';
  // }
  // if (document.querySelector('#'+character_name+'-who').innerHTML !==''){
  //   var character = document.querySelector('#'+character_name+'-who').innerHTML;
  // } else{
  //   var character = document.getElementById(character).value;
  // }
  chooseLocation(room, true, character);
  sendMessage('suggestion - room: ' + room + ' weapon: '+weapon + ' character: ' + character, 'all');
}

function fetchMessages(){
  chatSocket.send(JSON.stringify({'command':'fetch_messages'}));
}

function createMessage(data){
  document.querySelector('#chat-log').value += (data.author + ': ' + data.content + '\n');
}

function assignLocation(data){
  document.querySelector('#'+data.location+'-who').innerHTML = data.player;
  // if (document.querySelector('#'+data.location+'-who').innerHTML===''){
  //   document.querySelector('#'+data.location+'-who').innerHTML = data.player;
  // } else{
  //   document.querySelector('#'+data.location+'-who').innerHTML += ', '+data.player;
  // }
}

function assignCharacter(data){
  document.querySelector('#' + data.character + '-who').innerHTML = data.from;
}

function assignSecret(data){
  console.log(JSON.stringify(data));
  document.querySelector('#secret-card-item').innerHTML = JSON.stringify(data);
}

function assignHands(data){
  console.log(data);
  for (var i=0; i<data.length; i++){
    document.querySelector('#hand' + i.toString()).innerHTML = data[i];
  }
}

function checkChosenCharacter(){
  var character_list = document.getElementsByClassName('character');
  for (var i=0; i<character_list.length; i++){
    if (character_list[i].innerHTML===username) {
      return true
    }
  }
  return false;
}

function getAllPlayers(){
  var player_list = [];
  var character_list = document.getElementsByClassName('character');
  for (var i=0; i<character_list.length; i++){
    if (character_list[i].innerHTML!=='') {
      player_list.push(character_list[i].innerHTML);
    }
  }
  return player_list;
}

function checkNumOfPlayers(){
  var numOfPlayers=0;
  var character_list = document.getElementsByClassName('character');
  for (var i=0; i<character_list.length; i++){
    if (character_list[i].innerHTML!=='') {
      numOfPlayers++;
    }
  }
  return numOfPlayers;
}

function chooseCharacter(character){
  if (document.querySelector('#'+character+'-who').innerHTML==='' &&
      !checkChosenCharacter()
){
    gameSocket.send(JSON.stringify({
        'command': 'choose_character',
        'from': username,
        'character': character
    }));
  } else if(checkChosenCharacter()){
    alert('You have already chosen you character!');
  } else {
    alert('played by someone already!');
  }
}

function sendLocationJson(username, location){
  return gameSocket.send(JSON.stringify({
      'command': 'move',
      'player': username,
      'location':location
  }));
}

function sendTurnJson(){
     return gameSocket.send(JSON.stringify({
       'command': 'next_turn',
       'turnUser': currentTurn.turnUser,
       'turnNum': currentTurn.turnNum
   }));
 }

 function shareTurn(data){
     //change local version
     currentTurn.turnNum = data.turnNum;
     currentTurn.turnUser = data.turnUser;

 }

function getUserName(){
  return username;
}

function checkIfPlayerCanGotoThatRoom(old_location, new_location){
  return paths[old_location].includes(new_location);
}

function currentLocation(){
  var grid_detail = document.getElementsByClassName('room');
  for (var i=0; i<grid_detail.length; i++){
    if (grid_detail[i].innerHTML.includes(username)) {
      return grid_detail[i].id.replace('-who', '');
    }
  }
}

// function userLocation(suggestion_user){
//   var grid_detail = document.getElementsByClassName('room');
//   for (var i=0; i<grid_detail.length; i++){
//     if (grid_detail[i].innerHTML.includes(suggestion_user)) {
//       return grid_detail[i].id.replace('-who', '');
//     }
//   }
// }


    function chooseLocation(location, teleport=false, user=getUserName(), suggestion=''){
      if(teleport || (isMyTurn() && !currentTurn.moved)){

      if (teleport){
        if (location.substring(0,7)==='hallway'){
          if (document.querySelector('#'+location+'-who').innerHTML===''){
            sendLocationJson(user, location);
          } else {
            alert('Someone is in the hallway already');
          }
        } else{
          if (document.querySelector('#'+location+'-who').innerHTML===''){
            if (document.querySelector('#'+currentLocation()+'-who').innerHTML===''){
              sendLocationJson('', currentLocation());
              sendLocationJson(user, location);
            } else {
              character_string = document.querySelector('#'+currentLocation()+'-who').innerHTML.replace(',','');
              character_string=character_string.replace(user, '');
              sendLocationJson(character_string, currentLocation());
              sendLocationJson(user, location);
            }
          } else{
            if (document.querySelector('#'+currentLocation()+'-who').innerHTML===''){
              character_string = document.querySelector('#'+location+'-who').innerHTML + ',' + user;
              sendLocationJson('', currentLocation());
              sendLocationJson(character_string, location);
            } else {
              console.log('this scenario');
              character_string = document.querySelector('#'+currentLocation()+'-who').innerHTML.replace(',','');
              character_string=character_string.replace(user, '');
              new_character_string = document.querySelector('#'+location+'-who').innerHTML + ',' + user;
              sendLocationJson(character_string, currentLocation());
              sendLocationJson(new_character_string, location);
            }
          }
        }
      } else if (checkIfPlayerCanGotoThatRoom(currentLocation(), location) && !teleport){
        if (location.substring(0,7)==='hallway'){
          if (document.querySelector('#'+location+'-who').innerHTML===''){
            character_string = document.querySelector('#'+currentLocation()+'-who').innerHTML.replace(',','');
            character_string=character_string.replace(user, '');
            sendLocationJson(user, location);
            sendLocationJson(character_string, currentLocation());
            currentTurn.moved = true;
          } else {
            alert('Someone is in the hallway already');
          }
        } else{
          if (document.querySelector('#'+location+'-who').innerHTML===''){
            if (document.querySelector('#'+currentLocation()+'-who').innerHTML===''){
              sendLocationJson('', currentLocation());
              sendLocationJson(user, location);
            } else {
              character_string = document.querySelector('#'+currentLocation()+'-who').innerHTML.replace(',','');
              character_string=character_string.replace(user, '');
              sendLocationJson(character_string, currentLocation());
              sendLocationJson(user, location);
            }
          } else{
            if (document.querySelector('#'+currentLocation()+'-who').innerHTML===''){
              character_string = document.querySelector('#'+location+'-who').innerHTML + ',' + user;
              sendLocationJson('', currentLocation());
              sendLocationJson(character_string, location);
            } else {
              character_string = document.querySelector('#'+currentLocation()+'-who').innerHTML.replace(',','');
              character_string=character_string.replace(user, '');
              new_character_string = document.querySelector('#'+location+'-who').innerHTML + ',' + user;
              sendLocationJson(character_string, currentLocation());
              sendLocationJson(new_character_string, location);
            }
          }
          currentTurn.moved = true; //player has made move, can no longer move
        }
      }

      }//end of first if
      else if(!isMyTurn()){
        alert('It is not your turn!');
      }
      else{
        alert('You have already moved this turn!');
      }
    }

function sendSecretCardsJson(cards){
  return gameSocket.send(JSON.stringify({
      'command': 'secret',
      'character': cards.character,
      'room':cards.room,
      'weapon':cards.weapon
  }));
}

function checkAccusation(char,weap,loc) {
  var character = document.getElementById(char).value;
  var weapon = document.getElementById(weap).value;
  var room = document.getElementById(loc).value;
  var answer = JSON.parse(document.querySelector('#secret-card-item').innerHTML);
  if (answer['character']===character &&answer['weapon']===weapon &&
    answer['room']===room){
      alert('you win!');
    }else{
      alert('you lose');
    }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

// While there remain elements to shuffle...
  while (0 !== currentIndex) {

// Pick a remaining element...
  randomIndex = Math.floor(Math.random() * currentIndex);
  currentIndex -= 1;

// And swap it with the current element.
  temporaryValue = array[currentIndex];
  array[currentIndex] = array[randomIndex];
  array[randomIndex] = temporaryValue;
  }
  return array;
}

function shuffleCardsForHands(){
  var all_cards = subjects.concat(weapons, rooms);
  var secretCardsList = [secretCards['character'], secretCards['weapon'], secretCards['room']]
  var difference = all_cards.filter(x => !secretCardsList.includes(x));
  player_list = getAllPlayers();
  cards_in_each_hands = {};
  for (var i=0; i<player_list.length; i++){
    cards_in_each_hands[player_list[i]]=[];
  }
  for (var j=0; j<difference.length; j++){
    who = j%player_list.length;
    cards_in_each_hands[player_list[who]].push(difference[j]);
  }
  return cards_in_each_hands;
}

function sendHandsJson(){
  return gameSocket.send(JSON.stringify({
      'command': 'hands',
      'hands': shuffleCardsForHands()
  }));
}

function removeCharacterInOrderList(target){
  orderList.splice(orderList.indexOf(target),1);
  return orderList;
}

//returns boolean that tells you if it's your turn or not.
function isMyTurn(){
    return currentTurn.turnUser === username;
}

//increments turn class. Should be used after a move.
function nextTurn(){
    playerList = getAllPlayers();
    //change turn user
    if(playerList.indexOf(currentTurn.turnUser) + 1 === playerList.length){
        currentTurn.turnUser = playerList[0]; //wrap around to beginning of array
    }
    else{
        currentTurn.turnUser = playerList[playerList.indexOf(currentTurn.turnUser)+1];
    }
    currentTurn.moved = false;
    currentTurn.turnNum++;
    sendMessageFromSystem('Turn: ' + currentTurn.turnNum,'all');
    sendTurnJson();
    sendMessageFromSystem(playerList,'all');
}

function endTurn(){
    console.log();
    if(currentTurn.turnUser === username){
        nextTurn();
    }
    else{
        alert('It is not your turn!');
    }
    //insert additional processing at end of turn, if needed
}

//removes current user(player) after wrong accusation. Can only be called by the relevant user on their turn
function removeUserFromPlayerList(){
    for(var i=0; i < playerList.length; i++){
        if(playerList[i] === username){
            playerList.splice(i,1);
            i--;
        }
    }
}

function startGame(){
    var num_of_players = checkNumOfPlayers();
    //var num_of_players = 3;

    if(num_of_players >= 3 && !gameStarted){
        var character_list = document.getElementsByClassName('character');
        for (var i=0; i<character_list.length; i++){
            if (character_list[i].innerHTML !==''){
                var location = startingPoint[character_list[i].id.replace('-', '').replace('-who', '')];
                chooseLocation(location, true, character_list[i].innerHTML);
            }
        }
    sendSecretCardsJson(secretCards);
    sendHandsJson();
    playerList = getAllPlayers();
    gameStarted = true;

    //Begin Turn 1
    currentTurn.turnNum++;
    currentTurn.turnUser = playerList[0];

    //message in chat to indicate started game
    sendMessageFromSystem('---------- Starting Game... ----------','all');
    sendMessageFromSystem('Turn: ' + currentTurn.turnNum,'all');
    sendMessageFromSystem(playerList,'all');
    }
    else if(gameStarted){
        alert('Game already started! Finish current game to start a new one');
    }
    else{
        alert('You need more players (3-6)!');
    }

  //
  // if (checkNumOfPlayers() > 2){
  //   alert('Send to consumers to update the starting position');
  // } else{
  //   alert('You need more players!');
  // }
  // alert('there is a function to check num of players, write this function to send to consumers to update the starting position');
}
