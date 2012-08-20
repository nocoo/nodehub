/*
	nodehub
	@author  Zheng Li <lizheng@lizheng.me>
	@license MIT
	@version 0.1.0
*/

var tools   = require('./tools'),
	mongodb = require('mongodb');

/* == Public Area == */
exports.login = function(req, res) {
	res.render('public.login.jade', { 'title': 'Login' });
};

exports.logout = function(req, res) {
	req.session.admin = undefined;
	res.redirect('/login');
};

/* == Admin == */
exports.admin = {};

exports.admin.dashboard = function(req, res) {
	if(tools.check(req)) {
		res.render(
			'admin.dashboard.jade', 
			{
				'title': 'Dashboard', 
				'admin': req.session.admin
			}
		);
	} else {
		res.redirect('/login');
	}
};

exports.admin.servers = function(req, res) {
	if(tools.check(req)) {
		res.render(
			'admin.servers.jade', 
			{
				'title': 'Hub Servers', 
				'admin': req.session.admin
			}
		);
	} else {
		res.redirect('/login');
	}
};

exports.admin.services = function(req, res) {
	if(tools.check(req)) {
		res.render(
			'admin.services.jade', 
			{
				'title': 'Services', 
				'admin': req.session.admin
			}
		);
	} else {
		res.redirect('/login');
	}
};

exports.admin.logs = function(req, res) {
	if(tools.check(req)) {
		res.render(
			'admin.logs.jade', 
			{
				'title': 'Logs', 
				'admin': req.session.admin
			}
		);
	} else {
		res.redirect('/login');
	}
};


/* == APIs == */
exports.api = {};

// API: Version
exports.api.version = function(req, res) {
	tools.log('[API] version', tools.reqinfo(req));
	res.json({
		'name': 'NodeHub Service',
		'version': tools.VERSION,
		'port': tools.PORT
	});
};

// API: Login
exports.api.login = function(req, res) {
	var data = {
		'd_username': req.body['d_username'],
		'd_password': req.body['d_password']
	};

	//console.log(data);

	// Check post data.
	if(!data['d_username'] || !data['d_password'] || data['d_password'] == 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855') {
		tools.log('Login failed', [ data, tools.reqinfo(req) ]);
		return res.json(tools.json_result(400));
	}

	// Test.
	if(data['d_username'] == 'admin' && data['d_password'] == '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918') {
		tools.log('Login success', [ data['d_username'], tools.reqinfo(req) ]);

		if(req.session.admin && req.session.admin['username'] == data['d_username']) {
			// Retain session.
			req.session.admin['check_at'] = (new Date).getTime();
		} else {
			// New session.
			req.session.admin = {
				'token': tools.guid(),
				'username': data['d_username'],
				'login_at': (new Date).getTime(),
				'check_at': (new Date).getTime()
			};
		}
		
		//console.log(req.session.admin);

		return res.json(tools.json_result(200, undefined, { 'token': req.session.admin['token'] }));
	} else {
		tools.log('Login failed', [ data, tools.reqinfo(req) ]);
		return res.json(tools.json_result(403));
	}
};

// API: Logs list
exports.api.log_list = function(req, res) {
	if(!tools.check(req)) return res.json(tools.json_result(401));

	var data = {
		'last_id': req.body['last_id'] || 'ffffffffffffffffffffffff'
	};

	tools.log('[API] log_list', data);

	entity_list('log', data['last_id'], function(code, result) {
		if(code !== 200) { tools.log('API Error', result); }
		res.json(tools.json_result(code, undefined, result));
	});
};

// API: Add server
exports.api.server_add = function(req, res) {
	if(!tools.check(req)) return res.json(tools.json_result(401));

	var data = {
		'name': req.body['d_name'],
		'address': req.body['d_address'],
		'port': req.body['d_port'],
		'label': tools.guid()
	};

	tools.log('[API] server_add', data);

	entity_add('server', data, function(code, result) {
		if(code !== 200) { tools.log('API Error', result); }
		res.json(tools.json_result(code, undefined, result));
	});
};

// API: List server
exports.api.server_list = function(req, res) {
	if(!tools.check(req)) return res.json(tools.json_result(401));

	tools.log('[API] server_list');

	entity_list('server', undefined, function(code, result) {
		if(code !== 200) { tools.log('API Error', result); }
		res.json(tools.json_result(code, undefined, result));
	});
};

// API: Delete server
exports.api.server_delete = function(req, res) {
	if(!tools.check(req)) return res.json(tools.json_result(401));

	var data = { '_id': req.body['d_id'] };

	tools.log('[API] server_delete', data);

	entity_delete('server', data, function(code, result) {
		if(code !== 200) { tools.log('API Error', result); }
		res.json(tools.json_result(code, undefined, result));
	});
};

var entity_add = function(name, entity, callback) {
	if(!name || !entity) {
		return callback(400, 'Bad Request');
	}

	entity['time'] = (new Date()).getTime();
	entity['time_string'] = tools.timestamp();
	tools.dbopen(function(error, db) {
		if(error) {
			return callback(506, error);
		}

		db.collection(name + 's', function(error, collection) {
			if(error) {
				return callback(506, error);
			}

			collection.insert(entity, { safe: true }, function(error, result) {
				db.close();

				if(error) {
					return callback(506, error);
				}

				tools.log('Entity "' + name + '" added', result);
				return callback(200, result);
			});
		});
	});
};

var entity_list = function(name, last_id, callback) {
	if(!name) {
		return callback(400, 'Bad Request');
	}

	tools.dbopen(function(error, db) {
		if(error) {
			return callback(506, error);
		}

		db.collection(name + 's', function(error, collection) {
			if(error) {
				return callback(506, error);
			}

			var cursor, ObjectID = mongodb.ObjectID, criteria;

			if(last_id) {
				// Paging.
				criteria = { '_id': { '$lte': new ObjectID(last_id) } };
				cursor = collection.find(criteria);
				cursor.sort({ '_id': -1 }).limit(tools.PER_PAGE_COUNT).toArray(function(error, docs) {
					db.close();
					if(error) { return callback(506, error); }
					return callback(200, docs);
				});
			} else {
				// No paging.
				cursor = collection.find();
				cursor.sort({ '_id': -1 }).toArray(function(error, docs) {
					db.close();
					if(error) { return callback(506, error); }
					return callback(200, docs);
				});
			}
		});
	});
};

var entity_delete = function(name, entity, callback) {
	if(!name || !entity) {
		return callback(400, 'Bad Request');
	}

	tools.dbopen(function(error, db) {
		if(error) {
			return callback(506, error);
		}

		db.collection(name + 's', function(error, collection) {
			if(error) {
				return callback(506, error);
			}

			var ObjectID = mongodb.ObjectID;

			collection.remove({ '_id': new ObjectID(entity['_id']) }, { safe: true }, function(error, result) {
				db.close();

				if(error) {
					return callback(506, error);
				}

				tools.log('Entity "' + name + '" removed, affected: ', result);
				return callback(200, result);
			});
		});
	});
};