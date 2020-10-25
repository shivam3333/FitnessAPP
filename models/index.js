// Base level model for handling all db related queries...

(function(){

const gm = require("gm");
const path = require('path');
const util = require('util');
const crypto = require('crypto');
const fs = require('fs');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const config = require(path.dirname(require.main.filename) + path.sep + 'config' + path.sep + 'index.json');

var mongodb = require(path.join(path.dirname(require.main.filename),'db.js'));

var AWS = require('aws-sdk');

AWS.config.loadFromPath(path.join(path.dirname(require.main.filename),'s3_config.json')); 

var s3 = new AWS.S3();

var PushNotification = new require('node-pushnotifications');

function Model(options, callback){
	var model = this;

	model.db = null;
	model.isReady = false;
	model.collection = null;

	if(typeof options != "object"){
		options = {
			collectionName: options+"" // Convert whatever there is inside options into String
		};
	}

	model.collectionName = options.collectionName || "collection";

	mongodb.getDB(null, function(err, db){
		if(err){
			if(typeof callback === 'function') {
				callback(err);
			}else{
				throw err;
			}
		}else {
			model.db = db;
			model.collection = db.collection(model.collectionName);
			model.isReady = true;
			if(typeof callback === 'function') {
				callback(err, model);
			}
		}
	});

	if(typeof options.sync != 'undefined' && options.sync){
		while(!model.isReady){
			//... preferrably sleep for some millis
		}
	}
}

Model.prototype.find = function(query, callback){
	if(this.isReady){
		return this.collection.find(query, callback);
	}
	return false;
};

Model.prototype.findOne = function(query, options, callback){
	if(this.isReady){
		return this.collection.findOne(query, options, callback);
	}
	return false;
};

Model.prototype.findAndModify = function(query, sort, doc, options, callback){
	if(this.isReady){
		return this.collection.findAndModify(query, sort, doc, options, callback);
	}
	return false;
};

Model.prototype.distinct = function(key, query, options, callback){
	if(this.isReady){
		return this.collection.distinct(key, query, options, callback);
	}
	return false;
};

Model.prototype.count = function(query, options, callback){
	if(this.isReady){
		return this.collection.count(query, options, callback);
	}
	return false;
};

Model.prototype.aggregate = function(pipeline, options, callback){
	if(this.isReady){
		return this.collection.aggregate(pipeline, options, callback);
	}
	return false;
};

Model.prototype.insert = function(docs, options, callback){
	if(this.isReady){
		return this.collection.insert(docs, options, callback);
	}
	return false;
};

Model.prototype.insertOne = function(doc, options, callback){
	if(this.isReady){
		return this.collection.insertOne(doc, options, callback);
	}
	return false;
};

Model.prototype.insertMany = function(docs, options, callback){
	if(this.isReady){
		return this.collection.insertMany(docs, options, callback);
	}
	return false;
};

Model.prototype.update = function(selector, document, options, callback){
	if(this.isReady){
		return this.collection.update(selector, document, options, callback);
	}
	return false;
};

Model.prototype.updateOne = function(filter, update, options, callback){
	if(this.isReady){
		return this.collection.updateOne(filter, update, options, callback);
	}
	return false;
};

Model.prototype.replaceOne = function(filter, doc, options, callback){
	if(this.isReady){
		return this.collection.replaceOne(filter, doc, options, callback);
	}
	return false;
};

Model.prototype.updateMany = function(filter, update, options, callback){
	if(this.isReady){
		return this.collection.updateMany(filter, update, options, callback);
	}
	return false;
};

Model.prototype.save = function(doc, options, callback){
	if(this.isReady){
		return this.collection.save(doc, options, callback);
	}
	return false;
};


Model.prototype.remove = function(selector, options, callback){
	if(this.isReady){
		return this.collection.remove(selector, options, callback);
	}
	return false;
};

Model.prototype.deleteOne = function(filter, options, callback){
	if(this.isReady){
		return this.collection.deleteOne(filter, options, callback);
	}
	return false;
};

Model.prototype.deleteMany = function(filter, options, callback){
	if(this.isReady){
		return this.collection.deleteMany(filter, options, callback);
	}
	return false;
};

Model.prototype.load = function(query){
	if(this.isReady){
		return this.collection.findOne(query);
	}
	return false;
};

Model.load = function(modelName, options, callback){
	var modelPath = path.dirname(require.main.filename) + path.sep + "models" + path.sep + modelName;
	var model = require(modelPath);
	return new model(options, callback);
};

Model.init = function(callback){
	mongodb.initDB({}, callback);
};

Model.password = function(pass){
	return crypto.createHash('md5').update(pass).digest('hex');
}

Model.ObjectID = mongo.ObjectID;

Model.moveFile = function(oldPath, newPath, callback){
	
	fs.rename(oldPath, newPath, function(err){
		if(err == 'EXDEV'){
			var readStream = fs.createReadStream(oldPath);
	        var writeStream = fs.createWriteStream(newPath);

	        readStream.on('error', callback);
	        writeStream.on('error', callback);
	        readStream.on('close', function () {
		        fs.unlink(oldPath, callback);
		    });
		    readStream.pipe(writeStream);
		}else{
			callback();
		}
	});

};

/********* Function to Upload Videos on S3 ***********/

Model.moveTOS3 = function(file, mime, myBucket, filename, callback){

	// Bucket names must be unique across all S3 users

	// var myBucket = 'my.unique.bucket.name';

	// var myKey = 'myBucketKey';

	s3.createBucket({Bucket: myBucket}, function(err, data) {
	if (err) {
	   	callback(err);	

	   } else {

	     params = { ACL: "public-read", Bucket: myBucket, Key: filename, ContentType: mime, Body: fs.createReadStream(file) };

	     s3.upload(params, function(err, data) {

	         if (err) {
             	callback(err);

	         } else {

            	callback(undefined, data);

	         }

	      });

	   }

	});
};

Model.copyFile = function(srcPath, destPath, callback){
	
	
	var readStream = fs.createReadStream(srcPath);
    var writeStream = fs.createWriteStream(destPath);

    readStream.on('error', callback);
    writeStream.on('error', callback);
    readStream.on('close', callback);
    readStream.on('end', function(){
    	readStream.close();
    	writeStream.close();
    })

    readStream.pipe(writeStream);


};

Model.createMosaic = function(srcFiles, destPath, callback){
	if(srcFiles.length >= 9){
		gm()
		.in('-page', '+0+0')
		.in(srcFiles[0])
		.in('-page', '+151+0')
		.in(srcFiles[1])
		.in('-page', '+302+0')
		.in(srcFiles[2])
		.in('-page', '+0+151')
		.in(srcFiles[3])
		.in('-page', '+151+151')
		.in(srcFiles[4])
		.in('-page', '+302+151')
		.in(srcFiles[5])
		.in('-page', '+0+302')
		.in(srcFiles[6])
		.in('-page', '+151+302')
		.in(srcFiles[7])
		.in('-page', '+302+302')
		.in(srcFiles[8])
		.resize(150,150)
		.mosaic()
		.write(destPath+"_mosaic.png", function(err){
			if(err){
				callback(err);
			}else{
				callback(undefined, destPath+ "_mosaic.png");
			}
		});
	}else if(srcFiles.length >= 6){
		gm()
		.in('-page', '+0+0')
		.in(srcFiles[0])
		.in('-page', '+151+0')
		.in(srcFiles[1])
		.in('-page', '+302+0')
		.in(srcFiles[2])
		.in('-page', '+0+151')
		.in(srcFiles[3])
		.in('-page', '+151+151')
		.in(srcFiles[4])
		.in('-page', '+302+151')
		.in(srcFiles[5])
		.resize(300, 150)
		.mosaic()
		.write(destPath+"_mosaic.png", function(err){
			if(err){
				console.error(err);
				callback(err);
			}else{
				callback(undefined, destPath+"_mosaic.png");
			}
		});
	}else if(srcFiles.length >= 4){
		gm()
		.in('-page', '+0+0')
		.in(srcFiles[0])
		.in('-page', '+151+0')
		.in(srcFiles[1])
		.in('-page', '+0+151')
		.in(srcFiles[2])
		.in('-page', '+151+151')
		.in(srcFiles[3])
		.resize(150,150)
		.mosaic()
		.write(destPath+"_mosaic.png", function(err){
			if(err){
				console.error(err);
				callback(err);
			}else{
				callback(undefined, destPath+"_mosaic.png");
			}
		});
	}else if(srcFiles.length >= 2){
		gm()
		.in('-page', '+0+0')
		.in(srcFiles[0])
		.in('-page', '+151+0')
		.in(srcFiles[1])
		.resize(300, 150)
		.mosaic()
		.write(destPath+"_mosaic.png", function(err){
			if(err){
				console.error(err);
				callback(err);
			}else{
				callback(undefined, destPath+"_mosaic.png");
			}
		});
	}else{
		callback("Invalid src file count!");
	}
};

Model.uploadFiles = function(req, baseFolder, imgPrefix, callback, callback2){
	var files = req.files;
	var Model = this;
	var total_files = files.length;

	var succeeded = [];
	var failed = [];
	var succeeded_images = [];
	var succeeded_videos = [];

	var total_thumbs = 0;
	var thumbs_done = 0;



	for(var i=0; i<total_files; i++){
		(function(file){

			var imgExt = path.extname(file.originalname);
			var imgDest = imgPrefix + (new Date()).getTime() + "_" + (i+1) + imgExt;

			var bucket_name = "fitnesstrainerapp";

			if(file.originalname.match(/\.(mp4|avi|mpeg|mov|mkv|webm)$/) || file.mimetype.startsWith('video/')){

				var fieldname = file.fieldname.replace(/\[\]$/, '');
				var path_parts = path.parse(file.path);
				var new_path = path.join(path_parts.dir, path_parts.name + '_tmp.mp4');
				var vThumbTemp = path.join(path_parts.dir, path_parts.name + '_tmp.png');
				var vThumbDest = imgPrefix + (new Date()).getTime() + "_" + (i+1) + '.png';

				var _processVideo = function() {

					succeeded.push(path.join(config.base_url, 'tmp', path.basename(file.path)));
					const spawn = require('child_process').spawn;
					//const ffmpeg = spawn('ffmpeg', ['-i', file.path, '-c:a', 'aac', '-c:v', 'libx264', '-crf', '20', '-strict', 'experimental', new_path]);
					const ffmpeg = spawn('ffmpeg', ['-i', file.path, '-c:a', 'aac', '-c:v', 'libx264', '-vf', 'scale=640:360', '-crf', '27', '-preset', 'veryslow', '-strict', 'experimental', new_path]);
					ffmpeg.on('close', function(code) {
						if(!code){
							// success
							if(callback2) callback2(undefined, fieldname, 'converted', undefined);
							Model.moveTOS3(new_path, file.mimetype, bucket_name, path.join(""+req.trainer_id, imgDest), function(err, result){

								if(err){
									// failed.push({error: err, filename: file.originalname});
									fs.unlinkSync(new_path);
									fs.unlinkSync(file.path);
									if(callback2) callback2(err, fieldname);
								}else{
									// succeeded.push(result.Location);

									// if(typeof fields[fieldname] == 'undefined'){
									// 	fields[fieldname] = [];
									// }
									// fields[fieldname].push(result.Location);
									fs.unlinkSync(new_path);
									fs.unlinkSync(file.path);
									//Change S3 URL to CDN URL
									var cdn_url = result.Location.replace(/(https|http):\/\/s3.amazonaws.com\/fitnesstrainerapp/, 'http://d3rjwmz42lgu8t.cloudfront.net').replace(/(https|http):\/\/fitnesstrainerapp.s3.amazonaws.com/, 'http://d3rjwmz42lgu8t.cloudfront.net');
									if(callback2) callback2(undefined, fieldname, 'uploaded', cdn_url);
								}
							});

					  	}else {
						  	//failed
						  	fs.unlinkSync(file.path);
						  	console.error('Failed to convert: '+ file.path);
						  	// failed.push({error: err, filename: file.originalname});

							// if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
							// 	callback(succeeded, failed, fields);
							// }
					  	}
					});

					if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
						callback(succeeded, failed, succeeded_images, succeeded_videos);
					}
				}

				const Thumbler = require('thumbler');
				// make thumbnail for video
                Thumbler({
                    type: 'video',
                    input: file.path,
                    output: vThumbTemp,
                    time: '00:00:2'
                    //size: '300x150' // this optional if null will use the dimension of the video
                }, function(err, result){
                	
                	if(err){
                		succeeded_videos.push({'path': path.join(config.base_url, 'tmp', path.basename(file.path)), 'mime': file.mimetype, 'video_thumbnail': ''});
                		_processVideo();
                	}else{
                		Model.moveFile(vThumbTemp, path.join(baseFolder, vThumbDest), function(err){
							if(err){
								console.warn("Error in video thumbnail", err)
								fs.unlinkSync(vThumbTemp)
								failed.push({error: err, filename: file.originalname})
								if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
									callback(succeeded, failed, succeeded_images, succeeded_videos)
								}
							}else{
								succeeded_videos.push({'path': path.join(config.base_url, 'tmp', path.basename(file.path)), 'mime': file.mimetype, 'video_thumbnail': vThumbDest});
								_processVideo();
							}

						});
                	}
                });

			}else if(file.mimetype.startsWith("image/")){

				var modImg = gm(file.path).resize(1080, null, ">");

				if(imgExt == 'jpeg' || imgExt == 'jpg') {
					modImg.setFormat('JPEG').compress('JPEG').quality(50);	
				}else{
					modImg.quality(75);
				}
				modImg.write(file.path, function(err, res){
					if(err){
							failed.push({error: err, filename: file.originalname});
					}else {	
						Model.moveFile(file.path, path.join(baseFolder, imgDest), function(err){
							if(err){
								failed.push({error: err, filename: file.originalname});
							}else{
								succeeded.push(imgDest);
								var fieldname = file.fieldname.replace(/\[\]$/, '');
			
								if(file.mimetype.startsWith("image/")){
									succeeded_images.push(imgDest);
									total_thumbs++;

									if(typeof req.body["crop_"+fieldname] != 'undefined'){
										var crop_data = JSON.parse(req.body["crop_"+fieldname]);

										Model.cropImage(path.join(baseFolder, imgDest), false, crop_data.x, crop_data.y, crop_data.width, crop_data.height, function(){
											Model.generateThumbs(path.join(baseFolder, imgDest), function(){
												thumbs_done++;
												if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
													callback(succeeded, failed, succeeded_images, succeeded_videos);
												}
											});
										});
									}else {
										Model.generateThumbs(path.join(baseFolder, imgDest), function(){
											thumbs_done++;
											if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
												callback(succeeded, failed, succeeded_images, succeeded_videos);
											}
										});
									}

									
								}else if(file.originalname.match(/\.(mp4|avi|mpeg|mov|mkv|webm)$/) || file.mimetype.startsWith('video/')){
									succeeded_videos.push(imgDest);
								}
							}
							if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
								callback(succeeded, failed, succeeded_images, succeeded_videos);
							}
						});
					}
				});

				
			}
			else 
			{
				Model.moveFile(file.path, path.join(baseFolder, imgDest), function(err){
					if(err){
						failed.push({error: err, filename: file.originalname});
					}else{
						succeeded.push(imgDest);
						var fieldname = file.fieldname.replace(/\[\]$/, '');
	
						if(file.mimetype.startsWith("image/")){
							succeeded_images.push(imgDest);
							total_thumbs++;

							if(typeof req.body["crop_"+fieldname] != 'undefined'){
								var crop_data = JSON.parse(req.body["crop_"+fieldname]);

								Model.cropImage(path.join(baseFolder, imgDest), false, crop_data.x, crop_data.y, crop_data.width, crop_data.height, function(){
									Model.generateThumbs(path.join(baseFolder, imgDest), function(){
										thumbs_done++;
										if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
											callback(succeeded, failed, succeeded_images, succeeded_videos);
										}
									});
								});
							}else {
								Model.generateThumbs(path.join(baseFolder, imgDest), function(){
									thumbs_done++;
									if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
										callback(succeeded, failed, succeeded_images, succeeded_videos);
									}
								});
							}

							
						}else if(file.originalname.match(/\.(mp4|avi|mpeg|mov|mkv|webm)$/) || file.mimetype.startsWith('video/')){
							succeeded_videos.push(imgDest);
						}
					}
					if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
						callback(succeeded, failed, succeeded_images, succeeded_videos);
					}
				});
			}
		})(files[i]);
	}
};

Model.uploadFilesEx = function(req, baseFolder, imgPrefix, callback, callback2, trainerId){
	req.trainer_id = typeof trainerId == 'undefined' ? req.trainer_id : trainerId;
	var files = req.files;
	var Model = this;
	var total_files = files.length;

	var succeeded = [];
	var failed = [];

	var fields = {};

	var total_thumbs = 0;
	var thumbs_done = 0;


					
	for(var i=0; i<total_files; i++){
		(function(file, index){
			var imgExt = path.extname(file.originalname);
			var imgDest = imgPrefix + (new Date()).getTime() + "_" + (i+1) + imgExt;
			var bucket_name = "fitnesstrainerapp";
			
			if(file.originalname.toLowerCase().match(/\.(mp4)$/) && file.mimetype.startsWith('video/')){
				var fieldname = file.fieldname.replace(/\[\]$/, '');
				var path_parts = path.parse(file.path);
				var new_path = path.join(path_parts.dir, path_parts.name + '_tmp.mp4');
				if(typeof fields[fieldname] == 'undefined'){
					fields[fieldname] = [];
				}
				var vThumbTemp = path.join(path_parts.dir, path_parts.name + '_tmp.png');
				var vThumbDest = imgPrefix + (new Date()).getTime() + "_" + (i+1) + '.png';

				var __processVideo = function(){

					succeeded.push(path.join(config.base_url, 'tmp', path.basename(file.path)));
					const spawn = require('child_process').spawn;
					const ffmpeg = spawn('ffmpeg' ,['-i', file.path, '-c:v' , 'libx264', '-crf', '20', '-b:v', '1M', '-c:a', 'aac', '-strict', 'experimental', new_path]);
					// const ffmpeg = spawn('ffmpeg' ,['-i', file.path, '-vcodec' , 'libx264', '-b:v', '500k', '-acodec', 'copy', new_path]);
					// const ffmpeg = spawn('ffmpeg', ['-i', file.path, '-c:a', 'aac', '-c:v', 'libx264', '-vf', 'scale=640:360', '-crf', '27', '-preset', 'veryslow', '-strict', 'experimental', new_path]);
					ffmpeg.on('close', function(code) {
					  	if(!code){
						  	// success
						  	if(callback2) callback2(undefined, fieldname, 'converted', undefined);
						  	Model.moveTOS3(new_path, file.mimetype, bucket_name, path.join(""+req.trainer_id, imgDest), function(err, result){
								
								if(err){
									// failed.push({error: err, filename: file.originalname});
									fs.unlinkSync(new_path);
									fs.unlinkSync(file.path);
									console.error('Failed uploading '+new_path+' to s3');
									if(callback2) callback2(err, fieldname);
								}else{
									fs.unlinkSync(new_path);
									fs.unlinkSync(file.path);
									var cdn_url = result.Location.replace(/(https|http):\/\/s3.amazonaws.com\/fitnesstrainerapp/, 'http://d3rjwmz42lgu8t.cloudfront.net').replace(/(https|http):\/\/fitnesstrainerapp.s3.amazonaws.com/, 'http://d3rjwmz42lgu8t.cloudfront.net');
									if(callback2) callback2(undefined, fieldname, 'uploaded', cdn_url);
								}
							});

					  	}else {
						  	fs.unlinkSync(file.path);
						  	console.error('Failed to convert: '+ file.path);
					  	}
					});
					
					if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
						callback(succeeded, failed, fields);
					}
				}

				const Thumbler = require('thumbler');
				// make thumbnail for video
                Thumbler({
                    type: 'video',
                    input: file.path,
                    output: vThumbTemp,
                    time: '00:00:2'
                    //size: '300x150' // this optional if null will use the dimension of the video
                }, function(err, result){
                	if(err) {
                		fields[fieldname].push({'path': path.join(config.base_url, 'tmp', path.basename(file.path)), 'mime': file.mimetype, 'video_thumbnail': ''});
                		__processVideo();
                	}else{
                		Model.moveFile(result, path.join(baseFolder, vThumbDest), function(err){
							if(err){
								console.warn("Error in video thumbnail", err)
								fs.unlinkSync(vThumbTemp)
								failed.push({error: err, filename: file.originalname})
								if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
									callback(succeeded, failed, fields)
								}
							}else{
								fields[fieldname].push({'path': path.join(config.base_url, 'tmp', path.basename(file.path)), 'mime': file.mimetype, 'video_thumbnail': vThumbDest});
								__processVideo();
							}

						});
                	}
            	});
			}
			else if(file.mimetype.startsWith("image/"))
			{

				var modImg = gm(file.path).resize(1080, null, ">");

				if(imgExt == 'jpeg' || imgExt == 'jpg') {
					modImg.setFormat('JPEG').compress('JPEG').quality(50);	
				}else{
					modImg.quality(75);
				}
				modImg.write(file.path, function(err, res){
					if(err){
						failed.push({error: err, filename: file.originalname});
					}else {
						
						Model.moveFile(file.path, path.join(baseFolder, imgDest), function(err){
							if(err){
								failed.push({error: err, filename: file.originalname});
							}else{
								succeeded.push(imgDest);

								var fieldname = file.fieldname.replace(/\[\]$/, '');

								if(file.mimetype.startsWith("image/")){
									total_thumbs++;

									if(typeof req.body["crop_"+fieldname] != 'undefined'){
										var crop_data = JSON.parse(req.body["crop_"+fieldname]);

										Model.cropImage(path.join(baseFolder, imgDest), false, crop_data.x, crop_data.y, crop_data.width, crop_data.height, function(){
											Model.generateThumbs(path.join(baseFolder, imgDest), function(){
												thumbs_done++;
												if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
													for(var fieldname in fields){
														fields[fieldname] = fields[fieldname].filter(function(a){
															return a;
														});
													}
													callback(succeeded, failed, fields);
												}
											});
										});
									}else {
										Model.generateThumbs(path.join(baseFolder, imgDest), function(){
											thumbs_done++;
											if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
												for(var fieldname in fields){
													fields[fieldname] = fields[fieldname].filter(function(a){
														return a;
													});
												}
												callback(succeeded, failed, fields);
											}
										});
									}

									
								}

								
								if(typeof fields[fieldname] == 'undefined'){
									fields[fieldname] = [];
								}
								fields[fieldname][index] = imgDest;
							}

							if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
								for(var fieldname in fields){
									fields[fieldname] = fields[fieldname].filter(function(a){
										return a;
									});
								}
								callback(succeeded, failed, fields);
							}
						});
					}

				});


				
			}else {
				Model.moveFile(file.path, path.join(baseFolder, imgDest), function(err){
					if(err){
						failed.push({error: err, filename: file.originalname});
					}else{
						var fieldname = file.fieldname.replace(/\[\]$/, '');

						if(file.mimetype.startsWith("image/")){
							succeeded.push(imgDest);
							total_thumbs++;

							if(typeof req.body["crop_"+fieldname] != 'undefined'){
								var crop_data = JSON.parse(req.body["crop_"+fieldname]);

								Model.cropImage(path.join(baseFolder, imgDest), false, crop_data.x, crop_data.y, crop_data.width, crop_data.height, function(){
									Model.generateThumbs(path.join(baseFolder, imgDest), function(){
										thumbs_done++;
										if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
											callback(succeeded, failed, fields);
										}
									});
								});
							}else {
								Model.generateThumbs(path.join(baseFolder, imgDest), function(){
									thumbs_done++;
									if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
										callback(succeeded, failed, fields);
									}
								});
							}

							
						}else{
							if(imgExt.toLowerCase() === '.pdf' || file.mimetype.startsWith("audio/")) {
								succeeded.push(imgDest);
							}else{
								failed.push({error: "file type not supported", filename: file.originalname});
							}
						}

						
						if(typeof fields[fieldname] == 'undefined'){
							fields[fieldname] = [];
						}
						fields[fieldname].push(imgDest);
					}

					if(succeeded.length + failed.length >= total_files && thumbs_done == total_thumbs){
						callback(succeeded, failed, fields);
					}
				});
			}	
		})(files[i], i);
	}
};

Model.removeFiles = function(files, baseFolder){
	if(typeof baseFolder == 'undefined'){
		baseFolder = "./";
	}
	for(var i=0; i<files.length; i++){
		if(!files[i]) continue;
		(function(file){
			fs.access(path.join(baseFolder, file), fs.R_OK | fs.W_OK, function(err){
				if(err){
					console.error("Failed to remove file: "+file+", either no such file or we don't have permissions to access it");
				}else{
					fs.unlink(path.join(baseFolder, file), function(err){
						if(err){
							console.error("Failed to remove file: "+file+", either no such file or we don't have permissions to access it");
						}else{
							var path_info = path.parse(file);
							var destFileSqr = path.join(baseFolder, path_info.name+"_thumb"+path_info.ext);
							var destFileW = path.join(baseFolder, path_info.name+"_w150"+path_info.ext);
							var destFileH = path.join(baseFolder, path_info.name+"_h150"+path_info.ext);
							var destFileM = path.join(baseFolder, path_info.name+"_med"+path_info.ext);
							fs.unlink(destFileSqr, function(err){
								if(err){
									console.error("Failed to remove file: "+destFileSqr+", either no such file or we don't have permissions to access it");
								}else{
									fs.unlink(destFileW, function(err){
										if(err){
											console.error("Failed to remove file: "+destFileW+", either no such file or we don't have permissions to access it");
										}else{
											fs.unlink(destFileH, function(err){
												if(err){
													console.error("Failed to remove file: "+destFileH+", either no such file or we don't have permissions to access it");
												}else{
													fs.unlink(destFileM, function(err){
														if(err){
															console.error("Failed to remove file: "+destFileM+", either no such file or we don't have permissions to access it");
														}
													});
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		})(files[i]);
	}
};


Model.cropImage = function(file, destFile, x, y, width, height, callback){
	if(typeof destFile == 'undefined' || !destFile){
		destFile = file;
	}

	gm(file).crop(width, height, x, y).write(destFile, callback);
};

Model.generateThumbnail = function(file, destFile, width, height, callback){
	if(typeof destFile == 'undefined' || !destFile){
		var path_info = path.parse(file);
		destFile = path.join(path_info.dir, path_info.name+"_thumb"+path_info.ext);
	}

	if((typeof width == 'undefined' || !width) && (typeof height == 'undefined' || !height)){
		width = height = 150;
	}

	gm(file).gravity("Center").resize(width, height, "^").crop(width, height).write(destFile, callback);
};


Model.generateThumbs = function(file, callback) {
	var path_info = path.parse(file);
	
	var destFileSqr = path.join(path_info.dir, path_info.name+"_thumb"+path_info.ext);
	var destFileW = path.join(path_info.dir, path_info.name+"_w150"+path_info.ext);
	var destFileH = path.join(path_info.dir, path_info.name+"_h150"+path_info.ext);

	var destFileM = path.join(path_info.dir, path_info.name+"_med"+path_info.ext);

	Model.generateThumbnail(file, destFileSqr, 150, 150, function(){
		Model.generateThumbnail(file, destFileW, 150, 0, function(){
			Model.generateThumbnail(file, destFileH, 0, 150, function(){
				Model.generateThumbnail(file, destFileM, 500, 0, callback);
			});
		});
	});
};

/**
	@@ Send Push Notification
	@@ input = deviceType, deviceToken, message, payload

**/
// APN: HelixApnsDevCertificate.pem should be configured 
// GCM: configure console to generate gcm.sender
var apn_topics = {

	'597b8a331b54472074c2dd1a': "com.colin.sugary",
	'5a690da90379ce6d1fed04ac': "com.colin.TiannaGregory",
	'5a3c25bf34d092539e01b020': "com.colin.hollybarker",
	'5a9d7d110a4ae17da220a43e': "com.colin.FitByValen",
	'5a8c7aff14d55f7ad445a6f3': "com.colin.boothcamp",
	'59e7a30ce1705864cc7cf355': "com.colin.cdcbody",
	'5aa6e4c527d727022ed0a9a8': "com.colin.LiftWithCass",
	'5a848f72c3b5c3530a8d05f1': "com.colin.ZBodyFitness",
	'57c5310521bbac1d01aa75db': "com.colin.fitandthick",
	'591c8094da9386315f51787e': "com.colin.gab",
	'5ababddaecc1ec1ffbd08c30': "com.colin.bikiniboss",
	'59e4ea0878c2ed3818c7c0de': "com.colin.laisDeleon",
	'5aea2440a87c277c2e2bf738': "com.colin.CurvyAndCut",
	'5822bfb2b86828570dd90899': "com.colin.MTC",
	'5acd3eb90780015c1e9cc568': "com.colin.getlovedup",
	'5ae1efea5058a545907d5f61': "com.colin.JannaBreslin",
	'5b32b29430f0493180099e60': "com.colin.GetItDunne",
	'59b174cfab77c775bae7c6a2': "com.colin.FitwithWhit",
	'5ba3dad956d38558c5e5fbd7': "com.colin.WarriorAthlete",
	'5b917a71b29b997460999b8f': "com.colin.tanyapoppett",
	'5bbf8e89487bcd41d42b4db5': "com.colin.brunalima",
	'5bd9e069da6a6b3a240de6dd': "com.colin.AlienGains",
	'5bfc2525a2d6464827d1fbf5': "com.colin.LauraMicetich",
	'5b5746db5c3f964e6408b507': "com.colin.bodymaze",
	'5bbcd0fe487bcd41d42b4776': "com.colin.lindafit",
	'5b3fac6ebb2b53737d1fe6cc': "com.colin.anitaherbert",
	'5cb5fb5ee6829f72a8c6b6d9': "com.plankk.miller",
	'5c3cc5c8ba2d490d720aca9e': "com.colin.sami",
	'5ccc64cfd17f9f5d70b9b227': "com.colin.Massy",
	'5d8117da4d4a29560d7c86e0': "com.colin.jenHeward"
}

var app_certificates = {

	'597b8a331b54472074c2dd1a': { // Sugary SiX Pack
		apn: {
	        pfx: path.resolve('./keys/CertificatesProductionSugary.p12'),
	        passphrase: '123456',
	        production: true,
	        rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AAAAOCq419c:APA91bF46QGaG_Eew1SMmiwIwHQs5N4R3OZLIYZdibT0wKDGs9tFC4x7-H4mjf0hO4Az-mN4cF7BfF4KVnjwtxeVIM5GHvjUSJWSrc8AV4oxXRsOTyQqs8AgQ7fhVzAElY_1Y7TheTbG'
	    }	
	},
	'5a690da90379ce6d1fed04ac': { // Tianna Gregory
		apn: {
		    pfx: path.resolve('./keys/CertificatesProductionPushTianna.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AAAAr1v_4PM:APA91bEB7Xs_Y5XB31ppOvZnFru_GhNwRVSlZ0qRNcubnDeWceoMqyJY3aLsCHWBKWSWSKTsPQNSR3ujc7j0xMMv3kd9o2fAnE3o3G1jnGvtXIEXhtwyDZcirVKRlMi9uGe02heAKmsjLb9VFlGg13gpC_OOsREmxg'
	    }	
	},
	'5a3c25bf34d092539e01b020': { // Holly Barker
		apn: {
		    pfx: path.resolve('./keys/CertificatesProdPushHolly.p12'),
		    passphrase: '12345',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }	
	},
	'5a9d7d110a4ae17da220a43e': { // Fit By Valen
		apn: {
		    pfx: path.resolve('./keys/CertificatesProdPushValen.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }	
	},
	'5a8c7aff14d55f7ad445a6f3': { // Booth Camp
		apn: {
		    pfx: path.resolve('./keys/BoothCamp_distribution.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AIzaSyB4VHxlDlVfDc-AyDESLP_51LWdNE9S2kw'
	    }
	},
	'59e7a30ce1705864cc7cf355': { // CDC
		apn: {
		    pfx: path.resolve('./keys/CDC_Production.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AIzaSyBhbkw-RKX4lennlDRwEJlXh2120P5Qkc0'
	    }	
	},
	'5aa6e4c527d727022ed0a9a8': { // Lift With Cass Martin
		apn: {
		    pfx: path.resolve('./keys/CASS_Distribution.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AAAAI_ytZv0:APA91bFbp5Tv1r4LgjUvcRmmQgBsAE8diwUpYlSdhXrytKwMOzMr0DoHbQLMZ2RXoX7jCHVyae3efLz3a-Qg5XE28KaoHPn15GjTC898wm3-AFpeSaXI0EspWd8TSJTzoWPR1xE0tnag'
	    }	
	},
	'5a848f72c3b5c3530a8d05f1': { // Z Body
	    apn: {
		    pfx: path.resolve('./keys/CertificatesProductionPushZBody.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AIzaSyBZCViUbxMFaRoNagERmR4iz-An8eLHVE0'
	    }	
	},
	'57c5310521bbac1d01aa75db': { // Fit n Thick
		apn: {
		    pfx: path.resolve('./keys/CertificatesProductionPushF&T.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AIzaSyAKhHRMpa-NQ41eapV88e4s21IC64O_w7c'
	    }	
	},
	'591c8094da9386315f51787e': { // Workouts By Gabriela
		apn: {
		    pfx: path.resolve('./keys/GabrielaProdPushNotification.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AIzaSyDYLnqNf5yBZXLzaP3FPgub1uR27q5XCC8'
	    }	
	},
	'5a5e36168887535a6f78b521': { // Jessies Girls
		apn: {
		    pfx: path.resolve('./keys/JessiesProdPushNotifications.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AIzaSyD-sjdS1lVONn4GgF-XfrOR9D2d-pKRKD4'
	    }	
	},
	'5ababddaecc1ec1ffbd08c30': { // Bikini Boss
		apn: {
		    pfx: path.resolve('./keys/BikiniBossProductionPush.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }	
	},
	'5822bfb2b86828570dd90899': { // MTC
		apn: {
		    pfx: path.resolve('./keys/CertificatesProductionPushMTC.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AIzaSyDA46muw25ThjY0qILupWjdFQqsQF-tC5I'
	    }	
	},
	'59e4ea0878c2ed3818c7c0de': { // Lais DeLeon
		apn: {
		    pfx: path.resolve('./keys/LaisProductionPushNotifications.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AIzaSyDRq41YcLQRuvdxgYgTgnD3rgXd1J7ghuU'
	    }	
	},
	'5aea2440a87c277c2e2bf738': { // Curvy & Cut
		apn: {
		    pfx: path.resolve('./keys/Curvy_CutProductionPush.p12'),
		    passphrase: '123456',
		    production: false,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AIzaSyAA6url0OM7s5HgRVNH_QtKma_XqCafhO0'
	    }	
	},
	'5ae1efea5058a545907d5f61': { // Janna Breslin
		apn: {
		    pfx: path.resolve('./keys/CertificatesJannaProdPush.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }	
	},
	'5acd3eb90780015c1e9cc568': { // Get Loved Up
		apn: {
		    pfx: path.resolve('./keys/CertificatesProductionGetLovedUp.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }	
	},
	'5b32b29430f0493180099e60': { // Getit Dunne
		apn: {
		    pfx: path.resolve('./keys/CertificatesDevGetItDunne.p12'),
		    passphrase: '123456',
		    production: false,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }	
	},
	'59b174cfab77c775bae7c6a2': { // Fit With Whit
		apn: {
		    pfx: path.resolve('./keys/FitWithWhitPushLive.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }	
	},
	'5ba3dad956d38558c5e5fbd7': { // Warrior Athelete
		apn: {
		    pfx: path.resolve('./keys/WarriorProductionAPNSCertificate.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }
	},
	'5b917a71b29b997460999b8f': { // Tanya Poppet
		apn: {
		    pfx: path.resolve('./keys/Certificates_tanya_live.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }
	},
	'5bbf8e89487bcd41d42b4db5': { // Bruna Lima
		apn: {
		    pfx: path.resolve('./keys/Certificates_Bruna_Lima_Push_Prod.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }
	},
	'5bd9e069da6a6b3a240de6dd': { // Bakhar Nabieva
		apn: {
		    pfx: path.resolve('./keys/CertificatesAPNSProductionAlienGains.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }
	},
	'5bfc2525a2d6464827d1fbf5': { // Laura micetich
		apn: {
		    pfx: path.resolve('./keys/CertificatesAPNSProdLaura.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }
	},
	'5b5746db5c3f964e6408b507': { // Bodymaze
		apn: {
		    pfx: path.resolve('./keys/CertificatesBodymazeProdAPNS.p12'),
		    passphrase: '123456',
		    production: true, 
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }	
	},
	'5bbcd0fe487bcd41d42b4776': { // Linda Fit
		apn: {
		    pfx: path.resolve('./keys/CertificatesProductionAPNSLinda.p12'),
		    passphrase: '123456',
		    production: true, 
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }	
	},
	'5b3fac6ebb2b53737d1fe6cc': { // Anita Herbert
		apn: {
		    pfx: path.resolve('./keys/AnitaProdAPNSCertificate.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }
	},
	'5cb5fb5ee6829f72a8c6b6d9': { // Theresa Miller
		apn: {
		    pfx: path.resolve('./keys/CertificatesProductionTheresaMiller.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }
	},
	'5c3cc5c8ba2d490d720aca9e': { // Sami B
		apn: {
		    pfx: path.resolve('./keys/Sami_APN_Production.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }
	},
	'5ccc64cfd17f9f5d70b9b227': { // Massy
		apn: {
		    pfx: path.resolve('./keys/Massy_APN_Production.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: 'AIzaSyBjRNYVkHtoADmhyZgO0K98sa_n0hqwOP4'
	    }
	},
	'5d8117da4d4a29560d7c86e0': { // Fit With Jen
		apn: {
		    pfx: path.resolve('./keys/FitwithJen.p12'),
		    passphrase: '123456',
		    production: true,
		    rejectUnauthorized: false
	    },
	    gcm: {
	        id: ''
	    }
	},

}

Model.sendPush = function(deviceType, deviceToken, message, payload, trainerID, callback){
	var message = message;
	var badge = null;
	var sound = null;
	var payload = {custom: payload || null, badge : payload.badge};
	
	payload.alert = payload.title = payload.body = message;
	payload.sound = 'ping.aiff',
	payload.dryRun = false;
	//payload.topic = "com.colin.sugary"; // require for apn.

	if(typeof trainerID != 'undefined' && trainerID){
		var PushNotificationService = new PushNotification(app_certificates[trainerID]);
		payload.topic = apn_topics[trainerID]// require for apn.

	}else{
		var PushNotificationService = new PushNotification(app_certificates['597b8a331b54472074c2dd1a']); // Assume Sugary SiX Pack by default.
		payload.topic = "com.colin.sugary"; // require for apn.
	}

	 	if(typeof deviceType != 'undefined' && typeof deviceToken != 'undefined')
		{ 	
			PushNotificationService.send( deviceToken, payload, function(err, result){
		 		if(err){
					console.error(err);
		 		} else{
		 			console.log("PUSH SENT===", result);
		 		}
		 		if(callback) callback(err, result);
		 	});
		}
};

Model.sendPushNotification = function(deviceType, deviceToken, payload, trainerID, callback){ 
	//var message = message;
	var badge = null; 
	var sound = null;
	//var payload = {custom: payload || null, badge : payload.badge};
	
	//payload.alert = payload.title = payload.body = message;
	//payload.sound = 'ping.aiff',
	//payload.dryRun = false;
	//payload.topic = "com.colin.sugary"; // require for apn.

	if(typeof trainerID != 'undefined' && trainerID){
		var PushNotificationService = new PushNotification(app_certificates[trainerID]);
		payload.topic = apn_topics[trainerID]// require for apn.

	}else{
		var PushNotificationService = new PushNotification(app_certificates[trainerID]); // Assume Sugary SiX Pack by default.
		payload.topic = "com.colin.bodymaze"; // require for apn.
	}
	if(typeof deviceType != 'undefined' && typeof deviceToken != 'undefined')
	{ 	
		PushNotificationService.send( deviceToken, payload, function(err, result){
			if(err){
				console.error(err);
			} else{
				console.log("PUSH SENT===", result);
			}
			if(callback) callback(err, result);
		});
	}
};

module.exports = Model;

})();
