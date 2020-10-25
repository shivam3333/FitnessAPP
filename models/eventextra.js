(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function EventExtra(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "event_extras";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(EventExtra, Model);

	// Extra functions related to this model...

	// ...

	EventExtra.prototype.verify = function(data){
		return (
			typeof data.trainer_id != 'undefined' &&
			typeof data.label != 'undefined' &&
			typeof data.description != 'undefined'
			);
	}

	module.exports = EventExtra;

})();