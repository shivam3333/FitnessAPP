(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function ProgramWorkoutDay(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "programDays";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(ProgramWorkoutDay, Model);

	// Extra functions related to this model...

	// ...

	ProgramWorkoutDay.prototype.verify = function(ex){
		return (
			typeof ex.trainer_id != 'undefined' &&
			typeof ex.org_id != 'undefined' &&
			typeof ex.user_id != 'undefined'
			);
	}

	module.exports = ProgramWorkoutDay;

})();