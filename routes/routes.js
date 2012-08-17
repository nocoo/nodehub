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

	tools.DB.open(function(error, db) {
		if(error) {
			tools.log('DB Error', error);
			return res.json(tools.json_result(506));
		}

		db.collection('logs', function(error, collection) {
			if(error) {
				tools.log('DB Error', error);
				return res.json(tools.json_result(506));
			}

			var cursor, ObjectID = mongodb.ObjectID, result = { 'docs': [] };
			var criteria = { '_id': { '$lte': new ObjectID(data.last_id) } };
			
			cursor = collection.find(criteria);	
			cursor.sort({ '_id': -1 }).limit(tools.PER_PAGE_COUNT).toArray(function(error, docs) {
				if(error) {
					tools.log('DB Error', error);
					return res.json(tools.json_result(506));
				}

				result['docs'] = docs;
				res.json(tools.json_result(200, undefined, result));
				db.close();
			});
		});
	});
};