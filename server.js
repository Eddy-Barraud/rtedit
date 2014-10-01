var express = require('express');
var sharejs = require('share');

// Set up http server (using express for serving static files)

var app = express();
var http = require('http').Server(app);
var port = process.argv[3] || 8080;

app.use('/', express.static(__dirname + '/public'));

app.get('/:id', function(req, res) { res.sendFile(__dirname + '/public/doc.html'); });
// app.get('*',  function(req, res) { res.redirect('/'); });

http.listen(port, function() { console.log('Listening on http://localhost:' + port); });


// Set up share.js

sharejs.server.attach(app, {db: {type: 'none'}});
// var connection = new sharejs.client.Connection('http://localhost:' + port + '/channel');


// Set up socket.io

/*
var state = {
};

io.on('connection', function(socket) {

  log(socket.request.connection.remoteAddress + ' connected');
  io.emit('update', {userCount: ++state.userCount});

  socket.emit('update', state);

  // Once a client has connected, we expect to get a ping from them saying what room they want to join.
  socket.on('room', function(room) {
      socket.join(room);
  });

  socket.on('disconnect', function() {
    log(socket.request.connection.remoteAddress + ' disconnected');
    io.emit('update', {userCount: --state.userCount});
  });

});
*/


// Convenience functions

function log(msg) {
  console.log(msg);
  io.emit('log', msg);
}

function logError(msg) {
  console.error(msg);
  io.emit('error', msg);
}
