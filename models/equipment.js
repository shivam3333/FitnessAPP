(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function Equipment(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "equipments";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(Equipment, Model);

	// Extra functions related to this model...

	// ...

	Equipment.prototype.verify = function(eq){
		return (
			typeof eq.label != 'undefined' && 
			typeof eq.description != 'undefined' && 
			typeof eq.type != 'undefined' && 
			typeof eq.trainer_id != 'undefined'
			);
	}

	module.exports = Equipment;

})();