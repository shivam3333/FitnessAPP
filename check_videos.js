var path = require('path');
var Model = require('./models');
var fs = require('fs');
var request = require('request');


if(process.argv.length < 3){
	process.exit();

}


var trainer_id = process.argv[2] || "";

var tmp_folder = path.resolve('./tmp');
if(!fs.existsSync(tmp_folder)){
	fs.mkdirSync(tmp_folder);
}




function MyWorker() {
	this.queue = [];
	this.started = false;
}
MyWorker.prototype.isRunning = function(){
		return this.started;
}
MyWorker.prototype.start = function(){
	if(this.started){
		return;
	}
	this.started=true;
	this.processQueue();
}
MyWorker.prototype.addItem = function(obj){
	this.queue.push(obj);
}
MyWorker.prototype.processQueue = function(){
	if(this.queue.length){
		var obj = this.queue.shift();
		this.checkVideo(obj, function(err){
			if(err){
				console.error('Checking - '+obj.message+' - Failed - '+err);
			}
			this.processQueue();
		});
	}else{
		// wait for a second and then retry...
		setTimeout(() => {this.processQueue()}, 1000);
	}
}
MyWorker.prototype.checkVideo = function(obj, callback){

	var _this = this;
	var workout_id = obj.id;
	var tmp_name = workout_id.toString()+'_'+(new Date()).getTime();
	var tmp_video_path = path.join(tmp_folder, tmp_name + path.extname(obj.video));
	var ws = fs.createWriteStream(tmp_video_path);

	request(obj.video).pipe(ws);

	ws.on('close', function(err){
		if(err){
			// Transfer control back to callback function...
        	callback.call(_this, err);
			return;
		}
		fs.stat(tmp_video_path, function(err, stats){
			if(err || !stats){
				callback.call(_this, err);
				return;		
			}
			fs.unlink(tmp_video_path);
			if(stats.size > (1024 * 500)) {
				callback.call(_this, undefined);		
			}else{
				callback.call(_this, "Downloaded video too small!!");
			}
			
		});
		
	});

	ws.on('error', function(err){
		// Transfer control back to callback function...
        callback.call(_this, err);
	});
}

var worker = new MyWorker();
Model.load('workoutday', {}, function(err, workoutday_model){
	if(err){
		console.error('Failed to load workout day model');
		process.exit();
	}else{
		Model.load('workout', {}, function(err, workout_model){
			if(err){
				console.error('Failed to load workout model');
				process.exit();
			}
			workoutday_model.find({trainer_id: trainer_id}).forEach(function(workoutday){
				workout_model.find({_id: Model.ObjectID(workoutday.workout)}).forEach(function(workout){
					if(workout && workout.video){
						worker.addItem({
							id: workout._id,
							video: workout.video,
							message: "Week#"+workoutday.week+"Day#"+workoutday.weekday+" - "
						});
					}
					if(workout.children){
						// process circuits...
						workout.children.forEach(function(cid){
							workout_model.find({_id: Model.ObjectID(cid)}).forEach(function(circuit){
								if(circuit && circuit.video){
									worker.addItem({
										id: circuit._id,
										video: circuit.video,
										message: "Week#"+workoutday.week+"Day#"+workoutday.weekday+" - "+circuit.label+" - "
									});
								}
								if(circuit.children){
									// process exercises...
									circuit.children.forEach(function(wid){
										workout_model.find({_id: Model.ObjectID(wid)}).forEach(function(exercise){
											if(exercise && exercise.video){
												worker.addItem({
													id: exercise._id,
													video: exercise.video,
													message: "Week#"+workoutday.week+"Day#"+workoutday.weekday+" - "+circuit.label+" - "+exercise.label+" - "
												});
											}
										});
									});
								}
							});
						});
					}
				});
				
			});
		});
		
	}
});

if(!worker.isRunning()){
	worker.start();
}
