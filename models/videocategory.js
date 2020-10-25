(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function VideoCategory(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "video_categories";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(VideoCategory, Model);

	// Extra functions related to this model...

	// ...

	VideoCategory.prototype.verify = function(data){
		return (
			typeof data.trainer_id != 'undefined' &&
			typeof data.label != 'undefined' &&
			typeof data.description != 'undefined'
			);
	}

	module.exports = VideoCategory;

})();