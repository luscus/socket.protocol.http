/* jshint node:true */
/* global require */
/* global exports */
'use strict';

var http         = require('http');
var tools        = require('socket.base').tools;
var model        = require('socket.base').models.server;
var restify      = require('restify');
var root         = require('package.root');



var requestTools = require('../tools/request');

exports._requestHandler = function _requestHandler (data, meta, raw) {
  console.log('_requestHandler received: ', data);
};

exports._close = function _close () {
  this.listener.close();
};

exports._init = function _init (_options) {
  var _socket = this.parent;

  _options = _options || {
    maxBodySize: 52428800,
    mapParams: false
  };

  if (!_socket.options.bind) {
    _socket.options.bind = '*';
  }

  _socket.listener = restify.createServer({
    name: root.name + ':' + _socket.options.port,
    version: root.package.version
  });


  // needed to catch EADDRINUSE errors
  process.on('uncaughtException', function uncaughtExceptionHandler (error) {
    model.handleError.bind(_socket)(error);
  });

  _socket.listener.server.on('error', function (error) {
    _socket.emit('error', _socket.uri, _socket);
  });
  _socket.listener.server.on('close', function (request, response, cb) {
    _socket.emit('closing', _socket.uri, _socket);
  });
  _socket.listener.server.on('listening', function (request, response, cb) {
    _socket.emit('listening', _socket);
  });

  _socket.listener.uri    = _socket.uri;
  _socket.listener.parent = _socket;

  _socket.listener.use(function(req, res, next) {
    var data = '';
    req.on('data', function(chunk) {
      data += chunk;
    });
    req.on('end', function() {
      req.rawBody = data;
    });

    next();
  });

  _socket.listener.use(restify.CORS());
  _socket.listener.use(restify.acceptParser(['application/json']));
  _socket.listener.use(restify.bodyParser(_options));
  _socket.listener.use(restify.queryParser());


  _socket.listener.on('NotFound', requestTools.handler.bind(_socket));           // When a client request is sent for a uri that does not exist, restify will emit this event. Note that restify checks for listeners on this event, and if there are none, responds with a default 404 handler. It is expected that if you listen for this event, you respond to the client.
  _socket.listener.on('uncaughtException', requestTools.onError.bind(_socket));  // Emitted when some handler throws an uncaughtException somewhere in the chain. The default behavior is to just call res.send(error), and let the built-ins in restify handle transforming, but you can override to whatever you want here.


  var pathRegEx = new RegExp('^\/' + _socket.options.path + '\/.*$');

  if (!_socket.options.usePath) {
    pathRegEx = new RegExp('^\/.*$');
  }

  _socket.listener.post(pathRegEx, requestTools.handler.bind(_socket));

  _socket.listener.listen(_socket.options.port);

  return _socket.listener;
};

exports._bind = function _bind (_callback) {
  this._requestHandler = _callback;
};

exports._getPeer = function _getPeer (socket, request) {
  var port = (request.connection._peername ? request.connection._peername.port : 'none');
  var host = (request.connection._peername ? request.connection._peername.address : '');

  return socket.options.protocol +
    '://' +
    (request.remoteHost || host || tools.net.getRemoteIp(request)) +
    ':' +
    port;
};

exports._getBufferSize = function _getRequestBufferSize (request) {
  return request.socket.bytesRead;
};

exports._respond = function _respond (packet, response, socket, code) {
  code = code || 200;

  var data = packet.getData();

  if (data.error || data.status === 'ERROR') {
    code = 500;
  }

  response.writeHead(code, http.STATUS_CODES[code], {'Content-Type': 'application/json'});

  response.charset = "utf-8";
  response.write(packet.toString());
  response.end();
};
