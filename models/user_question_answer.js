(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function UserQuestionAnswer(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "user_question_answers";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(UserQuestionAnswer, Model);

	// Extra functions related to this model...

	// ...

	UserQuestionAnswer.prototype.verify = function(data){
		return (
			typeof data.user_id != 'undefined' &&
			typeof data.question_id != 'undefined' &&
			typeof data.user_answer != 'undefined'
			);
	}

	module.exports = UserQuestionAnswer;

})();