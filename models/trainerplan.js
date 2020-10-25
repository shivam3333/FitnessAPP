(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function TrainerPlan(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "trainerPlans";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(TrainerPlan, Model);

	// Extra functions related to this model...

	// ...

	TrainerPlan.prototype.verify = function(tp){
		return (
			typeof tp.label != 'undefined' &&
			typeof tp.trainer_id != 'undefined' &&
			typeof tp.description != 'undefined' &&
			(typeof tp.weeks != 'undefined' || typeof tp.days != 'undefined')
		);
	}

	module.exports = TrainerPlan;

})();