/*
	nodehub
	@author  Zheng Li <lizheng@lizheng.me>
	@license MIT
	@version 0.1.0
*/

var express = require('express'),
	routes  = require('./routes/routes'),
	http 	= require('http'),
	tools   = require('./routes/tools');

var app = express();

app.use(express.cookieParser());
app.use(express.session({ secret: 'af3ea5b7e6de7ef940cb2b09752233849a08b26f40207202027252b7aa57fc5f', maxAge: tools.SESSION_MAX_AGE }));

app.configure(function(){
	app.set('port', tools.PORT);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

/* Public Area */
app.get('/', routes.login);
app.get('/login', routes.login);
app.get('/logout', routes.logout);

/* Admin */
app.get('/admin', routes.admin.dashboard);
app.get('/admin/dashboard/:token', routes.admin.dashboard);
app.get('/admin/servers/:token', routes.admin.servers);
app.get('/admin/services/:token', routes.admin.services);

app.get('/admin/logs/:token', routes.admin.logs);

/* APIs */
app.get('/api/version', routes.api.version);
app.post('/api/version', routes.api.version);
app.post('/api/login', routes.api.login);
app.post('/api/log-list', routes.api.log_list);
app.post('/api/server-add', routes.api.server_add);
app.post('/api/server-list', routes.api.server_list);
app.post('/api/server-delete', routes.api.server_delete);
app.post('/api/server-update', routes.api.server_update);
app.post('/api/server-test', routes.api.server_test);

http.createServer(app).listen(app.get('port'), function(){
	tools.log("NodeHub server listening on port " + app.get('port'));
});
