(function(){

const path = require('path');
const fs = require('fs');
var config = {
	routeDir: path.dirname(require.main.filename) + path.sep + "routes",
	indexController: 'index'
};

module.exports = function(options){

	if(typeof options.routeDir != 'undefined'){
		config.routeDir = options.routeDir;
	}

	if(config.routeDir.lastIndexOf(path.sep) !== (config.routeDir.length - path.sep.length)){
		config.routeDir += path.sep;
	}

	if(typeof options.indexController != 'undefined'){
		config.indexController = (options.indexController).toLowerCase();
	}

	return module.exports;

};

function loadRoutes(app, dir){
	var dir = dir || config.routeDir;

	var files = fs.readdirSync(dir);//, function(err, files){
	for(var i=0; i<files.length; i++){
		var file = dir+files[i];
		if(fs.statSync(file).isDirectory()){
			loadRoutes(app, file+path.sep);
		}else{
			var controller = file.replace(new RegExp(config.routeDir, "g"), "").replace(/\.[^.]*$/, '').replace(/\bindex$/, '');
			var route = require(file);

			controller = route.controller || controller;

			controller = (controller+"").toLowerCase();

			if(controller === config.indexController || controller === '' || controller === '/'){
				app.use("/", route);
			}else{
				app.use("/"+controller, route);
			}
		}
	}
	//});
}

module.exports.loadRoutes = loadRoutes;

})();