;(function($) {
	$(document).ready(function() {
		if(!$.NODEHUB) {
			$.NODEHUB = {};

			$.NODEHUB.init = function() {
				$('.alert').hide();
			};

			$.NODEHUB.mongodb_objectid_add = function(objectid, offset) {
				return objectid.substr(0, 14) + (parseInt(objectid.substr(14), 16) + offset).toString(16);
			};

			$.NODEHUB.init();
		}
	});
})(jQuery);