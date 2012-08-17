;(function($) {
	$(document).ready(function() {
		if(!$.NODEHUB) {
			$.NODEHUB = {};

			$.NODEHUB.init = function() {
				$('.alert').hide();
				$('.b-mask').hide();
			};

			$.NODEHUB.mongodb_objectid_add = function(objectid, offset) {
				return objectid.substr(0, 14) + (parseInt(objectid.substr(14), 16) + offset).toString(16);
			};

			$.NODEHUB.alert = function(message, title, level) {
				var timer;

				if(!message || $('.alert').length === 0) return;

				title = title || 'Message';
				level = level || 'info';
				title += ' ';

				$('.alert strong').text(title);
				$('.alert span').text(message);
				$('.alert').removeClass('alert-success alert-info alert-error');
				$('.alert').addClass('alert-' + level);

				$('.alert').show('fast');

				$('.alert button.close').off('click');
				$('.alert button.close').on('click', function() { 
					$('.alert').hide('fast'); 
					clearTimeout(timer);
				});

				timer = setTimeout(function() { $('.alert').hide('fast'); }, 3000);
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

			var lock = false, timer, speed = 200;
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