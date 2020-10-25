(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function UserRating(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "ratings";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(UserRating, Model);

	// Extra functions related to this model...

	// ...

	UserRating.prototype.verify = function(data){
		return (
			typeof data.user_id != 'undefined' &&
			typeof data.trainer_id != 'undefined' 
			);
	}

	module.exports = UserRating;

})();