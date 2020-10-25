(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function PushNotification(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "notifications";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(PushNotification, Model);

	// Extra functions related to this model...

	PushNotification.prototype.verify = function(notification_data){
		return (
			typeof notification_data.title != 'undefined' && 
			typeof notification_data.message != 'undefined' && 
			typeof notification_data.button_title != 'undefined' && // can be follow_request, comment  
			typeof notification_data.button_action != 'undefined' &&
			true
			);
	};

	PushNotification.prototype.verifyPn = function(notification_data){
		return (
			typeof notification_data.title != 'undefined' && 
			typeof notification_data.message != 'undefined' && 
			true
			);
	};

	module.exports = PushNotification;

})();