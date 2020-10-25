(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function Trainer(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "trainers";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(Trainer, Model);

	// Extra functions related to this model...

	Trainer.prototype.verify = function(trainer){
		return (
			typeof trainer.name != 'undefined' &&
			// typeof trainer.description != 'undefined' &&
			typeof trainer.social_links != 'undefined' &&
			typeof trainer.email != 'undefined' &&
			typeof trainer.password != 'undefined' &&
			typeof trainer.contact_info != 'undefined' &&
			typeof trainer.app_info != 'undefined' &&
			true
			);
	};

	module.exports = Trainer;

})();