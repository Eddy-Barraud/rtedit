var express = require('express');
var sharejs = require('share');

var app = express();
var http = require('http').Server(app);
var port = process.argv[3] || process.env.PORT || 8080;

app.use('/', express.static(__dirname + '/public'));

app.get('/:id', function(req, res) { res.sendFile(__dirname + '/public/doc.html'); });

http.listen(port, function() { console.log('Listening on http://localhost:' + port); });

sharejs.server.attach(app, {db: {type: 'none'}});
