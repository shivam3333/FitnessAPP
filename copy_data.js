// B&L PLYOS

// 57d000fbdf50a74bb704573a
// 57d00905df50a74bb7045740


// UP BODY
// 57d00828df50a74bb704573e
// 57d009cadf50a74bb7045742

var path = require('path');
var Model = require('./models');

// Call this to init the DB ... so that all future models load instantly...
var base_folder = path.join(path.dirname(require.main.filename), "uploads", "workouts");
var target_folder = path.join(path.dirname(require.main.filename), "uploads", "workouts_migration");
function copyImages(w){
	
	if(w.image){
		var path_info = path.parse(w.image);
		Model.copyFile(path.join(base_folder, w.image), path.join(target_folder, w.image), function(e){if(e){console.error("Failed to Save Org: "+w.image+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_thumb"+path_info.ext), path.join(target_folder, path_info.name+"_thumb"+path_info.ext), function(e){if(e){console.error("Failed to Save Thumb: "+w.image+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_w150"+path_info.ext), path.join(target_folder, path_info.name+"_w150"+path_info.ext), function(e){if(e){console.error("Failed to Save w150: "+w.image+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_h150"+path_info.ext), path.join(target_folder, path_info.name+"_h150"+path_info.ext), function(e){if(e){console.error("Failed to Save h150: "+w.image+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_med"+path_info.ext), path.join(target_folder, path_info.name+"_med"+path_info.ext), function(e){if(e){console.error("Failed to Save Med: "+w.image+", "+e);}});
	}
	if(w.images && w.images.length){
		w.images.forEach(function(i){
			if(!i) return;
			var path_info = path.parse(i);
			Model.copyFile(path.join(base_folder, i), path.join(target_folder, i), function(e){if(e){console.error("Failed to Save Org: "+i+", "+e);}});	
			Model.copyFile(path.join(base_folder, path_info.name+"_thumb"+path_info.ext), path.join(target_folder, path_info.name+"_thumb"+path_info.ext), function(e){if(e){console.error("Failed to Save Thumb: "+i+", "+e);}});	
			Model.copyFile(path.join(base_folder, path_info.name+"_w150"+path_info.ext), path.join(target_folder, path_info.name+"_w150"+path_info.ext), function(e){if(e){console.error("Failed to Save w150: "+i+", "+e);}});	
			Model.copyFile(path.join(base_folder, path_info.name+"_h150"+path_info.ext), path.join(target_folder, path_info.name+"_h150"+path_info.ext), function(e){if(e){console.error("Failed to Save h150: "+i+", "+e);}});	
			Model.copyFile(path.join(base_folder, path_info.name+"_med"+path_info.ext), path.join(target_folder, path_info.name+"_med"+path_info.ext), function(e){if(e){console.error("Failed to Save med: "+i+", "+e);}});	
		});
	}

	if(w.steps && w.steps.length){
		w.steps.forEach(function(s){
			if(!s.image) return;
			var path_info = path.parse(s.image);
			Model.copyFile(path.join(base_folder, s.image), path.join(target_folder, s.image), function(e){if(e){console.error("Failed to Save Org: "+s.image+", "+e);}});	
			Model.copyFile(path.join(base_folder, path_info.name+"_thumb"+path_info.ext), path.join(target_folder, path_info.name+"_thumb"+path_info.ext), function(e){if(e){console.error("Failed to Save Thumb: "+s.image+", "+e);}});	
			Model.copyFile(path.join(base_folder, path_info.name+"_w150"+path_info.ext), path.join(target_folder, path_info.name+"_w150"+path_info.ext), function(e){if(e){console.error("Failed to Save w150: "+s.image+", "+e);}});	
			Model.copyFile(path.join(base_folder, path_info.name+"_h150"+path_info.ext), path.join(target_folder, path_info.name+"_h150"+path_info.ext), function(e){if(e){console.error("Failed to Save h150: "+s.image+", "+e);}});	
			Model.copyFile(path.join(base_folder, path_info.name+"_med"+path_info.ext), path.join(target_folder, path_info.name+"_med"+path_info.ext), function(e){if(e){console.error("Failed to Save med: "+s.image+", "+e);}});	
		});	
	}

	if(w.video && w.video.indexOf('http') != 0){
		Model.copyFile(path.join(base_folder, w.video), path.join(target_folder, w.video), function(e){if(e){console.error("Failed to Save: "+w.video+", "+e);}});
	}
	if(w.videos && w.videos.length){
		w.videos.forEach(function(v){
			if(!v || v.indexOf('http') == 0) return;
			Model.copyFile(path.join(base_folder, v), path.join(target_folder, v), function(e){if(e){console.error("Failed to Save: "+v+", "+e);}});	
		});
	}
	if(w.video_thumbnail){
		var path_info = path.parse(w.video_thumbnail);
		Model.copyFile(path.join(base_folder, w.video_thumbnail), path.join(target_folder, w.video_thumbnail), function(e){if(e){console.error("Failed to Save Org: "+w.video_thumbnail+", "+e);}});
	}
}

Model.init();

function copyExercise(w, Workout, callback){
	delete w._id;
	copyImages(w);
	Workout.db.collection("workout_migration").insert(w, function(err, res){
		if(err){
			callback(err);
		}else{
			
			callback(undefined, w);
		}
	});
}
function copyWorkout1(w, Workout, callback){

	Workout.findOne({"_id": Model.ObjectID(w)}, {}, function(err, workout) {
		if(workout){
			if(workout.type == 'group' && workout.children && workout.children.length){
				var childrenIds = [];
				var invalidChildren = [];


				var _saveChildren = function(i){
					if(i>=workout.children.length){
						workout.children = childrenIds;
						copyWorkout2(workout, Workout, callback);
					}else{
						if(!workout.children[i] || workout.children[i].length != 24){
							invalidChildren.push(workout.children[i]);
							_saveChildren(i+1);
						}else{
							copyWorkout1(workout.children[i], Workout, function(err, nW){
								if(err){
									return callback(err);
								}else if(!nW){
									invalidChildren.push(workout.children[i]+"");
								}else{
									childrenIds.push(nW._id+"");
								}
								_saveChildren(i+1);
							});
						}
					}
				};

				_saveChildren(0);

			}else{
				copyWorkout2(workout, Workout, callback);
			}
		}else{
			callback(err);
		}
		
	});
	
}

function copyWorkout2(workout, Workout, callback){

	// Workout.findOne({"_id": Model.ObjectID(w)}, {}, function(err, workout) {
		if(workout){
			if(workout.alternates && workout.alternates.length){
				var validAltIds = [];
				var invalidAltIds = [];


				var _saveAlt = function(i){
					if(i>=workout.alternates.length){
						workout.alternates = validAltIds;
						copyExercise(workout, Workout, callback);
					}else{
						if(!workout.alternates[i] || workout.alternates[i].length != 24){
							invalidAltIds.push(workout.alternates[i]);
							_saveAlt(i+1);
						}else{
							copyWorkout1(workout.alternates[i], Workout, function(err, nW){
								if(err){
									return callback(err);
								}else if(!nW){
									invalidAltIds.push(workout.alternates[i]+"");
								}else{
									validAltIds.push(nW._id+"");
								}
								_saveAlt(i+1);
							});
						}
					}
				};

				_saveAlt(0);

			}else{
				copyExercise(workout, Workout, callback);
			}
		}else{
			callback(err);
		}
		
	// });
	
}

function copyWorkoutday(wday, WorkoutDay, Workout, callback){
	copyImages(wday);
	copyWorkout1(wday.workout, Workout, function(err, newWorkout){
		if(newWorkout){
			delete wday._id;
			wday.workout = newWorkout._id+"";
			WorkoutDay.db.collection("workoutday_migration").insert(wday, function(err, res){
				if(err){
					callback(err);
				}else{
					callback(undefined, wday);
				}
			});
		}else{
			callback("Failed copying workout day: "+wday._id);
		}
	});
}


Model.load('workoutday', {}, function(err, workoutday){

	if(err){
		console.error(err);
	}
	Model.load('workout', {}, function(err, workout){

		if(err){
			console.error(err);
		}
		var weeks_to_copy = [
			{week: "1"},
			{week: "2"},
			{week: "3"},
			{week: "4"},
			{week: "5"},
			{week: "6"}
		];
		if(workoutday){
			weeks_to_copy.forEach(function(week_to_copy) {
				var conds = {
					// FnT
					// "trainer_id": "57c5310521bbac1d01aa75db", "plan_id": "57cd0c85df50a74bb70456d6",
					// TWL
					"trainer_id": "584fbe1dadbdd05d535cddae", "plan_id": "58b5ced403e7e079550d2b22",
					// DFG
					// "trainer_id": "586f341b1cfef774222b1821", "plan_id": "586f4679ee820b73c0280164",
					// MTC
					// "trainer_id": "5822bfb2b86828570dd90899", "plan_id": "5822bfd0b86828570dd9089a",
					// Madeleine
					//"trainer_id": "59177e86980aa43e2715a8ff", "plan_id": "5935a1ef7211e622b3cb4e63",
					// MN
					// "trainer_id": "58f66e596e288005867db979", "plan_id": "58f8f452de9e0f18cbf4633e",
					// Gabriela
					// "trainer_id": "591c8094da9386315f51787e", "plan_id": "591c866fda9386315f51787f",
					"week": week_to_copy.week
				};
				if(week_to_copy.weekday){
					conds.weekday = week_to_copy.weekday;
				}
				
				workoutday.find(conds).forEach(function(wday){
					if(err){
						console.erorr("WD Error: "+err);
					}
					
					copyWorkoutday(wday, workoutday, workout, function(err, newwday){
						return;
					});
					
				});
			});
		}

	})

});
