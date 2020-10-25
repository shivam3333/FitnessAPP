(function(){
	const path = require('path');
	const util = require('util');

	var Model = require(".");

	function MusicExtra(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "music_extras";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(MusicExtra, Model);

	// Extra functions related to this model...

	// ...

	MusicExtra.prototype.verify = function(data){
		return (
			typeof data.trainer_id != 'undefined' &&
			typeof data.label != 'undefined' &&
			typeof data.description != 'undefined'
			);
	}

	module.exports = MusicExtra;

})();