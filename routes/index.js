(function (){
	var express = require('express');
	var router = express.Router();

	
	router.get('/', function(req, res, next) {
	  	res.json({
            error: true,
            message: "Unauthorized",
            responseCode: 0
        });
        res.end();
	});

	module.exports = router;

	// Optionally set a different controller name...this defaults to current file path, excluding base route dir path and file extension.
	// So, for a file, /routes/foo/bar/foobar.js, where /routes/ is base route dir, controller will default to foo/bar/foobar
	// Also, if some file is named index.js, then the full name is ignored, but the path is taken into consideration for defining controller name

	//module.exports.controller = "";
})();