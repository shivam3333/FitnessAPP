(function (){
	var express = require('express');
	var jwt = require('jsonwebtoken');
	var _ = require('lodash');
	const path = require('path');
	const fs = require('fs');
	const util = require('util');
	const config = require(path.dirname(require.main.filename) + path.sep + 'config' + path.sep + 'index.json');
	const Model = require(path.dirname(require.main.filename) + path.sep + 'models');
	var router = express.Router();

	/* GET home page. */
	router.get('/', function(req, res, next) {
	  	res.json({
            error: true,
            message: "Unauthorized",
            responseCode: 0
        });
        res.end();
	});

	function sendError(res, obj, status){
		obj = util.isObject(obj) ? obj : {error: obj};
		obj.success = false;
		if(status){
			res.status(status);
		}
		res.json(obj);
	}

	function sendSuccess(res, obj){
		obj = util.isObject(obj) ? obj : {res: obj};
		obj.success = true;
		res.json(obj);
	}

	function moveFile(oldPath, newPath, callback){

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

	}

	router.post('/login', function(req, res, next) {
		if(!req.body){
			sendError(res, "User/pass is missing!!");
			return;
		}

		var user = req.body.user || "";
		var pass = req.body.password || "";

		if(!user || !pass){
			sendError(res, "User/pass is missing!!");
			return;
		}

		var admin_model = Model.load('admin', {}, function(err, admin_model){
			admin_model.find({user: user, pass: Model.password(pass)}).limit(1).next(function(err, isAdmin){
				if(isAdmin) {
					var token = jwt.sign({user: isAdmin, name: isAdmin.name, isGuest: false, isAdmin: true, isTrainer: false}, config.secret);
					sendSuccess(res, {token: token});
				}else{
					sendError(res, "User/pass is wrong!!");
				}
			});
		});
	});


	router.use(function(req, res, next){
		if(!req.userinfo){
			sendError(res, "Unauthorized", 401);
		} else if (req.userinfo.isAdmin || req.userinfo.isTrainer || !req.userinfo.isGuest) {
      next();
		} else {
      sendError(res, "Unauthorized", 401);
    }
	});



	router.get('/trainer', function(req, res, next){
		var model_trainer = Model.load('trainer', {}, function(err, model_trainer){
			if(err){
				sendError(res, "Failed to access db: "+err);
			} else{
				var conds = req.query.org_id ? { "org_id": req.query.org_id } : { "org_id": { $not: { "$exists": true } } };
				conds = req.query.email ? {...conds, email: req.query.email} : conds;

				model_trainer.find(conds).sort({"name": 1}).toArray(function(err, trainers){
					if(err){
						sendError(res, "Failed to retrieve trainers: "+err);
					}else{
						sendSuccess(res, {trainers: trainers});
					}
				});
			}
		});
	});

	router.get('/trainer/:id', function(req, res, next){
		var id = req.params.id;
		var model_trainer = Model.load('trainer', {}, function(err, model_trainer){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{
				model_trainer.find({_id: Model.ObjectID(id)}).limit(1).next(function(err, trainer){
					if(err){
						sendError(res, "Failed to retrieve trainer: "+err);
					}else if(!trainer){
						sendError(res, "Not found");
					}else{
						sendSuccess(res, {trainer: trainer});
					}
				});
			}
		});
	});

	/**
		** Copy Trainer With Plan Data
	**/

	/********* COPY INFLUENCER WITH PLAN DATA**********/


 	var copyExercise0 = function(w,trainer_id, callback) {
	 	var model_workout = Model.load('workout', {}, function(err, model_workout) {
	        if (err) {
	            sendError(res, "Failed to access db: " + err);
	        } else {
	            delete w._id;
	            w.label = w.label.replace(/\s+$/, '');
	            w.created_at = (new Date()).getTime();
	            w.updated_at = (new Date()).getTime();
	            model_workout.insert(w, function(err, res) {
	                if (err) {
	                    callback(err);
	                } else {

	                    callback(undefined, w);
	                }
	            });
	        }
	    })
    };
 	var copyExercise = function(workout,trainer_id, callback) {
        if (workout.alternates && workout.alternates.length) {
            var alternatesIds = [];
            var invalidalternates = [];
            workout.alternates.forEach(function(wc) {
                if (!wc || wc.length != 24) {
                    invalidalternates.push(wc);
                    if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                        workout.alternates = alternatesIds;
                        copyExercise0(workout,trainer_id, callback);
                    }
                } else {

                    copyWorkout(wc,trainer_id, function(err, nW) {
                        if (err) {
                            invalidalternates.push(wc);
                        } else {
                            alternatesIds.push(nW._id + "");
                        }
                        if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                            workout.alternates = alternatesIds;
                            copyExercise0(workout,trainer_id, callback);
                        }
                    });
                }

            });
        } else {
            copyExercise0(workout,trainer_id, callback);
        }
    };
	var copyWorkout = function(w,trainer_id, callback) {
		var model_workout = Model.load('workout', {}, function(err, model_workout) {
	        if (err) {
	            sendError(res, "Failed to access db: " + err);
	        } else {
	        	model_workout.findOne({"_id": Model.ObjectID(w)}, {}, function(err, workout) {
		            if (err) {
		                return callback(err);

		            } else if (!workout) {
                		return callback("Not found");
            		}
            		workout.trainer_id = trainer_id;
		            if (workout.type == 'group' && workout.children && workout.children.length) {
		                var childrenIds = [];
		                var invalidChildren = [];
		                var _saveChildren = function(i){
		                    if(i>=workout.children.length){
		                        workout.children = childrenIds;
		                        copyExercise(workout,trainer_id, callback);
		                    }else{
		                        if(!workout.children[i] || workout.children[i].length != 24){
		                            invalidChildren.push(workout.children[i]);
		                            _saveChildren(i+1);
		                        }else{
		                            copyWorkout(workout.children[i],trainer_id, function(err, nW){
		                                if(err){
		                                    invalidChildren.push(workout.children[i]+"");
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

		            } else {
		                copyExercise(workout,trainer_id, callback);
		            }
        		});
	        }
	    })
    };
	var copyWorkoutday = function(wday, WorkoutDay, callback){
        copyWorkout(wday.workout,wday.trainer_id, function(err, newWorkout){
            if(newWorkout){
                delete wday._id;
                wday.workout = newWorkout._id+"";
                WorkoutDay.insert(wday, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(undefined, wday);
                    }
                });
            }else{
                callback("Failed copying workout day: "+wday._id+", "+err);
            }
        });
    };

	function get_trainer_plans(old_trainer_id,new_trainer_id,callback){
		var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if(err){
                callback({status:false,message:"Failed to access db: " + err});
            }else{
            	model_tp.find({trainer_id:old_trainer_id}).toArray(function(errtp,restp){
        		 	if(err){
		                callback({status:false,message:"Failed to access db: " + errtp});
		            }else{

		            	if(restp.length > 0){
		            		var loadedSavedPlans = 0
		            		restp.forEach((trainerdata,index)=>{
		            			var old_plan_id = trainerdata._id+"";
		            			trainerdata.trainer_id = new_trainer_id+"";
			            		delete trainerdata._id;
			            		model_tp.insert(trainerdata,function(errntp,resntp){
		            			 	if(errntp){
						                callback({status:false,message:"Failed to access db: " + err});
						            }else{
						            	var new_trainer_plan_id = trainerdata._id;

						            	Model.load('workoutday', {}, function(err, model_workoutday){
						            		if(model_workoutday){
						            			model_workoutday.find({plan_id:old_plan_id,trainer_id:old_trainer_id+""}).toArray(function(err, workoutdays) {
							                        var savedDayData = [];
							                        var invalidSavedDayData = [];
							                        workoutdays.forEach(function(wday){
							                            if(err){
															console.error("WD Error: "+err);
							                            	callback({status:false,message:"WD Error: "+err});
							                                return;
							                            }else{
								                            wday.trainer_id  = new_trainer_id+"";
								                            wday.plan_id = new_trainer_plan_id+"";
								                            copyWorkoutday(wday, model_workoutday, function(err, newwday){
								                                if(newwday){
								                                    savedDayData.push(newwday._id);
								                                }else{
								                                    invalidSavedDayData.push(wday._id);
								                                }

								                                if (++loadedSavedPlans >= restp.length) {
								                                	callback({status:true,message:"All Plans Copied successfully"});
							                                    }
								                            });
							                            }

							                        });
							                    });
						            		}
						            	})
									}
			            		})
		            		})
	    				}
		            }
            	})
            }
        })
	}

	function copy_tags(old_trainer_id,new_trainer_id,callback){
		Model.load('musiccategory', {}, function(err, musiccategory){
			if(err){
				callback({status:false,message:"Error2: "+err});
			}else{
				musiccategory.find({trainer_id:old_trainer_id}).toArray(function(err,data){
					if(data.length > 0){
						data.forEach((musicdata,index)=>{
							delete musicdata._id;
							musicdata.trainer_id = new_trainer_id+"";
							musiccategory.insert(musicdata,function(errmdata,resmdata){
								if(errmdata){
					                callback({status:false,message:"Failed to access db: " + errmdata});
					            }else{
					            	callback({status:true,message:"Success"});
					            }
							})
						});
					}else{
						callback({status:false,message:"No music category availables."});
					}
				})
			}
		})
	}

    /********* COPY INFLUENCER**********/

	router.put('/trainer', function(req, res, next){
    var tr = req.body.trainer;
    const noCopy = req.query.noCopy;
		var model_trainer = Model.load('trainer', {}, function(err, model_trainer){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{

				tr.user = tr.email;
				if(tr.password) {
					tr.password = Model.password(tr.password);
				}

				if(model_trainer.verify(tr)){

					var _insertUser = function(trainer){
						var model_user = Model.load('user', {}, function(err, model_user){
							if(err){
								return sendError(res, "Failed to access db: "+err);
							}
							var trainer_id = trainer._id.toString();
							model_user.find({email: tr.email, trainer_id: trainer_id}).limit(1).next(function(err, existingUser){
								if(err){
									return sendError(res, "Something went wrong: "+err);
								}

								if(existingUser){
									return sendError(res, "Email already registered!");
								}

								var user = {
									user: tr.email,
									email: tr.email,
									facebook_id: "",
                  google_id: "",
                  org_id: tr.org_id || undefined,
									trainer_id: trainer_id,
									password: tr.password,
									device_token: '',
									profile: {
										name: tr.firstname + ' ' + tr.lastname,
										image: '',
										gender: '',
										height: '',
										weight: '',
										starting_weight: '',
										current_weight: '',
										goal_weight: '',
										diet: '',
										dob: '',
										notifications: '',
										status: 'new',
										subscribed_plan: '0'
									},
									joined_on: (new Date()).getTime(),
									subscribed_on: false,
									subscription: false,
									plans: [],
									is_trainer: true,
									active: true,
									verified: true//generatePassword(12),
								};
								if(model_user.verify(user)){
									var _saveUser = function(){
										model_user.insertOne(user, {}, function(err, insertedUser){
											if(err){
												sendError(res, "Failed to register user: "+err);
											}else {
												sendSuccess(res, {res: trainer, trainer: tr, user: user});
											}
										});
									};
									_saveUser();
								}else{
									sendError(res, "Invalid data for user");
								}
							});
						});
					};

					if(req.files && req.files.length){

						var baseFolder = path.join(path.dirname(require.main.filename), "uploads/trainers/");

						Model.uploadFilesEx(req, baseFolder, (tr.name).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
							if(!succeeded.length){
								sendError(res, "Failed to upload all file(s)");
							}/*else if(!fields.app_logo){
								sendError(res, "Failed to upload app logo");
							}else if(!fields.image){
								sendError(res, "Failed to upload trainer photo");
							}*/else{
								if(typeof fields.image != 'undefined') {
									tr.image = fields.image.shift();
									tr.images = fields.image;
								}else{
									tr.image = null;
									tr.images = [];
								}

								if(typeof fields.app_logo != 'undefined'){
									tr.app_info.app_logo = fields.app_logo.shift();
								}

								model_trainer.insertOne(tr, {}, function(err, trainer){
									if(err){
										sendError(res, "Failed to insert: "+err);
									}else{
										var new_trainer_id = tr._id;

									/* COPY N/A TRAINER DATA START*/

										var trainer_id = '5ad66a5bc1ce3e3463754200'; //N/A Trainer ID

										get_trainer_plans(trainer_id,new_trainer_id,function(response_nt){
											if(!response_nt.status) console.error("Something went wrong, when copied plans ");
										})
										copy_tags(trainer_id,new_trainer_id,function(responseMusic_cat){
											if(!responseMusic_cat.status) console.error("Something went wrong, when copied music tags ");
										})
										_insertUser(tr);
									}
								});
							}
						});
					}else{
						tr.image = null;
						tr.images = [];
						tr.app_info.app_logo = null;
						model_trainer.insertOne(tr, {}, function(err, trainer){
							if(err){
								sendError(res, "Failed to insert: "+err);
							}else{
								var new_trainer_id = tr._id;

							/* COPY N/A TRAINER DATA START*/

                if (!noCopy || noCopy === false || noCopy === "false") {
                  var trainer_id = '5ad66a5bc1ce3e3463754200'; //N/A Trainer ID

                  get_trainer_plans(trainer_id,new_trainer_id,function(response_nt){
                    if(!response_nt.status) console.error("Something went wrong, when copied plans ");
                  })
                  copy_tags(trainer_id,new_trainer_id,function(responseMusic_cat){
                    if(!responseMusic_cat.status) console.error("Something went wrong, when copied music tags ");
                  })

                  _insertUser(tr);
                } else {
				  var token = jwt.sign({trainer: tr, isGuest: false, isAdmin: false, isTrainer: true}, config.secret);
                  sendSuccess(res, {res: trainer, trainer: tr, token: token});
                }
							}
						});
					}

				}else{
					sendError(res, "Invalid data for trainer");
				}
			}
		});
	});

	router.post('/trainer/:id', function(req, res, next){
		var tr = req.body.trainer;
		var removeImages = req.body.removeImages || [];
		var replace = req.body.replace || false;
		var id = req.params.id;

		var model_trainer = Model.load('trainer', {}, function(err, model_trainer){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{

				if(tr.password) {
					tr.password = Model.password(tr.password);
				}

				var conds = {
					_id: new Model.ObjectID(id)
				};


				model_trainer.find(conds).limit(1).next(function(err, trainer){
					if(err){
						sendError(res, "Failed to retrieve trainer: "+err);
					}else if(!trainer){
						sendError(res, "Not found");
					}else{

						if(!replace) {
							_.defaultsDeep(tr, trainer);
							delete tr._id;
						}
						if(model_trainer.verify(tr)){
							if(req.files && req.files.length){
								var baseFolder = path.join(path.dirname(require.main.filename), "uploads/trainers/");

								Model.uploadFilesEx(req, baseFolder, (tr.name).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
									if(!succeeded.length){
										sendError(res, "Failed to upload all file(s)");
									}else{

										if(typeof fields.image != 'undefined') {
											tr.image = fields.image.shift();
										}

										if(typeof fields.images != 'undefined'){
											tr.images = fields.images;
										}else {
											tr.images = [];
										}

										if(typeof fields.video != 'undefined'){
											tr.video = fields.video.shift();
										}

										if(typeof fields.videos != 'undefined'){
											tr.videos = fields.videos;
										}else {
											tr.videos = [];
										}


										if(typeof fields.app_logo != 'undefined') {
											tr.app_info.app_logo = fields.app_logo.shift();
										}



										if(replace){
											if(!tr.image && tr.images && tr.images.length){
												tr.image = tr.images.shift();
											}

											if(!tr.video && tr.videos && tr.videos.length){
												tr.video = tr.videos.shift();
											}
											model_trainer.replaceOne(conds, tr, function(err, trainer){
												if(err){
													sendError(res, "Failed to replace record: "+err);
												}else{
													sendSuccess(res, {res: trainer, replaced: true});
												}
											});
										}else{

											if(removeImages.length){
												for(var i=0; i<removeImages.length; i++){
													trainer.images.splice(trainer.images.indexOf(removeImages[i]), 1);
												}
											}

											if(trainer.images && trainer.images.length){
												tr.images = tr.images || [];
												for(var i=0; i<trainer.images.length; i++){
													tr.images.push(trainer.images[i]);
												}
											}

											model_trainer.updateOne(conds, {$set: tr}, function(err, trainer){
												if(err){
													sendError(res, "Failed to update record: "+err);
												}else{
													sendSuccess(res, {res: trainer, replaced: false});
												}
											});
										}
									}
								});
							}else {
								if(replace){
									model_trainer.replaceOne(conds, tr, function(err, trainer){
										if(err){
											sendError(res, "Failed to replace record: "+err);
										}else{
											sendSuccess(res, {res: trainer, replaced: true});
										}
									});
								}else{
									if(removeImages.length){
										for(var i=0; i<removeImages.length; i++){
											trainer.images.splice(trainer.images.indexOf(removeImages[i]), 1);
										}
									}


									tr.images = trainer.images;

									model_trainer.updateOne(conds, {$set: tr}, function(err, trainer){
										if(err){
											sendError(res, "Failed to update record: "+err);
										}else{
											sendSuccess(res, {res: trainer, replaced: false});
										}
									});
								}
							}
						}else {
							sendError(res, "Invalid data for trainer!");
						}

					}
				});
			}
		});
	});

	router.delete('/trainer/:id', function(req, res, next){
		var id = req.params.id;

		var model_trainer = Model.load('trainer', {}, function(err, model_trainer){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{
				model_trainer.deleteOne({_id: Model.ObjectID(id)}, {}, function(err, trainer){
					if(err){
						sendError(res, "Failed to delete: "+err);
					}else{
						sendSuccess(res, {res: trainer});
					}
				});
			}
		});
	});


    /**
        @@ Orgs Modules
        @@ Add/Edit/Delete Org

    **/

  router.get('/org', function (req, res, next) {
    var model_org = Model.load('org', {}, function (err, model_org) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {};
        model_org.find(conds).sort({
          'created_at': -1
        }).toArray(function (err, dbres) {
          if (err) {
            sendError(res, "Failed to retrieve orgs: " + err);
          } else {
            sendSuccess(res, {
              org: dbres
            });
          }
        });
      }
    });
  });

  router.get('/org/:id', function (req, res, next) {
    var id = req.params.id;
    var model_org = Model.load('org', {}, function (err, model_org) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };
        model_org.find(conds).limit(1).next(function (err, dbres) {
          if (err) {
            sendError(res, err);
          } else if (!dbres) {
            sendError(res, "Not found");
          } else {
            sendSuccess(res, {
              org: dbres
            });
          }
        });
      }
    });
  });

  router.post('/org/:id', function (req, res, next) {
    var posted_data = req.body.org;
    var id = req.params.id;
    var replace = req.body.replace || false;

    var model_org = Model.load('org', {}, function (err, model_org) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {

        var conditions = {
          _id: new Model.ObjectID(id)
        };
        model_org.find(conditions).limit(1).next(function (err, result) {
          if (err) {
            sendError(res, err);
          } else if (!result) {
            sendError(res, "Not found");
          } else {
            if (!replace) {
              _.defaults(posted_data, result);
              delete posted_data._id;
            }

            if (model_org.verify(posted_data)) {

              if (replace) {
                model_org.replaceOne(conditions, posted_data, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to replace record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      org: posted_data
                    });
                  }
                });
              } else {
                model_org.updateOne(conditions, {
                  $set: posted_data
                }, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to update record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      org: posted_data
                    });
                  }
                });
              }
            } else {
              sendError(res, "Invalid data for org");
            }
          }
        });
      }
    });
  });

  router.put('/org', function (req, res, next) {
    var posted_data = req.body.org;

    var model_org = Model.load('org', {}, function (err, model_org) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        if (model_org.verify(posted_data)) {

          model_org.insertOne(posted_data, {}, function (err, dbres) {
            if (err) {
              sendError(res, "Failed to insert record: " + err);
            } else {
              sendSuccess(res, {
                res: dbres,
                org: posted_data
              });
            }
          });
        } else {
          sendError(res, "Invalid data for video category");
        }
      }
    });
  });

  router.delete('/org/:id', function (req, res, next) {
    var id = req.params.id;
    var model_org = Model.load('org', {}, function (err, model_org) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };

        model_org.deleteOne(conds, {}, function (err, response) {
          if (err) {
            sendError(res, err);
          } else {
            sendSuccess(res, {
              res: response
            });
          }
        });
      }
    });
  });

  /**
   	@@ Get client by email for PW resets
  **/

 router.get('/client', function(req, res, next){
	var email = req.query.email || false;
	var org = req.query.org_id || false;

	if(email && org) {
		var model_client = Model.load('user', {}, function(err, model_client){
			if(err){
				sendError(res, "Failed to access db: "+err);
			} else{
				var conds = { "org_id": org, "email": email };

				model_client.find(conds).toArray(function(err, clients){
					if(err){
						sendError(res, "Failed to retrieve client: "+err);
					}else{
						if(clients.length > 0) {
							sendSuccess(res, {client: clients});
						}
						else {
							sendError(res, "Client not found");
						}
					}
				});
			}
		});
	}
	else {
		sendError({}, "Missing email or org Id")
	}
});




    /**
        @@ EquipmentTypes Modules
        @@ Add/Edit/Delete EquipmentType

    **/

  router.get('/equipmentType', function (req, res, next) {
    var model_equipmentType = Model.load('equipmentType', {}, function (err, model_equipmentType) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {};
        model_equipmentType.find(conds).sort({
          'created_at': -1
        }).toArray(function (err, dbres) {
          if (err) {
            sendError(res, "Failed to retrieve equipmentTypes: " + err);
          } else {
            sendSuccess(res, {
              equipmentType: dbres
            });
          }
        });
      }
    });
  });

  router.get('/equipmentType/:id', function (req, res, next) {
    var id = req.params.id;
    var model_equipmentType = Model.load('equipmentType', {}, function (err, model_equipmentType) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };
        model_equipmentType.find(conds).limit(1).next(function (err, dbres) {
          if (err) {
            sendError(res, err);
          } else if (!dbres) {
            sendError(res, "Not found");
          } else {
            sendSuccess(res, {
              equipmentType: dbres
            });
          }
        });
      }
    });
  });

  router.post('/equipmentType/:id', function (req, res, next) {
    var posted_data = req.body.equipmentType;
    var id = req.params.id;
    var replace = req.body.replace || false;

    var model_equipmentType = Model.load('equipmentType', {}, function (err, model_equipmentType) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {

        var conditions = {
          _id: new Model.ObjectID(id)
        };
        model_equipmentType.find(conditions).limit(1).next(function (err, result) {
          if (err) {
            sendError(res, err);
          } else if (!result) {
            sendError(res, "Not found");
          } else {
            if (!replace) {
              _.defaults(posted_data, result);
              delete posted_data._id;
            }

            if (model_equipmentType.verify(posted_data)) {

              if (replace) {
                model_equipmentType.replaceOne(conditions, posted_data, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to replace record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      equipmentType: posted_data
                    });
                  }
                });
              } else {
                model_equipmentType.updateOne(conditions, {
                  $set: posted_data
                }, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to update record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      equipmentType: posted_data
                    });
                  }
                });
              }
            } else {
              sendError(res, "Invalid data for equipmentType");
            }
          }
        });
      }
    });
  });

  router.put('/equipmentType', function (req, res, next) {
    var posted_data = req.body.equipmentType;

    var model_equipmentType = Model.load('equipmentType', {}, function (err, model_equipmentType) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        if (model_equipmentType.verify(posted_data)) {

          model_equipmentType.insertOne(posted_data, {}, function (err, dbres) {
            if (err) {
              sendError(res, "Failed to insert record: " + err);
            } else {
              sendSuccess(res, {
                res: dbres,
                equipmentType: posted_data
              });
            }
          });
        } else {
          sendError(res, "Invalid data for video category");
        }
      }
    });
  });

  router.delete('/equipmentType/:id', function (req, res, next) {
    var id = req.params.id;
    var model_equipmentType = Model.load('equipmentType', {}, function (err, model_equipmentType) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };

        model_equipmentType.deleteOne(conds, {}, function (err, response) {
          if (err) {
            sendError(res, err);
          } else {
            sendSuccess(res, {
              res: response
            });
          }
        });
      }
    });
  });

	module.exports = router;

	// Optionally set a different controller name...this defaults to current file path, excluding base route dir path and file extension.
	// So, for a file, /routes/foo/bar/foobar.js, where /routes/ is base route dir, controller will default to foo/bar/foobar
	// Also, if some file is named index.js, then the full name is ignored, but the path is taken into consideration for defining controller name

	//module.exports.controller = "api";
})();


