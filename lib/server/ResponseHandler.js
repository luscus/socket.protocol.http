/* jshint node:true */
'use strict';

var ErrorHandler = require('./ErrorHandler');
var tools        = require('../../../socket.lib.tools/');
var model        = require('../../../socket.model.server/');


function onMessage (raw, packet, meta, response, socket) {
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
}

function onError (request, response, route, error) {
  if (ErrorHandler[error.code]) {
    ErrorHandler[error.code](this, request, response);
  }
  else {
    this.emit('error', error, this.uri, this);
    socket.respond({error: error.message, stack: error.stack}, response);
  }
}

function handler (request, response) {
  var socket = this;
  var packet = request.body;

  if (packet.CONNTEST) {
    socket.respond(packet, null, response);
    return;
  }

  var raw    = request.rawBody;
  var meta   = model.request.getMetadata(socket, request);

  tools.packet.addResponseStart(packet);

  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('raw:    ', raw);
  console.log('meta:   ', meta);
  console.log('packet: ', packet);
  onMessage(raw, packet, meta, response, socket);
}

exports.onMessage = onMessage;
exports.onError   = onError;
exports.handler   = handler;
