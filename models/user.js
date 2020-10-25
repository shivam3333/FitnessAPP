(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function User(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "users";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(User, Model);

	// Extra functions related to this model...

	User.prototype.verify = function(user){
		return (
			typeof user.email != 'undefined' && 
			typeof user.password != 'undefined' &&
			true
			);
	};

	module.exports = User;

})();