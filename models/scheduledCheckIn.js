(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function ScheduledCheckin(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "scheduledCheckin";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(ScheduledCheckin, Model);

	// Extra functions related to this model...

	// ...

	ScheduledCheckin.prototype.verify = function(ex){
		return (
			typeof ex.trainer_id != 'undefined' &&
			typeof ex.org_id != 'undefined' &&
			typeof ex.user_id != 'undefined'
			);
	}

	module.exports = ScheduledCheckin;

})();