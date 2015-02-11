/* jshint node:true */
'use strict';

var http    = require('http');
var tools   = require('socket.lib.tools');
var model   = require('socket.base').models.server;
var restify = require('restify');
var root    = require('package.root');



var ResponseHandler = require('./ResponseHandler');


var httpServerTemplate = {
  listener: null,
  requestHandler: null,

  close: function () {
    this.listener.close();
  },

  bind: function (_callback, _options) {
    var _socket = this;

    _options = _options || {
      maxBodySize: 52428800,
      mapParams: false
    };

    _socket.requestHandler = _callback;

    if (!_socket.config.bind) {
      _socket.config.bind = '*';
    }

    _socket.listener = restify.createServer({
      name: root.name + ':' + _socket.config.port,
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

    var uri = tools.net.getUri(_socket.config) + _socket.config.path + '/';

    _socket.uri             = uri;
    _socket.listener.uri    = uri;
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


    _socket.listener.on('NotFound', ResponseHandler.handler.bind(_socket));           // When a client request is sent for a uri that does not exist, restify will emit this event. Note that restify checks for listeners on this event, and if there are none, responds with a default 404 handler. It is expected that if you listen for this event, you respond to the client.
    _socket.listener.on('uncaughtException', ResponseHandler.onError.bind(_socket));  // Emitted when some handler throws an uncaughtException somewhere in the chain. The default behavior is to just call res.send(error), and let the built-ins in restify handle transforming, but you can override to whatever you want here.


    var pathRegEx = new RegExp('^\/' + _socket.config.path + '\/.*$');

    _socket.listener.post(pathRegEx, ResponseHandler.handler.bind(_socket));

    _socket.listener.listen(_socket.config.port);

    return _socket.listener;
  },
  
  respond: function (packet, meta, response, code) {
    code = code || 200;

    if (packet.error) {
      code = 500;
    }

    if (meta) {
      tools.packet.addResponseTime(packet);
    }

    response.writeHead(code, http.STATUS_CODES[code], {'Content-Type': 'application/json'});

    response.charset = "utf-8";
    response.write(JSON.stringify(packet));
    response.end();
  }
};


module.exports = httpServerTemplate;
