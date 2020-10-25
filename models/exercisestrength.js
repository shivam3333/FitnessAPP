(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function ExerciseStrength(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "exercise_strengths";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(ExerciseStrength, Model);

	// Extra functions related to this model...

	// ...

	ExerciseStrength.prototype.verify = function(ex){
		return (
			typeof ex.trainer_id != 'undefined' &&
			typeof ex.label != 'undefined' &&
			typeof ex.strength != 'undefined'
			);
	}

	module.exports = ExerciseStrength;

})();