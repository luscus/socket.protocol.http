/* jshint node:true */
'use strict';

var restify    = require('restify');
var tools      = require('../../../socket.lib.tools/');
var model      = require('../../../socket.model.client/');

function _send (_connection) {
  var packet = _connection.queue.next();
  
  if (packet) {
    tools.packet.addRequestStart(packet);

    _connection.client.post(undefined, packet, _connection.requestHandler);

    if (_connection.queue.hasNext()) {
      setTimeout(function () {
        _send(_connection);
      }, 15);
    }
  }
}

var httpClientTemplate = {
  connect: function (target) {

    var socket      = this;
    var connections = socket._connect(target, socket, true);
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
          return function requestHandler (error, request, response, body) {

            if (error) {
              console.log(connection.uri+'::connectionTest::error: ', error);
              model.handleError.bind(connection)(error);
            }
            else {
              var netSocketName = connection.host + ':' + connection.port;
              var netSocket     = connection.client.agent.sockets[netSocketName][0];
              var events        = Object.getOwnPropertyNames(netSocket._events);

              if (events.indexOf('error') < 0) netSocket.on('error', model.handleError.bind(connection));

              connection.parent.emit('connected', connection);
            }
          };
        })(socket.connections[uri]);

        socket.connections[uri].requestHandler = (function (connection) {
          return function requestHandler (error, request, response, packet) {

            if (error) {
              console.log(connection.uri+'::callback::error: ', error.stack);
              model.handleError.bind(connection)(error);
            }
            else {
              tools.packet.addResponseLatency(packet);
              connection.parent.emit('message', packet, connection.uri);

              connection.queue.remove(packet);
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
  },

  getClusterTarget: function getClusterTarget () {
    if (this.cluster.length) {
      return this.cluster[Math.floor(Math.random() * this.cluster.length)];
    }

    return false;
  },

  send: function send (data) {
    var target = this.getClusterTarget();

    if (target) {
      //this.updateStats(target, data);
      var packet = tools.packet.wrapData(data, this.connections[target]);
      
      this.connections[target].queue.add(packet);
      _send(this.connections[target]);
    }
    else {
      var targets = Object.getOwnPropertyNames(this.connections);
      /*
      console.log('------------------------------------');
      console.log(this.connections[targets[0]].client);
      console.log('no target in cluster.');
      */
    }
  },

  getQueue: function (url) {
    return this.connections[url].queue;
  },

  parseQueueEntry: function (entry) {
    return entry;
  },

  close: function (url) {
    //return this.connections[url].close();
  }
};


module.exports = httpClientTemplate;
