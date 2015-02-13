/* jshint node:true */
'use strict';

var ErrorHandler = require('./ErrorHandler');
var tools        = require('socket.base').tools;
var model        = require('socket.base').models.server;


exports.onMessage = function onMessage (packet, response, socket, raw, meta) {
  if (meta.path === '/') {
    socket.lib._respond({error: 'provide an url path'}, response, socket);
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

    socket.lib._respond(packet, response, socket);
  }
};

exports.onError   = function onError (request, response, route, error) {
  var socket = this;

  if (ErrorHandler[error.code]) {
    ErrorHandler[error.code](socket, request, response);
  }
  else {
    socket.emit('error', error, socket.uri, socket);
    socket.lib._respond({error: error.message, stack: error.stack}, response, socket);
  }
};

exports.handler   = function handler (request, response) {

  var packet = request.body;

  if (packet) {
    var socket = this;

    if (packet.CONNTEST) {
      socket.lib._respond(packet, response, socket);
      return;
    }

    var raw    = request.rawBody;
    var meta   = model.request.getMetadata(socket, request);

    tools.packet.addResponseStart(packet);

    exports.onMessage(packet, response, socket, raw, meta);
  }
  else {
    socket.lib._respond({reason: 'no data was provided'}, response, socket, 400);
  }
};
