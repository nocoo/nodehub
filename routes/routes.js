/*
	nodehub
	@author  Zheng Li <lizheng@lizheng.me>
	@license MIT
	@version 0.1.0
*/

var tools   = require('./tools'),
	http    = require('http'),
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

// API: Edit server
exports.api.server_update = function(req, res) {
	if(!tools.check(req)) return res.json(tools.json_result(401));

	var data = { 
		'_id': req.body['d_id'],
		'name': req.body['d_name'],
		'address': req.body['d_address'],
		'port': req.body['d_port']
	};

	tools.log('[API] server_update', data);

	entity_update('server', data, function(code, result) {
		if(code !== 200) { tools.log('API Error', result); }
		res.json(tools.json_result(code, undefined, result));
	});
};

// API: Test a server
exports.api.server_test = function(req, res) {
	if(!tools.check(req)) return res.json(tools.json_result(401));

	var data = { '_id': req.body['d_id'] };

	entity_get('server', data['_id'], function(code, server) {
		if(code === 200) {
			tools.log('[API] server_test', server);
			var options = { 
				host: server['address'], 
				port: server['port'], 
				path: '/api/version?' + (new Date()).getTime(), 
				method: 'GET',
				label: server['label']
			};
			
			server_request(options, function(code, back) {
				res.json(tools.json_result(code, undefined, back));
			}, true);
		} else {
			res.json(tools.json_result(code, undefined, 'error'));
		}
	});
};

// Log a server request result.
var server_request_log = function(options, result, callback) {
	var log = result;
	
	log['host'] = options['host'];
	log['port'] = options['port'];
	log['path'] = options['path'];
	log['method'] = options['method'];
	log['label'] = options['label'];

	entity_add('server_log', log, function(code, result) {
		callback(code, result);
	});
};

// Make a server request.
var server_request = function(options, callback, is_json) {
	var result = {
		'latency': undefined,
		'status': 0,
		'headers': {},
		'response': '',
		'error': undefined
	};

	var start = (new Date()).getTime(), data = '';
	switch(options['method']) {
		case 'GET': {
			data = '';
			var request = http.get(options, function(response) {
				result['status'] = response.statusCode;
				result['headers'] = response.headers;

				response.on('end', function () {
					result['latency'] = (new Date()).getTime() - start;

					if(is_json) {
						try {
							result['response'] = JSON.parse(chunk);
						} catch(e) {}
					} else {
						result['response'] = chunk;
					}
					
					server_request_log(options, result, function() {
						callback(200, result);
					});
				});

				response.on('data', function (chunk) {
					data += chunk;
				});
			}).on("error", function(error) {
				request.abort();
				result['latency'] = (new Date()).getTime() - start;
				result['error'] = error;
				
				server_request_log(options, result, function() {
					callback(500, result);
				});
			});

			break;
		}
		case 'POST': {
			var timer;

			data = '';
			var request = http.request(options, function(response) {
				result['status'] = response.statusCode;
				result['headers'] = response.headers;

				response.setEncoding('utf8');
				response.on('data', function (chunk) {
					data += chunk;
				});

				response.on('end', function() {
					result['latency'] = (new Date()).getTime() - start;

					clearTimeout(timer);

					if(is_json) {
						try {
							result['response'] = JSON.parse(data);
						} catch(e) {}
					} else {
						result['response'] = data;
					}
					
					callback(200, result);
				});
			});

			request.on("error", function(error) {
				result['latency'] = (new Date()).getTime() - start;
				if(result['latency'] >= tools.TIMEOUT && error['code'] === 'ECONNRESET') {
					result['error'] = 'Gateway Timeout.';
					return callback(504, result);
				} else {
					result['error'] = 'General HTTP Error';
					return callback(500, result);
				}
			});

			request.end();

			timer = setTimeout(function() {
				request.abort();
				delete timer;
			}, tools.TIMEOUT);

			break;
		}
		default: {
			callback(501, 'Not Implemented');
			break;
		}
	}
};

// Entity operations, Get an entity.
var entity_get = function(name, id, callback) {
	if(!name || !id) {
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

			collection.findOne({ '_id': new ObjectID(id) }, function(error, entity) {
				db.close();
				if(error) {
					return callback(506, error);
				}

				return callback(200, entity);
			});
		});
	});
};

// Entity operations, Add an entity.
var entity_add = function(name, entity, callback) {
	if(!name || !entity) {
		return callback(400, 'Bad Request');
	}

	entity['create_at_timestamp'] = (new Date()).getTime();
	entity['create_at'] = tools.timestamp();
	tools.dbopen(function(error, db) {
		if(error) {
			db.close();
			return callback(506, error);
		}

		db.collection(name + 's', function(error, collection) {
			if(error) {
				db.close();
				return callback(506, error);
			}

			collection.insert(entity, { safe: false }, function(error, result) {
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

// Entity operations, List entities.
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

// Entity operations, Delete an entity.
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

// Entity operations, Update an entity.
var entity_update = function(name, entity, callback) {
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

			var ObjectID = mongodb.ObjectID, id = entity['_id'];

			delete entity['id'];
			var todo = [];
			for(var property in entity) if(!entity[property]) todo.push(property);
			for(var i = 0; i < todo.length; ++i) delete entity[todo[i]];

			entity['update_at_timestamp'] = (new Date()).getTime();
			entity['update_at'] = tools.timestamp();
			delete entity['_id'];

			collection.update({ '_id': new ObjectID(id) }, { $set: entity }, { safe: true }, function(error, affected) {
				db.close();
				if(error) {
					return callback(506, error);
				}

				tools.log('Entity "' + name + '" updated, affected: ' + affected);
				return callback(200, entity);
			});
		});
	});
};