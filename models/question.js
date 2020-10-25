(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function Question(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "questions";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(Question, Model);

	// Extra functions related to this model...

	// ...

	Question.prototype.verify = function(data){
		return (
			typeof data.trainer_id != 'undefined' &&
			typeof data.question != 'undefined' &&
			typeof data.type != 'undefined'
			);
	}

	module.exports = Question;

})();