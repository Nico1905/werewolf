$(document).ready(function () {

    $('form').submit(false);

    $('#join_modal').modal({
        backdrop: 'static',
        keyboard: false
    });

    var socket = io();
    var secret = false;

    function show_snackbar(text) {
        $('#snackbar').text(text);
        $('#snackbar').addClass('show');
        setTimeout(function(){ $('#snackbar').removeClass('show'); }, 3000);
    }

    $('#join_button').on('click', function() {
        socket.emit('set username', $('#username-input').val());
    });

    $('#send_button').on('click', function() {
        var msg = $('#m').val();
        if (msg != '') {
            if (msg == '/info') {
                show_snackbar('The city i don\'t know is ');
            }
            if (msg == '/night') {
                $('.card').each(function() {
                    if ($(this).children('p').text() != '_') {
                        $(this).children('.icon').attr('src', 'werewolf.svg');
                    }
                });
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
                socket.emit('chat message', $('#m').val(), false);
            }
            $('#m').val('');
            return false;
        }
        return false;
    });

    $('.card').on('click', function() {
        $(this).addClass('flipped');
        $(this).children('.icon').attr('src', 'tombstone.svg');
        $(this).children('.icon-small').remove();
        if ($(this).children('p').text() != '_') {
            show_snackbar($(this).children('p').text() + ' died');
        }
        $(this).children('p').text('_');
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
    });

    socket.on('story message', function(msg) {
        var now = new Date(Date.now());
        var formatted = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
        $('#messages').append('<li class="message-item"><span class="sicon"></span><span class="nickname">' + name + '</span><span class="timestamp">' + formatted + '</span><p class="message">' + msg + '</p></li>');
    });

    socket.on('snackbar message', function(msg) {
        console.log('sb msg');
        show_snackbar(msg);
    });

    socket.on('start game', function(users) {
        console.log('start');
        for (var i = 0; i < users.length; i++) {
            $('#card-container').append('<div class="card"><img src="villager.svg" class="icon"><p class="card-username">' + users[i] + '</p></div>');
        }
    });
});