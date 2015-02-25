/* jshint node:true */
/* global require */
/* global exports */
'use strict';

var tools        = require('socket.base').tools;
var model        = require('socket.base').models.server;


exports.onMessage = function onMessage (packet, response, socket, raw, meta) {
  if (meta.path === '/') {
    socket.lib._respond({error: 'provide an url path'}, response, socket);
    return;
  }

  if (packet) {

    try {
      packet.data = socket.lib._requestHandler(packet.data, meta, raw);
    }
    catch (ex) {
      packet.data = {error: ex.message, stack: ex.stack};
    }

    socket.lib._respond(packet, response, socket);
  }
};

exports.onError   = function onError (request, response, route, error) {
  var socket = this;

  socket.emit('error', error, socket.uri, socket);
  socket.lib._respond({error: error.message, stack: error.stack}, response, socket);
};

exports.handler   = function handler (request, response) {

  var packet = request.body;
  var socket = this;

  response.parent = socket;

  model.request.handler.bind(response)(packet);

  /*
  if (packet) {

    if (packet.CONNTEST) {
      socket.lib._respond(packet, response, socket);
      return;
    }

    var raw    = request.rawBody;
    var meta   = model.request.getMetadata(socket, request);


    //exports.onMessage(packet, response, socket, raw, meta);
  }
  else {
    socket.lib._respond({reason: 'no data was provided'}, response, socket, 400);
  }
  */
};