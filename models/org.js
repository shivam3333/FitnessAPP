(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function Org(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "orgs";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(Org, Model);

	// Extra functions related to this model...

	// ...

	Org.prototype.verify = function(data){
		return (
			typeof data.name != 'undefined'
			);
	}

	module.exports = Org;

})();