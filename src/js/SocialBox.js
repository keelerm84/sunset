/* global Firebase */
(function(Firebase) {
    'use strict';

    window.Sunset = window.Sunset || {};

    window.Sunset.SocialBox = function(box) {
        // var self = this;

        var firebase = new Firebase(window.Sunset.firebaseURL);
        var roomRef = firebase.child('player').child('my-room');
        var playerRef;

        var tbody = box.find('table tbody');

        function renderPlayer(player, tr) {
            var value = '';
            var parts = '';

            if (player.vote !== undefined) {
                value = $('<span class="mask">').text(player.vote.value);

                parts = $('<span class="mask">');
                if (player.vote.parts !== undefined) {
                    for (var i in player.vote.parts) {
                        var img = player.vote.parts[i];
                        parts.append('<img class="icon" src="' + img + '.png" />');
                    }
                }
            }

            tr.find('td.parts').html(parts);
            tr.find('td.value').html(value);
        }

        roomRef.on('child_added', function(playerSnapshot) {
            var player = playerSnapshot.val();

            var tr = $('<tr>').attr('data-player', playerSnapshot.key());
            $('<td>').text(player.user.displayName).appendTo(tr);
            $('<td class="text-center parts">').appendTo(tr);
            $('<td class="text-right value">').appendTo(tr);
            tr.appendTo(tbody);

            renderPlayer(player, tr);
        });

        roomRef.on('child_removed', function(playerSnapshot) {
            var tr = $(tbody).find('tr[data-player="' + playerSnapshot.key() + '"]');

            tr.remove();
        });

        roomRef.on('child_changed', function(playerSnapshot) {
            var player = playerSnapshot.val();
            var tr = $(tbody).find('tr[data-player="' + playerSnapshot.key() + '"]');

            renderPlayer(player, tr);
        });

        this.userChanged = function(user) {
            // Remove player for old session.
            if (playerRef) {
                playerRef.remove();
                playerRef = undefined;
            }

            if (!user) {
                return;
            }

            playerRef = roomRef.push();
            playerRef.onDisconnect().remove();

            // Set the current player's identity.
            playerRef.set({
                user: {
                    uid: user.uid,
                    displayName: user.displayName,
                },
            });

            playerRef.on('value', function(playerSnapshot) {
                var player = playerSnapshot.val();

                if (player.vote !== undefined) {
                    tbody.removeClass('has-not-voted');
                } else {
                    tbody.addClass('has-not-voted');
                }
            });
        };

        this.voteChanged = function(e) {
            if (!playerRef) {
                return;
            }

            // Update the current player's vote.
            playerRef.update({
                vote: {
                    value: e.vote,
                    parts: e.parts ? e.parts : [],
                    timestamp: e.timeStamp,
                },
            });
        };

        $(box).find('button.clear').on('click', function() {
            // Clear each player's vote.
            roomRef.once('value', function(roomSnapshot) {
                roomSnapshot.forEach(function(playerSnapshot) {
                    playerSnapshot.ref().child('vote').remove();
                });
            });
        });
    };
})(Firebase);
