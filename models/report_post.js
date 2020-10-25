(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function ReportPost(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "report_posts";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(ReportPost, Model);

	// Extra functions related to this model...

	ReportPost.prototype.verify = function(post){
		return (
			typeof post.posted_by != 'undefined' && 
			typeof post.post_id != 'undefined' &&
			true
		);
	};

	module.exports = ReportPost;

})();