(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function ImageCategory(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "image_categories";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(ImageCategory, Model);

	// Extra functions related to this model...

	// ...

	ImageCategory.prototype.verify = function(data){
		return (
			typeof data.trainer_id != 'undefined' &&
			typeof data.label != 'undefined' &&
			typeof data.description != 'undefined'
			);
	}

	module.exports = ImageCategory;

})();