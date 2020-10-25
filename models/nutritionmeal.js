(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function NutritionMeal(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "nutritionMeals";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(NutritionMeal, Model);

	// Extra functions related to this model...

	// ...

	NutritionMeal.prototype.verify = function(np){
		return (
			typeof np.name != 'undefined' &&
			typeof np.trainer_id != 'undefined'
		);
	};

	NutritionMeal.prototype.loadMeal = function(mealId, callback){
		var nModel = this;
		if(!mealId){
			return callback("Invalid Meal id: "+mealId);
		}
		nModel.find({_id: Model.ObjectID(mealId)}).limit(1).next(function(err, meal){
			if(err){
				return callback(err);
			}else if(!meal){
				return callback("Not found: "+mealId);
			}else{
				callback(undefined, meal);
			}
		});
	};

	module.exports = NutritionMeal;

})();