(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function WorkoutdayNotes(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "workoutday_notes";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}
	util.inherits(WorkoutdayNotes, Model);

	// Extra functions related to this model...

	WorkoutdayNotes.prototype.verify = function(post){
		return (
			typeof post.posted_by != 'undefined' &&
			typeof post.notes != 'undefined' &&
			typeof post.workoutday_id != 'undefined' &&
			true
		);
	};

	module.exports = WorkoutdayNotes;

})();