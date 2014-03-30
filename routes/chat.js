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
      current_users[socket.id] = {
        name: data.username,
        color: "#"+((1<<24)*Math.random()|0).toString(16)
      }
      io.sockets.emit('to_all',{m:data.username+' joined the room.',c:'#eee'});
    });

    socket.on('user_msg',function(data){
      user = current_users[socket.id];
      io.sockets.emit('to_all',{m:user.name+': '+data.m,c:user.color});
    });

    socket.on('user_vid',function(data){
      user = current_users[socket.id];
      io.sockets.emit('to_all',{m:user.name+": "+data.m,v:data.v,c:user.color});
    });

    socket.on('disconnect',function(){
      user = current_users[socket.id];
      io.sockets.emit('to_all',{m:user.name+' left the room.',c:'#eee'});
    });
  });
}