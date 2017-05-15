$(document).ready(function () {

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

    socket.on('checked username', function(valid) {
        if (valid) {
            $('#join_modal').modal("hide");
        } else {
            $('.join-error').removeClass('blank');
        }
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

    socket.on('werewolf', function(obj) {
        socket.emit('join werewolf', 'test');
    });
});