(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function QuestionCategory(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "question_categories";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(QuestionCategory, Model);

	// Extra functions related to this model...

	// ...

	QuestionCategory.prototype.verify = function(data){
		return (
			typeof data.trainer_id != 'undefined' &&
			typeof data.label != 'undefined'
			);
	}

	module.exports = QuestionCategory;

})();