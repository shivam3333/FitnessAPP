(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function Post(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "posts";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(Post, Model);

	// Extra functions related to this model...

	Post.prototype.verify = function(data){
		return (
			typeof data.user_id != 'undefined' && 
			data.user_id !="" && 
			typeof data.status != 'undefined' &&
			true
			);
	};

	module.exports = Post;

})();