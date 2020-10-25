(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function WorkoutDay(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "workoutdays";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(WorkoutDay, Model);

	// Extra functions related to this model...

	// ...

	WorkoutDay.prototype.verify = function(ex){
		return (
			typeof ex.trainer_id != 'undefined' &&
			typeof ex.plan_id != 'undefined' &&
			typeof ex.label != 'undefined' &&
			typeof ex.description != 'undefined' &&				
			typeof ex.workout != 'undefined' && 	
			(
				
				typeof ex.week != 'undefined' ||
				typeof ex.weekday != 'undefined'
			)
		);
	}

	module.exports = WorkoutDay;

})();