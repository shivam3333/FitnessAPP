(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function ImageExtra(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "image_extras";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(ImageExtra, Model);

	// Extra functions related to this model...

	// ...

	ImageExtra.prototype.verify = function(data){
		return (
			typeof data.trainer_id != 'undefined' &&
			typeof data.label != 'undefined' &&
			typeof data.description != 'undefined'
			);
	}

	module.exports = ImageExtra;

})();