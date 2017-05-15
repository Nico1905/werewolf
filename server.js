var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var werewolf = io.of('werewolf')

var running = false;
var werewolfList = new Array();

app.use(express.static('public'));

function waitForList(list, count) {
    if (list.length < count) {
        setTimeout(waitForList, 500, list, count); // setTimeout(func, timeMS, params...)
        console.log('wait...');
    } else {
        console.log(werewolfList);
        werewolf.emit('send werewolfs', werewolfList);
    }
}

io.on('connection', function(socket) {
    if(running){
        io.emit('chat message', 'A new Ghost is spectating you!');
        socket.join('spectator');
        console.log('a spectator connected');
    }
    else{
        console.log('a user connected');
        socket.join('farmer');
    }

    socket.on('set username', function(name){
        if(!running)
            io.emit('chat message', 'Hello I ams!');
    });

    socket.on('start', function(){
        console.log('Game has started');
        running = true;

        io.emit('chat message', 'Let the Games begin!!');     
        io.clients(function(error, clients){
            if (error) throw error;
            console.log(clients); // => [PZDoMHjiu8PYfRiKAAAF, Anw2LatarvGVVXEIAAAD]
            var count = Math.floor(Math.random() * clients.length/2) + 2;
            console.log(count);
            for (var i = count;i > 0; i--) {
                var client = clients.splice(clients.length * Math.random() | 0, 1)[0]
                console.log(client);
                socket.to(client).emit('chat message', 'You are a werewolf!');
                socket.to(client).emit('werewolf');
            }

            io.emit('start game', clients.length);
            waitForList(werewolfList, count);
        });

        
    })

    socket.on('chat message', function(msg, night) {
        console.log(msg);
        if (!night){
            io.emit('chat message', msg);
            console.log('day');
        }
        else
            werewolf.emit('chat message', msg);
    });

    socket.on('join werewolf', function(name) {
        socket.join('werewolf');
        werewolfList.push(name);
    });

    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});