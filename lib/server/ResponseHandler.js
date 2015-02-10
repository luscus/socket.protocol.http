/* jshint node:true */
'use strict';

var ErrorHandler = require('./ErrorHandler');
var tools        = require('socket.lib.tools');
var model        = require('socket.model.server');


exports.onMessage = function onMessage (raw, packet, meta, response, socket) {
  if (meta.path === '/') {
    socket.respond({error: 'provide an url path'}, response);
    return;
  }

  if (packet) {

    var data;

    try {
      packet.data = socket.requestHandler(packet.data, meta, raw);
    }
    catch (ex) {
      packet.data = {error: ex.message, stack: ex.stack};
    }

    socket.respond(packet, meta, response);
  }
  else {
    socket.respond({reason: 'no data was provided'}, meta, response, 400);
  }
};

exports.onError   = function onError (request, response, route, error) {
  var socket = this;

  if (ErrorHandler[error.code]) {
    ErrorHandler[error.code](socket, request, response);
  }
  else {
    socket.emit('error', error, socket.uri, socket);
    socket.respond({error: error.message, stack: error.stack}, response);
  }
};

exports.handler   = function handler (request, response) {
  var socket = this;
  var packet = request.body;

  if (packet.CONNTEST) {
    socket.respond(packet, null, response);
    return;
  }

  var raw    = request.rawBody;
  var meta   = model.request.getMetadata(socket, request);

  tools.packet.addResponseStart(packet);

  exports.onMessage(raw, packet, meta, response, socket);
};
