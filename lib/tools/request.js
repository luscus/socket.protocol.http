/* jshint node:true */
/* global require */
/* global exports */
'use strict';

var model        = require('socket.base').models.server;
var tools        = require('socket.base').tools;


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

exports.getMetadata = function getMetadata (socket, request) {
  var meta = {};

  // TODO: build up byte statistic - look at socket.listener.server and connections
  meta.remoteIp     = tools.net.getRemoteIp(request);
  meta.params       = request.params;

  return meta;
};


exports.handler   = function handler (request, response) {

  var packet = request.body;
  var socket = this;
  var meta   = exports.getMetadata(socket, request);

  response.parent = socket;

  model.request.handler.bind(response)(packet, meta);
};
