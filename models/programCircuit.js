(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function ProgramCircuit(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "programCircuits";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(ProgramCircuit, Model);

	// Extra functions related to this model...

	// ...

	ProgramCircuit.prototype.verify = function(ex){
		return (
			typeof ex.trainer_id != 'undefined' &&
			typeof ex.org_id != 'undefined' &&
			typeof ex.user_id != 'undefined'
			);
	}

	module.exports = ProgramCircuit;

})();