/* jshint node:true */
/* global require */
/* global exports */
'use strict';

var restify      = require('restify');
var tools        = require('socket.base').tools;
var model        = require('socket.base').models.client;


exports._send = function _send (packet, _connection) {
  _connection.client.post(undefined, packet, _connection.responseHandler);
};

exports._init = function _init () {
  return this.parent;
};

exports._connect = function _connect (connections) {

  var socket = this.parent;
  var uri;

  connections.forEach(function connectionIterator (connection) {
    uri = connection.uri;

    if (!socket.connections[uri]) {
      socket.connections[uri] = {};

      socket.connections[uri] = connection;

      socket.connections[uri].client = restify.createJsonClient({
        url: uri
      });

      socket.connections[uri].testHandler = (function (connection) {
        return function responseHandler (error, request, response, body) {

          if (error) {
            console.log(connection.uri+'::testHandler::error: ', error);
            model.handleError.bind(connection)(error);
          }
          else {
            var netSocketName = connection.host + ':' + connection.port;
            var netSockets     = connection.client.agent.sockets[netSocketName];

            netSockets.forEach(function netSocketIterator (netSocket, index) {
              // remove old handler
              netSocket.removeListener('error', model.handleError);

              // add new handler with correct connection binding
              netSocket.on('error', model.handleError.bind(connection));
            });

            connection.parent.emit('connected', connection);
          }
        };
      })(socket.connections[uri]);

      socket.connections[uri].responseHandler = (function (connection) {
        return function responseHandler (error, request, response, packet) {

          if (error) {
            console.log(connection.uri+'::callback::error: ', error.stack);
            model.handleError.bind(connection)(error);
          }
          else {
            model.response.handler(packet, connection);
          }
        };
      })(socket.connections[uri]);

      // test connection
      socket.connections[uri].test = (function (connection) {
        return function connectionTest () {

          connection.client.post(
            undefined,
            {CONNTEST: true},
            connection.testHandler
          );
        };
      })(socket.connections[uri]);

      socket.connections[uri].test();
    }
  });
};
