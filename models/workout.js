(function(){
	const path = require('path');
	const util = require('util');
	var _ = require('lodash');

	var Model = require(".");

	function Workout(options, callback){
		options = util.isObject(options) ? options : {};
		options.collectionName = "workouts";
		var model = this;

		// Define any extra properties for this model here...
		// ...
		// model.something = something
		// ...

		Model.call(model, options, callback);
	}

	util.inherits(Workout, Model);

	// Extra functions related to this model...

	// ...

	Workout.prototype.verify = function(ex){
		return (
			typeof ex.trainer_id != 'undefined' &&
			typeof ex.label != 'undefined' &&
			typeof ex.type != 'undefined' &&
			(
				(
					ex.type == 'exercise' && 
					(
						typeof ex.description != 'undefined' ||
						typeof ex.steps != 'undefined'
					) && 
					typeof ex.strength_type != 'undefined' && 
					// typeof ex.body_types != 'undefined' && 
					// (typeof ex.main_equipments != 'undefined' || typeof ex.sub_equipments != 'undefined') && 
					typeof ex.repeat != 'undefined' &&
					typeof ex.gap_between_repetition != 'undefined' && 
					typeof ex.sets != 'undefined' && 
					typeof ex.gap_between_sets != 'undefined'
				) ||
				(
					ex.type == 'break' && 
					typeof ex.time != 'undefined'
				) ||
				(
					ex.type == 'group' && 
					typeof ex.children != 'undefined'
				)
			)
		);
	}

	Workout.prototype.calculateWorkoutTime = function(workout){
		var time = workout.time || '0';

		time = parseFloat(time);

		if(!time) return time;

		if(workout.repeat) {
			var repeat = parseFloat((workout.repeat || '1'));
			time = time * repeat + (repeat-1) * parseFloat((workout.gap_between_repetition || '0'));
		}

		if(workout.sets){
			var sets = parseFloat((workout.sets || '1'));
			time = time * sets + (sets-1) * parseFloat((workout.gap_between_sets || '0'));
		}

		return time;
	};

	Workout.prototype.loadWorkout = function(workoutId, callback){
		var wModel = this;
		if(!workoutId || workoutId.length != 24){
			return callback("Invalid workoutId: "+workoutId);
		}
		wModel.find({_id: Model.ObjectID(workoutId)}).limit(1).next(function(err, workout){
			if(err){
				return callback(err);
			}else if(!workout){
				return callback("Not found: "+workoutId);
			}

			var _loadWorkout0 = function(){
				if(typeof workout.body_types != 'undefined' && workout.body_types.length){
					var bp_ids = _.map(workout.body_types, function(bt){
						return Model.ObjectID(bt);
					});

					var model_bodypart = Model.load('bodypart', {}, function(err, model_bodypart){
						if(err){
							workout.body_types = [];
							_loadWorkout1();
						}else {
							model_bodypart.find({_id: {"$in": bp_ids}}).toArray(function(err, bodyparts){
								if(err){
									workout.body_types = [];
									_loadWorkout1();
								}else{
									workout.body_types = bodyparts;
									_loadWorkout1();
								}
							});
						}
					});
				}else{
					workout.body_types = [];
					_loadWorkout1();
				}
			};
			
			var _loadWorkout1 = function(){
				if(typeof workout.main_equipments != 'undefined' && workout.main_equipments.length){
					var mequip_ids = _.map(workout.main_equipments, function(mei){
						return Model.ObjectID(mei);
					});
					var model_equip = Model.load('equipment', {}, function(err, model_equip){
						if(err){
							workout.main_equipments = [];
							_loadWorkout2();
						}else{
							
							model_equip.find({_id: {"$in": mequip_ids}, type: "main"}).toArray(function(err, mequips){
								if(err){
									workout.main_equipments = [];
									_loadWorkout2();
								}else{
									workout.main_equipments = mequips;
									_loadWorkout2();
								}
							});
						}
					});
				}else{
					workout.main_equipments = [];
					_loadWorkout2();
				}
			};

			var _loadWorkout2 = function(){
				if(typeof workout.sub_equipments != 'undefined' && workout.sub_equipments.length){
					var mequip_ids = _.map(workout.sub_equipments, function(mei){
						return Model.ObjectID(mei);
					});
					var model_equip = Model.load('equipment', {}, function(err, model_equip){
						if(err){
							workout.sub_equipments = [];
							_loadWorkout3();
						}else{
							model_equip.find({_id: {"$in": mequip_ids}, type: "sub"}).toArray(function(err, sequips){
								if(err){
									workout.sub_equipments = [];
									_loadWorkout3();
								}else{
									workout.sub_equipments = sequips;
									_loadWorkout3();
								}
							});
						}
					});
				}else{
					workout.sub_equipments = [];
					_loadWorkout3();
				}
			};

			var _loadWorkout3 = function(){
				if(workout.type == 'exercise'){
					// var model_exercise = Model.load('exercise', {}, function(err, model_exercise){
					// 	if(err){
					// 		return callback(err);
					// 	}

					// 	model_exercise.find({_id: Model.ObjectID(workout.exercise)}).limit(1).next(function(err, exercise){
					// 		if(err) {
					// 			return callback("Invalid workout: "+err);
					// 		}
					// 		if(!exercise){
					// 			return callback("Invalid workout");
					// 		}

					// 		workout.exercise = exercise;

					// 		if(!workout.label && exercise.label){
					// 			workout.label = exercise.label;
					// 		}

					// 		callback(undefined, workout);
					// 	});
					// });
					/** Load Strength Data **/
					if(typeof workout.strength_type != 'undefined' && workout.strength_type && workout.strength_type.length == 24){
						var model_strength = Model.load('exercisestrength', {}, function(err, model_strength) {
							model_strength.find({_id:Model.ObjectID(workout.strength_type)}).next(function(err, strengthData){
								if(err){
									workout.strengthData = ''
									_loadWorkout4();
								}else{
									workout.strengthData = strengthData.label || ""
									_loadWorkout4();
								}
							})
							
						});
					}else{
						workout.strengthData = ''
						_loadWorkout4();
					}
					
				//callback(undefined, workout);
				}else if(workout.type == 'group'){
					var childWorkouts = [];
					var invalidChilds = [];

					
					var length = workout.children.length;
					var _loadChilds = function(i){
						if(i>=length){
							workout.children = childWorkouts;
							workout.invalidChilds = invalidChilds;
							if(!workout.time){
								workout.time = 0;
								_.forEach(workout.children, function(wc){
									workout.time += wModel.calculateWorkoutTime(wc);
								});
							}
							_loadWorkout4();
						}else {
							if(!workout.children[i] || workout.children[i].length != 24){
								return _loadChilds(i+1);
							}

							wModel.loadWorkout(workout.children[i], function(err, childWorkout){
								if(err){
									invalidChilds.push(workout.children[i]);
								}else{
									childWorkouts.push(childWorkout);
								}
								_loadChilds(i+1);
							});	
						}
						
					}
					_loadChilds(0);
					// callback(undefined, workout);

				}else if(workout.type == 'break'){
					_loadWorkout4();
				}
			};

			var _loadWorkout4 = function(){
				var alternateWorkouts = [];
				var invalidAlternates = [];

				
				var length = (workout.alternates || []).length;
				var _loadAlternates = function(i){
					if(i>=length){
						workout.alternates = alternateWorkouts;
						workout.invalidAlternates = invalidAlternates;
						callback(undefined, workout);
					}else {
						if(!workout.alternates[i] || workout.alternates[i].length != 24){
							return _loadAlternates(i+1);
						}

						wModel.loadWorkout(workout.alternates[i], function(err, alternateWorkout){
							if(err){
								invalidAlternates.push(workout.alternates[i]);
							}else{
								alternateWorkouts.push(alternateWorkout);
							}
							_loadAlternates(i+1);
						});	
					}
					
				}
				_loadAlternates(0);

			};

			_loadWorkout0();
			
		});
	};

	module.exports = Workout;

})();

