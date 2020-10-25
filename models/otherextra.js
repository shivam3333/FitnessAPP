(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function OtherExtra(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "other_extras";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(OtherExtra, Model);

	// Extra functions related to this model...

	// ...

	OtherExtra.prototype.verify = function(data){
		return (
			typeof data.trainer_id != 'undefined' &&
			typeof data.label != 'undefined' &&
			data.label != '' &&
			typeof data.description != 'undefined' && 
			data.description != ''
			);
	}

	module.exports = OtherExtra;

})();