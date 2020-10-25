(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function Test(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "test";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(Test, Model);

	// Extra functions related to this model...

	Test.prototype.verify = function(id, pass){
		return this.load({user: id, pass: Model.password(pass)});
	};

	module.exports = Test;

})();