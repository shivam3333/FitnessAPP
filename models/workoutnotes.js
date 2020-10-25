(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function WorkoutNotes(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "workout_notes";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(WorkoutNotes, Model);

	// Extra functions related to this model...

	WorkoutNotes.prototype.verify = function(post){
		return (
			typeof post.posted_by != 'undefined' &&
			typeof post.notes != 'undefined' &&
			typeof post.workout_id != 'undefined' &&
			true
		);
	};

	module.exports = WorkoutNotes;

})();