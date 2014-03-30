/* Socket io notes
// using rooms https://github.com/LearnBoost/socket.io/wiki/Rooms
// send to current request socket client
socket.emit('message', "this is a test");

// sending to all clients, include sender
io.sockets.emit('message', "this is a test");

// sending to all clients except sender
socket.broadcast.emit('message', "this is a test");

// sending to all clients in 'game' room(channel) except sender
socket.broadcast.to('game').emit('message', 'nice game');

// sending to all clients in 'game' room(channel), include sender
io.sockets.in('game').emit('message', 'cool game');

// sending to individual socketid
io.sockets.socket(socketid).emit('message', 'for your eyes only');
*/
module.exports = function(io){
  var current_users = {};
  io.set('log level', 1);
  io.sockets.on('connection',function(socket){
    socket.emit('connected',{m:'ok'});

    socket.on('new_user',function(data){
      console.log('new user connected: '+ data.username);
      current_users[socket.id] = data.username;
      io.sockets.emit('to_all',{m:data.username+' joined the room.',t:'grey'});
    });

    socket.on('user_msg',function(data){
      username = current_users[socket.id];
      io.sockets.emit('to_all',{m:username+': '+data.m});
    });

    socket.on('user_vid',function(data){
      username = current_users[socket.id];
      io.sockets.emit('to_all',{m:username,v:data.v});
    });

    socket.on('disconnect',function(){
      username = current_users[socket.id];
      io.sockets.emit('to_all',{m:username+' left the room.'});
    });
  });
}