(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function ProgramNotification(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "programNotifications";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(ProgramNotification, Model);

	// Extra functions related to this model...

	// ...

	ProgramNotification.prototype.verify = function(data){
		return (
			typeof data.trainer_id != 'undefined' &&
			typeof data.org_id != 'undefined' &&
      typeof data.user_id != 'undefined' &&
      typeof data.message != 'undefined' &&
      typeof data.delivery_date != 'undefined'
		);
	}

	module.exports = ProgramNotification;

})();
