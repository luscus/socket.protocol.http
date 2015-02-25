/* jshint node:true */
/* global require */
/* global module */
'use strict';

var EventEmitter = require('events').EventEmitter;
var merge        = require('node.extend');
var base         = require('socket.base');
var validate     = require('./validate');
var info         = require('../package.json');


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

  // Applying the pattern specific beaviour template
  var patternTemplate = require('./templates/' + _socket.options.pattern);
  merge(true, _socket.lib, patternTemplate);

  // initialise socket
  _socket.lib._init();

  return _socket;
};
