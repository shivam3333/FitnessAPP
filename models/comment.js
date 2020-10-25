(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function Comment(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "comments";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(Comment, Model);

	// Extra functions related to this model...

	Comment.prototype.verify = function(post){
		return (
			typeof post.user_id != 'undefined' && 
			typeof post.post_id != 'undefined' &&
			typeof post.text != 'undefined' &&
			true
			);
	};

	module.exports = Comment;

})();