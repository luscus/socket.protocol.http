/* jshint node:true */
'use strict';

var EventEmitter = require('events').EventEmitter;
var merge        = require('node.extend');
var base         = require('socket.base/');
var validate     = require('./validate');
var info         = require('../package.json');

var types    = {};
types.client = require('./client/client');
types.server = require('./server/server');


module.exports = function (_socket) {
  // enforce using of paths
  if (_socket.emitter instanceof EventEmitter) {
    _socket.config.usePath = (typeof _socket.config.usePath === 'boolean' ? _socket.config.usePath : true);
  }
  else {
    _socket.usePath = (typeof _socket.usePath === 'boolean' ? _socket.usePath : true);
  }


  _socket = base.init(_socket, info);

  // validate protocol specific configuration options
  validate.checkOptions(_socket.config);

  // Deep merge of the service and the socket lib template
  merge(true, _socket.lib, types[_socket.config.model]);

  return _socket;
};
