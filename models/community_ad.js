(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function CommunityAds(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "community_ads";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}
	util.inherits(CommunityAds, Model);

	// Extra functions related to this model...

	CommunityAds.prototype.verify = function(post){
		return (
			typeof post.title != 'undefined' &&
			typeof post.description != 'undefined' && 
			typeof post.start_date != 'undefined' && 
			typeof post.end_date != 'undefined' && 
			typeof post.adValue != 'undefined' && 
			typeof post.target_url != 'undefined' && 
			true
		);
	};

	module.exports = CommunityAds;

})();