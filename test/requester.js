// testing
var zmqLib = require('../lib/socket.protocol.http.js'),
    service = {
      name: 'zmqTest'
    },
    client = {
      name: 'client',
      useRootHash: true,
      pattern: 'req'
    },
    server = {
      name: 'server',
      host: ['localhost'],
      //useRootHash: false,
      format: 'packet.format.latencies',
      pattern: 'rep',
      port: [22000, 22001]
    };


/*
 var socket = new Socket(server);

 socket.on('listen', function (url) {
 console.log('Process "' + process.pid + '" listening on ' + url);
 })
 */

var socket = zmqLib(client);

socket.on('message', function (packet, clusterSource) {
  console.log('<<<<<<<<<<<<<<<<<<<<<');
  console.log('response at : ', new Date().toISOString(), 'from', clusterSource);
  console.log('packet.header: ', packet.header);
  console.log('packet.format: ', packet.format);
  console.log('packet.id: ', packet.id);
});

socket.connect(server);
//socket.connect(server.protocol+'://localhost:'+22001);

setInterval(function () {
  var data = {pid:process.pid,timestamp: new Date().toISOString()};

  console.log('--------------------------------------');
  console.log('sending: ', data);
  socket.send(data);
}, 1000);
