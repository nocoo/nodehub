/*
	nodehub
	@author  Zheng Li <lizheng@lizheng.me>
	@license MIT
	@version 0.1.0
*/

var express = require('express'),
	routes  = require('./routes'),
	http 	= require('http');

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 17755);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.get('/', routes.login);
app.get('/login', routes.login);

http.createServer(app).listen(app.get('port'), function(){
	console.log("NodeHub server listening on port " + app.get('port'));
});
