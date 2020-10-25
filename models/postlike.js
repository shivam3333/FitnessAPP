(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function PostLike(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "postLikes";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(PostLike, Model);

	// Extra functions related to this model...

	PostLike.prototype.verify = function(data){
		return (
			typeof data.user_id != 'undefined' && 
			typeof data.post_id != 'undefined' &&
			true
			);
	};

	module.exports = PostLike;

})();