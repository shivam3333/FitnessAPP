(function(){
	const path = require('path');

	const MongoClient = require('mongodb').MongoClient;

	const dbconfig = require(path.dirname(require.main.filename) + path.sep + 'config' + path.sep + 'dbconfig.json');

	var mongodb_connection = null;

	function initDB(options, callback){
		options = options || {};
		if(mongodb_connection && !options.force) {
			return;
		}
		MongoClient.connect("mongodb://"+dbconfig.host+":"+dbconfig.port+"/"+dbconfig.dbname, function(err, db){
		// MongoClient.connect(dbconfig.connectionString, function(err, db){
			if(err){
				console.error("DB connection failed!!");
				if(typeof callback === 'function'){
					callback(err);
				}else{
					throw new Error("DB connection failed!!");
				}
			}else {
				if(typeof callback === 'function'){
					mongodb_connection = db;
					callback(err, db);
				}
			}
		});
	};

	module.exports.initDB = initDB;

	module.exports.getDB = function(options, callback){
		if(mongodb_connection) {
			if(typeof callback === 'function'){
				callback(undefined, mongodb_connection);
			}
		}else{
			initDB(null, function(err, db){
				if(typeof callback === 'function'){
					callback(err, db);
				}
			});
		}
		return mongodb_connection;
	};

})();