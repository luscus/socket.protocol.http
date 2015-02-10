/* jshint node:true */
'use strict';

var merge        = require('node.extend');
var base         = require('socket.base');
var validate     = require('./validate');
var info         = require('../package.json');

var types    = {};
types.client = require('./client/client');
types.server = require('./server/server');


module.exports = function (_socket) {
  _socket = base.init(_socket, info);

  // validate protocol specific configuration options
  validate.checkOptions(_socket.config);

  // Deep merge of the service and the socket lib template
  merge(true, _socket, types[_socket.config.model]);

  return _socket;
};
