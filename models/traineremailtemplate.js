(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function TrainerEmailTemplate(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "trainerEmailTemplates";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(TrainerEmailTemplate, Model);

	// Extra functions related to this model...

	// ...

	TrainerEmailTemplate.prototype.verify = function(bp){
		return (
			typeof bp.label != 'undefined' && 
			typeof bp.subject != 'undefined' && 
			typeof bp.trainer_id != 'undefined' &&
			typeof bp.description != 'undefined'
			);
	}

	module.exports = TrainerEmailTemplate;

})();