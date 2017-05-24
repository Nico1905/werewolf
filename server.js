var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var running = false;
var werewolfList = [];
var user = [];
var victims = {};
var voted = 0;

app.use(express.static('public'));

function waitForList(count) {
    if (werewolfList.length < count) {
        setTimeout(waitForList, 500, count); // setTimeout(func, timeMS, params...)
        console.log('wait...');
        console.log(werewolfList);
    } else {
        console.log(werewolfList);
        //werewolf.emit('send werewolfs', werewolfList); doesn't work
        io.to('werewolf').emit('send werewolfs', werewolfList);
    }
}

function waitForVoted(list, finishFunction){
    console.log(list);
    if(voted < list.length) {
        setTimeout(waitForVoted, 500, list, finishFunction); // setTimeout(func, timeMS, params...)
        console.log('wait...');
        console.log(voted);
    }
    else{
        finishFunction();
    }
}

function maxValue(array){
    var max = null;
    for (var key in array) {
        if(max === null)
            max = key;
        else if(array[max] < array[key])
            max = array[key];
        console.log(max + ':' + array[max]);
    }  
    return max;  
}

function votingCompleted(){
    console.log(victims);
    var victim = maxValue(victims);
    io.emit('change night', victim);

    user.splice(user.indexOf(victim), 1);
    if(werewolfList.indexOf(victim) != -1)
        werewolfList.splice(victim, 1);

    voted = 0;
    victims = {};

    waitForVoted(werewolfList, werewolfVotingCompleted);
}

function werewolfVotingCompleted(){
    console.log(victims);
    var victim = maxValue(victims);
    io.emit('change day', victim);

    user.splice(user.indexOf(victim), 1);

    voted = 0;
    victims = {};

    waitForVoted(user, votingCompleted);
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
            waitForList(count);
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
        io.emit('change night', null);
        // werewolf.emit('vote'); doesn't work
        io.to('werewolf').emit('vote'); // works

        waitForVoted(werewolfList, werewolfVotingCompleted);
    });

    socket.on('voted', function(victim, night){
        console.log('voted');
        console.log(victims[victim]);

        if (victims[victim] != undefined)
            victims[victim] += 1;
        else
            victims[victim] = 1;
        voted += 1;
        console.log(voted);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});