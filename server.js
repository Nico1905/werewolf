var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', function(socket) {
    console.log('a user connected');
    socket.join('main');
    socket.broadcast.to('main').emit('chat message', 'hi from ' + socket.id);

    socket.on('disconnect', function() {
        console.log('user disconnected');
    });

    socket.on('chat message', function(msg) {
        if (socket.rooms.secret == undefined) {
            io.to('main').emit('chat message', msg);
        } else {
            io.to('secret').emit('chat message', msg);
        }
    });

    socket.on('join secret', function(enter) {
        if (enter) {
            socket.join('secret');
        } else {
            socket.leave('secret');
        }
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});