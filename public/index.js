$(document).ready(function () {

    $('form').submit(false);

    $('#join_modal').modal({
        backdrop: 'static',
        keyboard: false
    });

    var socket = io();
    var secret = false;
    var night = false;
    var voting = false;
    var username = '';
    var werewolf = false;
    var werewolf_list = [];

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
                $(this).children('.icon-small').remove();
                $(this).children('p').text('_');
                $(this).removeClass('card-selected');
            }
        });
    }

    $('#join_button').on('click', function() {
        username = $('#username-input').val();
        socket.emit('set username', username);
    });

    $('#send_button').on('click', function() {
        var msg = $('#m').val();
        if (msg != '') {
            if (msg == '/info') {
                show_snackbar('The city i don\'t know is ');
            }
            if (msg == '/night') {
                console.log('send night');
                socket.emit('night');
            }
            if (msg == '/day') {
                $('.card').each(function() {
                    if ($(this).children('p').text() != '_') {
                        $(this).children('.icon').attr('src', 'villager.svg');
                    }
                });
            }
            if (msg == '/start') {
                socket.emit('start');
            }
            else{
                socket.emit('chat message', $('#m').val(), night);
            }
            $('#m').val('');
            return false;
        }
        return false;
    });

    $('#card-container').on('click', '.card', function() {
        if (voting && ((night && werewolf_list.indexOf($(this).children('p').text()) == -1) || !night)) {
            socket.emit('voted', $(this).children('p').text());
            voting = false;
            $('.card').removeClass('card-hover');
            $(this).addClass('card-selected');
        }
    });

    $('#join_room').change(function() {
        secret = !secret;
        socket.emit('start');
    });

    socket.on('chat message', function(name, msg) {
        var now = new Date(Date.now());
        var formatted = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
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
    });

    socket.on('snackbar message', function(msg) {
        console.log('sb msg');
        show_snackbar(msg);
    });

    socket.on('start game', function(users) {
        console.log('start');
        console.log(users);
        for (var i = 0; i < users.length; i++) {
            $('#card-container').append('<div class="card"><img src="villager.svg" class="icon"><p class="card-username">' + users[i] + '</p></div>');
        }
    });

    socket.on('change night', function(victim) {
        night = true;
        if (werewolf) {
            $('.card').each(function() {
                if (werewolf_list.indexOf($(this).children('p').text()) != -1)
                    $(this).children('.icon').attr('src', 'werewolf.svg');
            });
        }
        if (victim != null) {
            show_snackbar(victim + ' died');
            kill(victim);
        }
    });

    socket.on('vote', function() {
        $('.card').each(function() {
            if (werewolf_list.indexOf($(this).children('p').text()) == -1)
                $(this).addClass('card-hover');
        });
        voting = true;
    });

    socket.on('change day', function(victim) {
        night = false;
        if (werewolf) {
            $('.card').each(function() {
                if (werewolf_list.indexOf($(this).children('p').text()) != -1)
                    $(this).children('.icon').attr('src', 'villager.svg');
            });
        }
        show_snackbar(victim + ' died');
        kill(victim);
        $('.card').addClass('card-hover');
        voting = true;
    });

    socket.on('send werewolfs', function(list) {
        werewolf_list = list;
        $('.card').each(function() {
            if (werewolf_list.indexOf($(this).children('p').text()) != -1)
                $(this).append('<img src="werewolf.svg" class="icon-small">');
        });
        console.log('got werewolves');
        console.log(werewolf_list);
    });
});