/* jshint node:true */
'use strict';

exports.test = function test (socket) {
  socket.emit('portUsed', socket.config.port, socket.uri, socket);
};
