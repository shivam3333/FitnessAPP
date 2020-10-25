(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function GetNotification(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "get_notifications";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(GetNotification, Model);

	// Extra functions related to this model...

	GetNotification.prototype.verify = function(notification_data){
		return (
			typeof notification_data.type != 'undefined' && 
			typeof notification_data.sub_type != 'undefined' && // can be follow_request, comment  
			typeof notification_data.user_id != 'undefined' &&
			typeof notification_data.data != 'undefined' &&
			true
			);
	};
	
	GetNotification.prototype.verifyView = function(notification_data){
		return (
			typeof notification_data.type != 'undefined' && 
			typeof notification_data.sub_type != 'undefined' && // can be follow_request, comment  
			typeof notification_data.user_id != 'undefined' &&
			typeof notification_data.trainer_id != 'undefined' &&
			true
			);
	};

	module.exports = GetNotification;

})();