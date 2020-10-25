(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function BodyPart(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "bodyparts";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(BodyPart, Model);

	// Extra functions related to this model...

	// ...

	BodyPart.prototype.verify = function(bp){
		return (
			typeof bp.label != 'undefined' && 
			typeof bp.trainer_id != 'undefined'
			);
	}

	module.exports = BodyPart;

})();