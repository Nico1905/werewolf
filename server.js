var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var running = false;
var werewolfList = new Array();
var user = new Array();
var victims = {};
var voted = 0;

app.use(express.static('public'));

function waitForList(list, count) {
    if (list.length < count) {
        setTimeout(waitForList, 500, list, count); // setTimeout(func, timeMS, params...)
        console.log('wait...');
        console.log(list);
    } else {
        console.log(werewolfList);
        //werewolf.emit('send werewolfs', werewolfList); doesn't work
        io.to('werewolf').emit('send werewolfs', werewolfList);
    }
}

function waitForVoted(){
    if(voted < werewolfList.length) {
        setTimeout(waitForVoted, 500); // setTimeout(func, timeMS, params...)
        console.log('wait...');
    }
    else{
        console.log(victims);
        io.emit('change day', maxValue(victims));
    }
}

function maxValue(array){
    var max = null;
    for (var key in victims) {
        if(max === null)
            max = key;
        else if(victims[max] < victims[key])
            max = victims[key];
    }    
}

io.on('connection', function(socket) {
    if(running){
        io.emit('story message', 'A new Ghost is spectating you!');
        socket.join('spectator');
        console.log('a spectator connected');
    }
    else{
        console.log('a user connected');
        socket.join('villager');
    }

    socket.on('start', function(){
        console.log('Game has started');
        running = true;

        io.emit('story message', 'Let the Games begin!!');
        io.clients(function(error, clients){
            if (error) throw error;
            console.log(clients); // => [PZDoMHjiu8PYfRiKAAAF, Anw2LatarvGVVXEIAAAD]
            var count = Math.floor(Math.random() * clients.length/2) + 1;
            console.log(count);
            for (var i = count;i > 0; i--) {
                var client = clients.splice(clients.length * Math.random() | 0, 1)[0]
                console.log(client);
                io.to(client).emit('snackbar message', 'You are a werewolf!');
                io.to(client).emit('werewolf');
            }

            io.emit('start game', user);
            waitForList(werewolfList, count);
        });

    })

    socket.on('chat message', function(msg, night) {
        console.log(msg);
        if (!night){
            io.emit('chat message', socket['name'], msg);
            console.log('day');
        }
        else
            io.to('werewolf').emit('chat message', msg);
    });

    socket.on('join werewolf', function() {
        socket.join('werewolf');
        werewolfList.push(socket['name']);
    });

    socket.on('disconnect', function() {
        console.log('user disconnected');
    });

    function check_username(name) {
        if (user.indexOf(name) != -1)
            return false;
        return true;
    }

    socket.on('set username', function(name) {
        console.log(name);
        socket.emit('checked username', check_username(name));
        if(check_username(name) && !running){
            socket['name'] = name;
            io.emit('chat message', name, 'Hello I ams!');
            user.push(name);
        }
    });

    socket.on('night', function(){
        io.emit('change night');
        // werewolf.emit('vote'); doesn't work
        io.to('werewolf').emit('vote'); // works

        waitForVoted();

        socket.on('voted', function(victim){
            if (victims[victim] != undefined)
                victims[victim] += 1;
            else
                victims[victim] = 1;
            voted += 1;
        });

    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});