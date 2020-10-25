// B&L PLYOS

// 57d000fbdf50a74bb704573a
// 57d00905df50a74bb7045740


// UP BODY
// 57d00828df50a74bb704573e
// 57d009cadf50a74bb7045742

var path = require('path');
var Model = require('./models');

var backup_collection_postfix = process.argv[2] || '_bak';
var copyFrom = process.argv[3] || 0;
var copyTo = process.argv[4] || 0;

if(copyFrom.indexOf(':') > 0){
	var cf = copyFrom.split(':');
	copyFrom = {
		week: cf[0],
		weekday: cf[1]
	};
}else{
	copyFrom = {
		week: copyFrom
	};
}

if(copyTo.indexOf(':') > 0){
	var ct = copyTo.split(':');
	copyTo = {
		week: ct[0],
		weekday: ct[1]
	};
}else{
	copyTo = {
		week: copyTo
	};
}

Model.init();

function copyExercise(w, Workout, callback){
	delete w._id;
	// if(w.body_types && w.body_types.length){
	// 	w.body_types = w.body_types.map(function(bt){
	// 		if(typeof bt == 'object' && bt._id){
	// 			return bt._id.str;
	// 		}else{
	// 			return bt;
	// 		}
	// 	});
	// }
	// if(w.main_equipments && w.main_equipments.length){
	// 	w.main_equipments = w.main_equipments.map(function(bt){
	// 		if(typeof bt == 'object' && bt._id){
	// 			return bt._id.str;
	// 		}else{
	// 			return bt;
	// 		}
	// 	});
	// }
	// if(w.sub_equipments && w.sub_equipments.length){
	// 	w.sub_equipments = w.sub_equipments.map(function(bt){
	// 		if(typeof bt == 'object' && bt._id){
	// 			return bt._id.str;
	// 		}else{
	// 			return bt;
	// 		}
	// 	});
	// }
	Workout.insert(w, function(err, res){
		if(err){
			callback(err);
		}else{
			
			callback(undefined, w);
		}
	});
}
function copyWorkout1(w, Workout, callback){

	Workout.db.collection('workout'+backup_collection_postfix).findOne({"_id": Model.ObjectID(w)}, {}, function(err, workout){
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
									console.warn("Invalid "+workout.children[i]);
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

	// Workout.db.collection('workout'+backup_collection_postfix).findOne({"_id": Model.ObjectID(w)}, {}, function(err, workout){
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
									console.warn("Invalid "+workout.alternates[i]);
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
	copyWorkout1(wday.workout, Workout, function(err, newWorkout){
		if(newWorkout){
			delete wday._id;
			wday.workout = newWorkout._id+"";
			wday.week = copyTo.week;
			if(copyTo.weekday){
				wday.weekday = copyTo.weekday;
			}
			WorkoutDay.insert(wday, function(err, res){
				if(err){
					callback(err);
				}else{
					callback(undefined, wday);
				}
			});
		}else{
			callback("Failed copying workout day: "+wday._id+", "+err);
		}
	});
}

if(!copyFrom && !copyTo){
	console.warn("Invalid Usage");
	process.exitCode = 1;
}else {
	Model.load('workoutday', {}, function(err, workoutday){
  
		if(err){
			console.error("Error1: "+err);
		}
		Model.load('workout', {}, function(err, workout){

			if(err){
				console.error("Error2: "+err);
			}

			var cond1 = {
				// FnT
				// "trainer_id": "57c5310521bbac1d01aa75db", "plan_id": "57cd0c85df50a74bb70456d6",
				// TWL
				//"trainer_id": "584fbe1dadbdd05d535cddae", "plan_id": "58b5ced403e7e079550d2b22",
				// Fit With Whit
				// "trainer_id": "59b174cfab77c775bae7c6a2", "plan_id": "59b1785dab77c775bae7c6a4",
				// Bakhar Nabieva
				// "trainer_id": "5bd9e069da6a6b3a240de6dd", "plan_id": "5d8d42805991d165395c97ec",
				// Massy
				// "trainer_id": "5ccc64cfd17f9f5d70b9b227", "plan_id": "5cf18be1442e30348acf2493",
				// Z Body 
				// "trainer_id": "5dfa142629ed6803c3d236ce", "plan_id": "5dfb3ec613890a8505205c14",
				// Lais DeLeon
				// "trainer_id": "59e4ea0878c2ed3818c7c0de", "plan_id": "5d66d792263ba05984c8817a",
				// Lift With Cass
				// "trainer_id": "5aa6e4c527d727022ed0a9a8", "plan_id": "5defeef19791377ef51315b8",
				// Erin Opera
				// "trainer_id": "5da625b54eca18246d33be28", "plan_id": "5daa3e7e09be946ad1441700",
				// Curvy & Cut
				// "trainer_id": "5aea2440a87c277c2e2bf738", "plan_id": "5df28a909791377ef51317f9",
				// Massy
				// "trainer_id": "5ccc64cfd17f9f5d70b9b227", "plan_id": "5cf18be1442e30348acf2493",
				// Erin Opera
				"trainer_id": "5da625b54eca18246d33be28", "plan_id": "5daa3e7e09be946ad1441700",
				// DFG
				// "trainer_id": "586f341b1cfef774222b1821", "plan_id": "586f4679ee820b73c0280164",
				// MTC
				// "trainer_id": "5822bfb2b86828570dd90899", "plan_id": "5822bfd0b86828570dd9089a",
				// Mike Chabot French
                		// "trainer_id": "59bc29ff25d96c751aa76b3d", "plan_id": "59bfc06ba9465ffd861b4ac0",
				// Nikki
				// "trainer_id": "59177d25980aa43e2715a8fe", "plan_id": "5919dbfb980aa43e2715a909",
				// MN
				// "trainer_id": "58f66e596e288005867db979", "plan_id": "58f8f452de9e0f18cbf4633e",
				"week": copyTo.week
			};
			if(copyTo.weekday){
				cond1.weekday = copyTo.weekday;
			}

			var cond2 = {
				// FnT
				// "trainer_id": "57c5310521bbac1d01aa75db", "plan_id": "57cd0c85df50a74bb70456d6",
				// TWL
				// "trainer_id": "584fbe1dadbdd05d535cddae", "plan_id": "58b5ced403e7e079550d2b22",
				// Fit With Whit
				// "trainer_id": "59b174cfab77c775bae7c6a2", "plan_id": "59b1785dab77c775bae7c6a4",
				// Bakhar Nabieva
                                // "trainer_id": "5bd9e069da6a6b3a240de6dd", "plan_id": "5d8d42805991d165395c97ec",
				// Massy 
                                // "trainer_id": "5ccc64cfd17f9f5d70b9b227", "plan_id": "5cf18be1442e30348acf2493",
                                // Z Body
				// "trainer_id": "5a848f72c3b5c3530a8d05f1", "plan_id": "5dea9dd69791377ef513132c",
				// Lais DeLeon
                                // "trainer_id": "59e4ea0878c2ed3818c7c0de", "plan_id": "5d66d792263ba05984c8817a",
				// Lift With Cass
                                // "trainer_id": "5aa6e4c527d727022ed0a9a8", "plan_id": "5defeef19791377ef51315b8",
				// Erin Opera
                                // "trainer_id": "5da625b54eca18246d33be28", "plan_id": "5daa3e7e09be946ad1441700",
				// Curvy & Cut
                                // "trainer_id": "5aea2440a87c277c2e2bf738", "plan_id": "5df28a909791377ef51317f9",
				// Massy
                                // "trainer_id": "5ccc64cfd17f9f5d70b9b227", "plan_id": "5cf18be1442e30348acf2493",
				// Erin Opera
                                "trainer_id": "5da625b54eca18246d33be28", "plan_id": "5daa3e7e09be946ad1441700",
				// DFG
				// "trainer_id": "586f341b1cfef774222b1821", "plan_id": "586f4679ee820b73c0280164",
				// MTC
				// "trainer_id": "5822bfb2b86828570dd90899", "plan_id": "5822bfd0b86828570dd9089a",
				// Mike Chabot French
                		// "trainer_id": "59bc29ff25d96c751aa76b3d", "plan_id": "59bfc06ba9465ffd861b4ac0",
				// Nikki
				// "trainer_id": "59177d25980aa43e2715a8fe", "plan_id": "5919dbfb980aa43e2715a909",
				// MN
				// "trainer_id": "58f66e596e288005867db979", "plan_id": "58f8f452de9e0f18cbf4633e",
				"week": copyFrom.week
			};
			if(copyFrom.weekday){
				cond2.weekday = copyFrom.weekday;
			}


			if(workoutday){
				// Remove existing copyTo week
				
				workoutday.remove(cond1);
				// Now fetch copyFrom week
				
				workoutday.db.collection('workoutday'+backup_collection_postfix).find(cond2).forEach(function(wday){
					if(err){
						return console.error("WD Error: "+err);
					}				
					
					copyWorkoutday(wday, workoutday, workout, function(err, newwday){
						if(err){
							console.err(err);
						}
					});
					
				});
			}
		})

	});
}


