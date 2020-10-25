(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function UserFollow(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "userFollows";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(UserFollow, Model);

	// Extra functions related to this model...

	UserFollow.prototype.verify = function(follow_user){
		return (
			typeof follow_user.follower != 'undefined' && 
			typeof follow_user.following != 'undefined' &&
			true
			);
	};

	module.exports = UserFollow;

})();