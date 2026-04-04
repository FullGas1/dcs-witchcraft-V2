/**
 * SERVICE LUASHELL CONSOLIDÉ (SUPPORT PROMISE)
 * Emplacement : src/frontend/scripts/services/luashell.js
 */
angular.module('witchcraft')
.factory('luashell', function (socket, $q) {
    var listeners = [];
    var pendingDeffered = null;

    socket.on('luaresult', function (data) {
        // Résolution de la Promise pour luasnippet.js
        if (pendingDeffered) {
            pendingDeffered.resolve(data);
            pendingDeffered = null;
        }
        
        // Notification des autres composants
        listeners.forEach(function (callback) {
            callback(data);
        });
    });

    return {
        execute: function (code) {
            // Création de la Promise attendue par luasnippet.js:108
            pendingDeffered = $q.defer();
            socket.emit('lua', { code: code });
            return pendingDeffered.promise;
        },
        onResult: function (callback) {
            listeners.push(callback);
        }
    };
});