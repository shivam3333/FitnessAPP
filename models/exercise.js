(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function Exercise(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "exercises";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(Exercise, Model);

	// Extra functions related to this model...

	// ...

	Exercise.prototype.verify = function(ex){
		return (
			typeof ex.trainer_id != 'undefined' &&
			typeof ex.label != 'undefined' &&
			typeof ex.description != 'undefined'
			);
	}

	module.exports = Exercise;

})();