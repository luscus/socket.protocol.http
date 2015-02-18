/* jshint node:true */
'use strict';

var EventEmitter = require('events').EventEmitter;
var merge        = require('node.extend');
var base         = require('socket.base');
var validate     = require('./validate');
var info         = require('../package.json');

var types    = {};
types.client = require('./client/client');
types.server = require('./server/server');


module.exports = function (_socket) {
  // enforce using of paths
  if (_socket.emitter instanceof EventEmitter) {
    _socket.options.useRootHash = (typeof _socket.options.useRootHash === 'boolean' ? _socket.options.useRootHash : true);
  }
  else {
    _socket.useRootHash = (typeof _socket.useRootHash === 'boolean' ? _socket.useRootHash : true);
  }


  _socket = base.init(_socket, info);

  // validate protocol specific configuration options
  validate.checkOptions(_socket.options);

  // deep merge of the service and the socket lib template
  merge(true, _socket.lib, types[_socket.options.model]);

  // initialise socket
  _socket.lib._init();

  return _socket;
};
