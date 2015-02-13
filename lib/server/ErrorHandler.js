/* jshint node:true */
'use strict';

exports.test = function test (socket) {
  socket.emit('portUsed', socket.options.port, socket.uri, socket);
};
