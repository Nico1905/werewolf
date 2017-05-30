$(document).ready(function () {

    $('form').submit(false);

    $('#join_modal').modal({
        backdrop: 'static',
        keyboard: false
    });

    var socket = io();
    var night = false;
    var voting = false;
    var username = '';
    var werewolf = false;
    var werewolf_list = [];
    var dead = false;

    function show_snackbar(text) {
        $('#snackbar').text(text);
        $('#snackbar').addClass('show');
        setTimeout(function(){ $('#snackbar').removeClass('show'); }, 3000);
    }

    function kill(name) {
        $('.card').each(function() {
            if ($(this).children('p').text() == name) {
                $(this).addClass('flipped');
                $(this).children('.icon').attr('src', 'tombstone.svg');
                $(this).children('p').text('_');
                $('.card').removeClass('card-selected');
            }
        });
    }

    function clear_vars() {
        night = false;
        voting = false;
        werewolf = false;
        werewolf_list = [];
        dead = false;
    }

    $('#join_button').on('click', function() {
        username = $('#username-input').val();
        socket.emit('set username', username);
    });

    $('#send_button').on('click', function() {
        var msg = $('#m').val();
        if (msg != '' && !dead && (!night || werewolf)) {
            if (msg == '/info') {
                show_snackbar('You are playing werewolf');
            }
            else if (msg == '/night') {
                socket.emit('night');
            }
            else if (msg == '/start') {
                socket.emit('start');
            }
            else {
                socket.emit('chat message', $('#m').val(), night);
            }
        }
        $('#m').val('');
        return false;
    });

    $('#card-container').on('click', '.card', function() {
        if (voting && ((night && werewolf_list.indexOf($(this).children('p').text()) == -1) || !night) && $(this).children('p').text() != '_' && $(this).children('p').text() != username) {
            socket.emit('voted', $(this).children('p').text());
            voting = false;
            $('.card').removeClass('card-hover');
            $(this).addClass('card-selected');
        }
    });

    socket.on('chat message', function(name, msg) {
        var now = new Date(Date.now());
        var formatted = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
        if (night)
            $('#messages').append('<li class="message-item"><span class="wicon"></span><span class="nickname">' + name + '</span><span class="timestamp">' + formatted + '</span><p class="message">' + msg + '</p></li>');
        else
            $('#messages').append('<li class="message-item"><span class="gicon"></span><span class="nickname">' + name + '</span><span class="timestamp">' + formatted + '</span><p class="message">' + msg + '</p></li>');
        $('.messages-wrapper').scrollTop($('.messages-wrapper').prop('scrollHeight'));
    });

    socket.on('checked username', function(valid) {
        if (valid) {
            $('#join_modal').modal("hide");
        } else {
            $('.join-error').removeClass('blank');
        }
    });

    socket.on('werewolf', function() {
        socket.emit('join werewolf');
        werewolf = true;
    });

    socket.on('story message', function(msg) {
        var now = new Date(Date.now());
        var formatted = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
        $('#messages').append('<li class="message-item"><span class="sicon"></span><span class="nickname">Narrator</span><span class="timestamp">' + formatted + '</span><p class="message">' + msg + '</p></li>');
        $('.messages-wrapper').scrollTop($('.messages-wrapper').prop('scrollHeight'));
    });

    socket.on('snackbar message', function(msg) {
        show_snackbar(msg);
    });

    socket.on('start game', function(users) {
        console.log('start');
        for (var i = 0; i < users.length; i++) {
            $('#card-container').append('<div class="card"><img src="villager.svg" class="icon"><p class="card-username">' + users[i] + '</p></div>');
        }
    });

    socket.on('change night', function(victim) {
        console.log('night');
        night = true;
        if (werewolf && !dead) {
            $('.card').each(function() {
                if (werewolf_list.indexOf($(this).children('p').text()) != -1)
                    $(this).children('.icon').attr('src', 'werewolf.svg');
            });
        }
        if (victim != null) {
            if (victim == username) {
                dead = true;
                $("#m").prop('disabled', true);
                show_snackbar('You died');
                console.log('dead');
            } else {
                show_snackbar(victim + ' died');
            }
            kill(victim);
        }
    });

    socket.on('vote', function() {
        console.log('vote now');
        if (!dead) {
            if (night) {
                $('.card').each(function() {
                    if (werewolf_list.indexOf($(this).children('p').text()) == -1 && $(this).children('p').text() != '_')
                        $(this).addClass('card-hover');
                });
            } else {
                $('.card').each(function() {
                    if ($(this).children('p').text() != '_' && $(this).children('p').text() != username) {
                        $(this).addClass('card-hover');
                    }
                });
            }
            voting = true;
        }
    });

    socket.on('change day', function(victim) {
        console.log('day');
        night = false;
        if (werewolf) {
            $('.card').each(function() {
                if (werewolf_list.indexOf($(this).children('p').text()) != -1)
                    $(this).children('.icon').attr('src', 'villager.svg');
            });
        }
        if (victim == username) {
            dead = true;
            $("#m").prop('disabled', true);
            show_snackbar('You died');
            console.log('dead');
        } else {
            show_snackbar(victim + ' died');
        }
        kill(victim);
    });

    socket.on('send werewolves', function(list) {
        werewolf_list = list;
        $('.card').each(function() {
            if (werewolf_list.indexOf($(this).children('p').text()) != -1)
                $(this).append('<img src="werewolf.svg" class="icon-small">');
        });
        console.log('got werewolves');
    });

    socket.on('end', function() {
        clear_vars();
        $('#card-container').empty();
        $("#m").prop('disabled', false);
    });

    socket.on('spectator', function() {
        $("#m").prop('disabled', true);
    });
});