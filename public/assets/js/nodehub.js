;(function($) {
	$(document).ready(function() {
		if(!$.NODEHUB) {
			$.NODEHUB = {};

			var alert_timer;

			$.NODEHUB.init = function() {
				$('.alert').hide();
				$('.b-mask').hide();
			};

			$.NODEHUB.guid = function(type) {
				var S4 = function() { return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1); };
						
				if(type === 'long') {
					return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
				} else {
					return (S4()+S4());
				}
			};

			$.NODEHUB.mongodb_objectid_add = function(objectid, offset) {
				return objectid.substr(0, 14) + (parseInt(objectid.substr(14), 16) + offset).toString(16);
			};

			$.NODEHUB.prompt = function(message, title, level, on_confrim, on_cancel) {
				if(!message || $('.alert').length === 0) return;

				title = title || 'Message';
				level = level || 'info';
				title += ' ';

				clearTimeout(alert_timer);

				$('.alert div.inline').css('display', 'none');
				$('.alert div.block').css('display', 'block');
				$('.alert .action').css('display', 'block');

				$('.alert strong').text(title);
				$('.alert span').text(message);
				$('.alert').removeClass('alert-success alert-info alert-error alert-warning');
				$('.alert').addClass('alert-' + level);

				$('.alert .action a.action-ok').removeClass('btn-success btn-info btn-danger btn-warning');
				switch(level) {
					case 'info': {
						$('.alert .action a.action-confrim').addClass('btn-info');
						break;
					}
					case 'success': {
						$('.alert .action a.action-confrim').addClass('btn-success');
						break;
					}
					case 'warning': {
						$('.alert .action a.action-confrim').addClass('btn-warning');
						break;
					}
					case 'error': {
						$('.alert .action a.action-confrim').addClass('btn-danger');
						break;
					}
					default: {
						break;
					}
				}

				$('.alert').show('fast');

				$('.alert button.close, .alert .action-cancel').off('click');
				$('.alert button.close, .alert .action-cancel').on('click', function() { 
					$('.alert').hide('fast');
					if(on_cancel && (typeof on_cancel) === 'function') on_cancel();
				});

				$('.alert .action-confrim').off('click');
				$('.alert .action-confrim').on('click', function() { 
					$('.alert').hide('fast');
					if(on_confrim && (typeof on_confrim) === 'function') on_confrim();
				});
			};

			$.NODEHUB.alert = function(message, title, level) {
				if(!message || $('.alert').length === 0) return;

				title = title || 'Message';
				level = level || 'info';
				title += ' ';

				$('.alert div.inline').css('display', 'block');
				$('.alert div.block').css('display', 'none');
				$('.alert .action').css('display', 'none');

				$('.alert strong').text(title);
				$('.alert span').text(message);
				$('.alert').removeClass('alert-success alert-info alert-error');
				$('.alert').addClass('alert-' + level);

				$('.alert').show('fast');

				$('.alert button.close').off('click');
				$('.alert button.close').on('click', function() { 
					$('.alert').hide('fast'); 
					clearTimeout(alert_timer);
				});

				alert_timer = setTimeout(function() { $('.alert').hide('fast'); }, 3000);
			};

			$.NODEHUB.window = function(width, height) {
				$('.b-window').css('width', width);
				$('.b-window').css('height', height);
				$('.b-window').css('margin-left', 0 - width / 2);
				$('.b-window').css('margin-top', 0 - height / 2);

				$('.b-mask').off('click');
				$('.b-mask').on('click', function(evt) {
					$.NODEHUB.window_hide();
				});

				$('.b-window').off('click');
				$('.b-window').on('click', function(evt) {
					evt.preventDefault();
					evt.stopPropagation();
				});
			};

			var lock = false, timer, speed = 100;
			$.NODEHUB.window_show = function() {
				if(lock) return;

				$('.b-mask').css('opacity', 0);
				$('.b-mask').show();
				lock = true;

				$('.b-mask').stop();
				$('.b-mask').animate({
					'opacity': 1
				}, speed, function() {
					lock = false;
				});
			};

			$.NODEHUB.window_hide = function() {
				if(lock) return;

				lock = true;
				
				$('.b-mask').stop();
				$('.b-mask').animate({
					'opacity': 0
				}, speed, function() {
					lock = false;
					$('.b-mask').hide();
				});
			};

			$.NODEHUB.init();
		}
	});
})(jQuery);