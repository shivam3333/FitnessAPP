(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function BlockUser(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "block_users";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(BlockUser, Model);

	// Extra functions related to this model...

	BlockUser.prototype.verify = function(post){
		return (
			typeof post.blocker != 'undefined' && 
			typeof post.blocked != 'undefined' &&
			typeof post.trainer_id != 'undefined' &&
			true
		);
	};

	module.exports = BlockUser;

})();