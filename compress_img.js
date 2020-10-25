(function(){
	const path = require('path');
	const gm = require('gm');
	var Model = require('./models');

	if(process.argv.length < 4){
		process.exit(1);
	}

	var trainer_id = process.argv[2];
	var type = process.argv[3];

	if(type != 'nutrition' && type!='workout'){
		process.exit(1);
	}

	if(!trainer_id || trainer_id.length < 24){
		process.exit(1);
	}

	switch(type){
		case 'nutrition':
			compressNutritionImages();
			break;
		default:
			console.warn(`${type} target not known`);
			process.exit(1);
	}

	function compressNutritionImages(){
		var baseFolder = path.resolve("./uploads/nutritionplans");

		var func1 = function(next) {
			var model_np = Model.load("nutritionplan", {}, function(err, model_np){
				if(err){
					console.error(`Cannot load model:nutritionplan, Error: ${err}`);
					process.exit();
				}else{
					var conds = {};
					if(trainer_id){
						conds.trainer_id = trainer_id;
					}
					model_np.find(conds).toArray(function(err, nutritionplans){
						if(err){
							console.error(`Cannot fetch nutritionplans, Error: ${err}`);
							process.exit();	
						}
						if(nutritionplans && nutritionplans.length){


							var _doCompression = function(index){
								if(index >= nutritionplans.length) {
									next();
									return;
								}
								
								var nutritionplan = nutritionplans[index];

								if(nutritionplan.image){
									gm(path.join(baseFolder, nutritionplan.image)).resize(1080, null, ">").setFormat('JPEG').compress('JPEG').quality(50).write(path.join(baseFolder, nutritionplan.image), function(err, res){
										if(err){
											console.error(`Compressing ${nutritionplan.image} ... Failed!`);
										}
										_doCompression(index+1);
									});
								}else{
									_doCompression(index+1);
								}
							};

							_doCompression(0);

						}else{
							next();
						}
					});
				}
			});
		}

		var func2 = function(next){
			var model_npd = Model.load("nutritionday", {}, function(err, model_npd){
				if(err){
					console.error(`Cannot load model:nutritionday, Error: ${err}`);
					process.exit();
				}else{
					var conds = {};
					if(trainer_id){
						conds.trainer_id = trainer_id;
					}
					model_npd.find(conds).toArray(function(err, nutritiondays){
						if(err){
							console.error(`Cannot fetch nutritiondays, Error: ${err}`);
							process.exit();	
						}
						if(nutritiondays && nutritiondays.length){


							var _doCompression = function(index){
								if(index >= nutritiondays.length) {
									next();
									return;
								}

								var nutritionday = nutritiondays[index];

								if(nutritionday.image){
									gm(path.join(baseFolder, nutritionday.image)).resize(1080, null, ">").setFormat('JPEG').compress('JPEG').quality(50).write(path.join(baseFolder, nutritionday.image), function(err, res){
										if(err){
											console.error(`Compressing ${nutritionday.image} ... Failed!`);
										}
										_doCompression(index+1);
									});
								}else{
									_doCompression(index+1);
								}
							};

							_doCompression(0);
						}else {
							next();
						}
					});
				}
			});
		}

		var func3 = function(next) {
			var model_npm = Model.load("nutritionmeal", {}, function(err, model_npm){
				if(err){
					console.error(`Cannot load model:nutritionmeal, Error: ${err}`);
					process.exit();
				}else{
					var conds = {};
					if(trainer_id){
						conds.trainer_id = trainer_id;
					}
					model_npm.find(conds).toArray(function(err, nutritionmeals){
						if(err){
							console.error(`Cannot fetch nutritionmeals, Error: ${err}`);
							process.exit();	
						}
						if(nutritionmeals && nutritionmeals.length){

							var _doCompression = function(index){
								if(index >= nutritionmeals.length){
									next();
									return;
								}
								var nutritionmeal = nutritionmeals[index];
								if(nutritionmeal.image){
									gm(path.join(baseFolder, nutritionmeal.image)).resize(1080, null, ">").setFormat('JPEG').compress('JPEG').quality(50).write(path.join(baseFolder, nutritionmeal.image), function(err, res){
										if(err){
											console.error(`Compressing ${nutritionmeal.image} ... Failed!`);
										}
										_doCompression(index+1);
									});
								}else{
									_doCompression(index+1);
								}
							};

							_doCompression(0);

						}else{
							next();
						}
					});
				}
			});
		};
		func1(function(){
			func2(function(){
				func3(function(){
					// done
				})
			});
		});
	}

})();