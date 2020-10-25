(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function BeforeafterImage(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "beforeafter_images";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(BeforeafterImage, Model);

	// Extra functions related to this model...

	// ...

	BeforeafterImage.prototype.verify = function(data){
		return (
			typeof data.trainer_id != 'undefined' &&
			typeof data.label != 'undefined' &&
			typeof data.description != 'undefined'
			);
	}

	module.exports = BeforeafterImage;

})();