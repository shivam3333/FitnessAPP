(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function TrainerDashboard(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "trainerDashboards";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(TrainerDashboard, Model);

	// Extra functions related to this model...

	// ...

	TrainerDashboard.prototype.verify = function(tr){
		return (
			typeof tr.trainer_id != 'undefined'
		);
	}

	module.exports = TrainerDashboard;

})();