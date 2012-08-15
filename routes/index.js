/*
	nodehub
	@author  Zheng Li <lizheng@lizheng.me>
	@license MIT
	@version 0.1.0
*/

exports.login = function(req, res) {
  res.render('public.login.jade', { title: 'Login' });
};