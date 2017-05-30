var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var running = false;
var firstNight = false;
var werewolfList = [];
var user = [];
var victims = {};
var voted = 0;

app.use(express.static('public'));

function waitForList(count) {
    if (werewolfList.length < count) {
        setTimeout(waitForList, 500, count); // setTimeout(func, timeMS, params...)
        console.log('wait...');
    } else {
        console.log(werewolfList);
        io.to('werewolf').emit('send werewolves', werewolfList);
    }
}

function waitForVoted(list, finishFunction){
    if(voted < list.length) {
        setTimeout(waitForVoted, 500, list, finishFunction); // setTimeout(func, timeMS, params...)
        console.log('wait...');
    }
    else{
        finishFunction();
    }
}

function maxValue(array){
    console.log(JSON.stringify(array, null, 4))
    var max = null;
    for (var key in array) {
        if(max === null)
            max = key;
        else if(array[max] < array[key])
            max = key;
        console.log('Key: ' + key + ':' + array[key]);
        console.log('Max: ' + max + ':' + array[max]);
    }
    return max;
}

function end(){
    if(werewolfList.length > 0)
        if(user.length - werewolfList.length > 0)
            return false;
        else
            io.emit('story message', 'All the Villagers are dead. Werewolves, you win!');
    else
        io.emit('story message', 'All the Werewolves are dead. Villagers, you win!');
    running = false;
    firstNight = false;
    return true;

}

function votingCompleted(){
    console.log(victims);
    var victim = maxValue(victims);

    user.splice(user.indexOf(victim), 1);
    if(werewolfList.indexOf(victim) != -1)
        werewolfList.splice(victim, 1);

    voted = 0;
    victims = {};

    io.emit('story message', 'The Villagers killed ' + victim + '!');

    if(!end()){
        console.log('Night');
        io.emit('change night', victim);

        io.emit('story message', 'Nightfall. The Villagers go to sleep. ' +
            'A few Villagers awake again, but they are no humans anymore. They will choose their prey.');

        io.to('werewolf').emit('vote');

        waitForVoted(werewolfList, werewolfVotingCompleted);
    }
    else
        io.emit('end');
}

function werewolfVotingCompleted(){
    console.log(victims);
    var victim = maxValue(victims);

    user.splice(user.indexOf(victim), 1);

    voted = 0;
    victims = {};

    if(werewolfList > 0){
        io.emit('story message', 'The dawn is breaking and the werewolves' +
        ' change into their normal appearance. They killed ' + victim + '!');
        io.emit('change day', victim);

        console.log('Day');
        if(!end()){
            io.emit('story message', 'All the Villagers are awake now.');
            io.emit('vote');
            waitForVoted(user, votingCompleted);
            io.emit('story message', 'Discuss who you want to kill!');
        }
        else
            io.emit('end');
    }
}

io.on('connection', function(socket) {
    if(running){
        io.emit('story message', 'A new Ghost is spectating you!');
        socket.emit('spectator');
        console.log('a spectator connected');
    }
    else{
        console.log('a user connected');
        socket.join('villager');
    }

    socket.on('start', function(){
        if(!running){
            console.log('Game has started');

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
                running = true;
            });
        }
        

    })

    socket.on('chat message', function(msg, night) {
        console.log(msg);
        if (!night){
            io.emit('chat message', socket['name'], msg);
        }
        else
            io.to('werewolf').emit('chat message', socket['name'], msg);
    });

    socket.on('join werewolf', function() {
        socket.join('werewolf');
        werewolfList.push(socket['name']);
    });

    

    socket.on('set username', function(name) {
        console.log(name);
        socket.emit('checked username', check_username(name));
        if(check_username(name) && !running){
            socket['name'] = name;
            io.emit('chat message', name, 'Hey, I want to play with you.');
            user.push(name);
        }
    });

    socket.on('night', function(){
        if(running && !firstNight){
            console.log('Night');
            firstNight = true;
            io.emit('change night', null);

            io.emit('story message', 'Nightfall. The Villagers go to sleep. ' +
                'A few Villagers awake again, but they are no humans anymore. They will choose their prey.');

            io.to('werewolf').emit('vote');

            waitForVoted(werewolfList, werewolfVotingCompleted);
        }
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

    socket.on('disconnect', function() {
        console.log('user disconnected');

        if(user.indexOf(socket['name']) != -1)
            user.splice(user.indexOf(socket['name']), 1);
        if(werewolfList.indexOf(socket['name']) != -1)
            werewolfList.splice(socket['name'], 1);

        socket.emit('snackbar message', socket['name'] + ' left the Game!');
        socket.emit('story message', socket['name'] + ' left the Game!');
    });

    function check_username(name) {
        if (user.indexOf(name) != -1 || name.trim() == '' || name == '_') {
            return false;
        }
        return true;
    }

});

http.listen(3000, function(){
    console.log('listening on *:3000');
});