var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var werewolf = io.of('werewolf')

var running = false;

app.use(express.static('public'));

io.on('connection', function(socket) {
    console.log('a user connected');
    if(running)
        socket.join('spectator');

    socket.on('user_name', function(name){
        if(!running)
            io.to('main').emit('chat message', name, 'Hello I ams!');
    });

    socket.on('start', function(){
        running = true;
    })

    socket.on('chat message', function(msg, night) {
        if (!night)
            io.emit('chat message', msg);
        else
            werewolf.emit('chat message', msg);
    });

    socket.on('join werewolf', function(enter) {
        if (enter) {
            socket.join('werewolf');
        } else {
            socket.leave('werewolf');
        }
    });

    socket.on('disconnect', function() {
        console.log('user disconnected');
    });

    function check_username(uname) {
        if (uname == '_')
            return false;
        return true;
    }

    socket.on('check username', function(uname) {
        console.log(uname);
        socket.emit('checked username', check_username(uname));
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});