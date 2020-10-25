(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function Admin(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "admins";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(Admin, Model);

	// Extra functions related to this model...

	Admin.prototype.verify = function(adm){
		return (
			typeof adm.user != 'undefined' &&
			typeof adm.pass != 'undefined' &&
			typeof adm.name != 'undefined' &&
			true
			);
	};

	module.exports = Admin;

})();