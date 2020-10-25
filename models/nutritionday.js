(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function NutritionDay(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "nutritionDays";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(NutritionDay, Model);

	// Extra functions related to this model...

	// ...

	NutritionDay.prototype.verify = function(nw){
		return (
			typeof nw.trainer_id != 'undefined' 
		);
	}

	module.exports = NutritionDay;

})();