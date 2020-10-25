(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function NutritionPlan(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "nutritionPlans";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(NutritionPlan, Model);

	// Extra functions related to this model...

	// ...

	NutritionPlan.prototype.verify = function(np){
		return (
			typeof np.label != 'undefined' &&
			typeof np.trainer_id != 'undefined' &&
			typeof np.description != 'undefined' &&
			typeof np.summary != 'undefined' &&
			typeof np.weeks != 'undefined' && 
			typeof np.goals != 'undefined' && 
			typeof np.supplements != 'undefined'&&
			typeof np.faq != 'undefined'&&
			typeof np.liquid_options != 'undefined'
		);
	}

	module.exports = NutritionPlan;

})();