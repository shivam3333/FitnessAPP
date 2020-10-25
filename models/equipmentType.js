(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function EquipmentType(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "equipmentTypes";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(EquipmentType, Model);

	// Extra functions related to this model...

	// ...

	EquipmentType.prototype.verify = function(data){
		return (
			typeof data.name != 'undefined'
			);
	}

	module.exports = EquipmentType;

})();