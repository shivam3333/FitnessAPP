(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function NutritionWeek(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "nutritionWeeks";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(NutritionWeek, Model);

	// Extra functions related to this model...

	// ...

	NutritionWeek.prototype.verify = function(nw){
		return (
			typeof nw.trainer_id != 'undefined' && 
			typeof nw.nutritionplan_id != 'undefined' 
		);
	}

	module.exports = NutritionWeek;

})();