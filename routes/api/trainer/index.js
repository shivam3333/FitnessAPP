(function() {
    var express = require('express');
    var jwt = require('jsonwebtoken');
    var _ = require('lodash');
    const path = require('path');
    const config = require(path.dirname(require.main.filename) + path.sep + 'config' + path.sep + 'index.json');
    const Model = require(path.dirname(require.main.filename) + path.sep + 'models');
    var router = express.Router();
    const util = require('util');
    var moment = require('moment');

    const mailer = require(path.dirname(require.main.filename) + path.sep + 'mailer.js');

    function sendError(res, obj, status) {
        obj = util.isObject(obj) ? obj : {
            error: obj
        };
        obj.success = false;
        if (status) {
            res.status(status);
        }
        res.json(obj);
    }

    function sendSuccess(res, obj) {
        obj = util.isObject(obj) ? obj : {
            res: obj
        };
        obj.success = true;
        res.json(obj);
    }

    function checkEmpty (e) {
        switch (e) {
            case "":
            case 0:
            case "0":
            case null:
            case "null":
            case "NULL":
            case "undefined":
            case undefined:
            case false:
            case typeof this == "undefined":
              return true;
            default:
              return false;
        }
    }

    /**
        @@ Code at @30May 2019
        @@ In APP and Push Notifications
    **/

    /**
        @@Function to send In-app Notification
    **/
    function sendTrainerInappNotification(posted_data, trainerId, cb){
        var model_user = Model.load('user', {}, function(err3, model_user) {
            if (err3) {
                cb('error', "Failed to load user: " + err3);
            } else {

                model_user.find({trainer_id:trainerId},{"profile.device_type":1, "device_token": 1}).toArray(function(err4, all_users) {
                    if (err4) {
                        cb('error', "Failed to find record: " + err4);
                    } else {
                        var data = {};
                        data.title = posted_data.title;
                        data.body = posted_data.message;
                        data.sound = 'ping.aiff';
                        data.dryRun = false;
                        data.custom = {}
                        data.custom.status = (checkEmpty(posted_data.status) == false)?posted_data.status:0;
                        data.custom.start_date = posted_data.start_date;
                        data.custom.end_date = posted_data.end_date;
                        data.custom.time = (checkEmpty(posted_data.time) == false)?posted_data.time:'';
                        data.custom.timezone = (checkEmpty(posted_data.timezone) == false)?posted_data.timezone:'';
                        data.custom.button_title = (checkEmpty(posted_data.button_title) == false)?posted_data.button_title:'';
                        data.custom.button_title_2 = (checkEmpty(posted_data.button_title_2) == false)?posted_data.button_title_2:'';
                        data.custom.button_action = (checkEmpty(posted_data.button_action) == false)?posted_data.button_action:'';
                        data.custom.button_action_2 = (checkEmpty(posted_data.button_action_2) == false)?posted_data.button_action_2:'';
                        data.custom.button_action_target = (checkEmpty(posted_data.button_action_target) == false)?posted_data.button_action_target:'';
                        data.custom.button_action_target_2 = (checkEmpty(posted_data.button_action_target_2) == false)?posted_data.button_action_target_2:'';
                        data.custom.screen_id_name = (checkEmpty(posted_data.screen_id_name) == false)?posted_data.screen_id_name:'';
                        data.custom.screen_id_name_2 = (checkEmpty(posted_data.screen_id_name_2) == false)?posted_data.screen_id_name_2:'';
                        data.custom.image = (checkEmpty(posted_data.image) == false)?config.base_url+'uploads/notifications/'+posted_data.image:'';
                        data.custom.type = 'inapp_notification';
                        data.custom.trainer_id = trainerId;
                        data.custom.notification_id = posted_data._id;

                        // Multiple destinations
                        const registrationIds = [];
                        if(all_users && all_users.length>0){
                            var i = 0;
                            all_users.forEach(function(user){

                                var model_get_notification = Model.load('get_notification', {}, function(gnerr, model_get_notification){
                                    if(gnerr){
                                        sendError(res, "Failed to access db :" +gnerr);
                                    } else {

                                        var conditions = {
                                            type: 'push',
                                            sub_type: 'inapp_notification',
                                            user_id: user._id,
                                            trainer_id: trainerId,
                                            read_status: "y"
                                        };

                                        var _viewNotificationCount = function(conditions, callback) {
                                            model_get_notification.find(conditions).count(callback)
                                        };
                                        _viewNotificationCount(conditions, function(error, dbres){
                                            if(error){
                                                sendError(res, "Failed to get notification data :" +error);
                                            } else {
                                                var total = parseInt(dbres);
                                                if(total <= 0){
                                                    if(user.device_token){
                                                        registrationIds.push(user.device_token);
                                                    }
                                                }

                                                if(++i >= all_users.length){
                                                    if( registrationIds && registrationIds.length ){
                                                        Model.sendPushNotification(["iOS", "Android"], registrationIds, data, trainerId)
                                                        cb('success',1);
                                                    } else {
                                                        cb('error',0);
                                                    }
                                                }
                                            }
                                        });
                                    }
                                });
                            });
                        } else {
                            console.warn('- No User Found -');
                            cb('error',0);
                        }
                    }
                });
            }
        })
    }

    /**
        @@Function to send Push Notification
    **/
    function sendTrainerPushNotification(posted_data, trainerId, cb){
        var model_user = Model.load('user', {}, function(err3, model_user) {
            if (err3) {
                cb('error', "Failed to load user: " + err3);
            } else {

                model_user.find({trainer_id:trainerId},{"profile.device_type":1, "device_token": 1}).toArray(function(err4, all_users) {
                    if (err4) {
                        cb('error', "Failed to find record: " + err4);
                    } else {

                        var data = {};
                        data.title = posted_data.title;
                        data.body = posted_data.message;
                        data.sound = 'ping.aiff';
                        data.dryRun = false;
                        data.custom = {}
                        data.custom.start_date = posted_data.start_date;
                        data.custom.time = (checkEmpty(posted_data.time) == false)?posted_data.time:'';
                        data.custom.timezone = (checkEmpty(posted_data.timezone) == false)?posted_data.timezone:'';
                        data.custom.type = 'push_notification';
                        data.custom.trainer_id = trainerId;
                        data.custom.notification_id = posted_data._id;

                        // Multiple destinations
                        const registrationIds = [];
                        if(all_users && all_users.length>0){
                            var i = 0;
                            all_users.forEach(function(user){

                                if(user.device_token){
                                    registrationIds.push(user.device_token);
                                }

                                if(++i >= all_users.length){
                                    if( registrationIds && registrationIds.length ){
                                        Model.sendPushNotification(["iOS", "Android"], registrationIds, data, trainerId)
                                        cb('success',1);
                                    } else {
                                        cb('error',0);
                                    }
                                }
                            });
                        } else {
                            console.warn('- No User Found -');
                            cb('error',0);
                        }
                    }
                });
            }
        })
    }

    /* Get time difference in minutes */
    function calculateTime(timezone, cTime, nTime) {
        var splitTime = timezone.split(":");

        if(splitTime[0] < 0){
            var uSplitTime = parseInt(splitTime[0]) + 1;
            var uTimezone = uSplitTime+':'+splitTime[1];
        } else {
            var uTimezone = timezone;
        }

        var mDate = moment().utcOffset(uTimezone).format('YYYY/MM/DD');
        var timeStart = new Date(mDate+' '+cTime);
        var timeEnd = new Date(mDate+' '+nTime);

        if(timeStart >= timeEnd){
            var diff = Math.abs(timeStart - timeEnd);
            var minutes = Math.floor((diff/1000)/60);

            if(minutes <= 15){
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /* Cron for In-app Notifications */
    router.get('/cron_inapp_notifications', function(req, res, next) {
        console.info("--Start Cron inapp notifications --");
        var model_notification = Model.load('notification', {}, function(lnerr, model_notification) {
            if (lnerr) {
                sendError(res, "Failed to access db: " + lnerr);
            } else {
                var currentDate = moment().format('YYYY-MM-DD');
                var conds = {
                    'notification_type': 'inapp_notification',
                    'status' : true,
                    $and: [
                        {'start_date': {$lte: currentDate}},
                        {'end_date': {$gte: currentDate}}
                    ]
                };

                var sortOrder = { 'created_at': -1 }
                model_notification.find(conds).sort(sortOrder).toArray(function(nerr, notis) {
                    if (nerr) {
                        console.warn("Failed to retrieve notification data.")
                        sendError(res, "Failed to retrieve notification data : " + nerr)
                    } else {
                        var n = 0;
                        if(notis && notis.length) {
                            notis.forEach(function(noti, index) {
                                var cDate = moment().utcOffset(noti.timezone).format('YYYY-MM-DD');
                                var cTime = moment().utcOffset(noti.timezone).format('HH:mm');

                                if(cDate >= noti.start_date && cDate <= noti.end_date){

                                    var timeCheck = calculateTime(noti.timezone, cTime, noti.time);
                                    if(timeCheck == true){
                                        sendTrainerInappNotification(noti, noti.trainer_id, function(status, result){
                                            if(++n == notis.length){
                                                sendSuccess(res, {message:'Inapp Notifications successfully sent'});
                                            }
                                        })
                                    } else {
                                        if(++n == notis.length){
                                            sendSuccess(res, {message:'Inapp Notifications successfully sent'});
                                        }
                                    }
                                } else {
                                    if(++n == notis.length){
                                        sendSuccess(res, {message:'Inapp Notifications successfully sent'});
                                    }
                                }
                            })
                        }else{
                            sendSuccess(res, {message:'No Notifications found'});
                        }
                    }
                })
            }
        })
    })

    /*
        @@Cron for Push Notifications
    */
    router.get('/cron_push_notifications', function(req, res, next) {

        var model_notification = Model.load('notification', {}, function(lnerr, model_notification) {
            if (lnerr) {
                sendError(res, "Failed to access db: " + lnerr);
            } else {

                var fromDate = moment().add(-1, 'days').format('YYYY-MM-DD');
                var toDate = moment().format('YYYY-MM-DD');

                var conds = {
                    'notification_type': 'push_notification',
                    $or: [
                        {'start_date': fromDate},
                        {'start_date': toDate}
                    ]
                };
                var sortOrder = { 'created_at': -1 }
                model_notification.find(conds).sort(sortOrder).toArray(function(nerr, notis) {
                    if (nerr) {
                        sendError(res, "Failed to retrieve notification data : " + nerr)
                    } else {
                        if(notis && notis.length>0){
                            var n = 0;
                            notis.forEach(function(noti, index) {
                                var cDate = moment().utcOffset(noti.timezone).format('YYYY-MM-DD');
                                var cTime = moment().utcOffset(noti.timezone).format('HH:mm');
                                if(noti.start_date == cDate){
                                    var timeCheck = calculateTime(noti.timezone, cTime, noti.time);
                                    if(timeCheck == true){
                                        sendTrainerPushNotification(noti, noti.trainer_id, function(status, result){
                                            if(++n >= notis.length){
                                                sendSuccess(res, {message:'Push Notifications successfully sent'});
                                            }
                                        })
                                    } else {
                                        if(++n >= notis.length){
                                            sendSuccess(res, {message:'Push Notifications successfully sent'});
                                        }
                                    }
                                } else {
                                    if(++n >= notis.length){
                                        sendSuccess(res, {message:'Push Notifications successfully sent'});
                                    }
                                }
                            })
                        } else {
                            sendSuccess(res, {message:'No Notifications found'});
                        }
                    }
                })
            }
        })
    })

    /**
    	@@Function to send mail by CRON JOB
    **/

    sendEmailToUsers = function(req, res, next) {

        var model_trainer = Model.load('trainer', {}, function(err, model_trainer) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                model_trainer.find({}).toArray(function(err, trainers) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainers: " + err);
                    } else {
                        if (trainers && trainers.length) {
                            var loadedEmailTemplates = 0;
                            trainers.forEach(function(tr) {
                                var model_email_template = Model.load('traineremailtemplate', {}, function(err, model_email_template) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {

                                        var conds = {
                                            trainer_id: tr._id.toString()
                                        };

                                        model_email_template.find(conds).toArray(function(err, email_templates) {
                                            if (err) {
                                                sendError(res, "Failed to retrieve email templates: " + err);
                                            } else {
                                                if (email_templates && email_templates.length) {

                                                    email_templates.forEach(function(et, ind) {

                                                        if ((et.if_send == "true" || et.if_send) && et.label == "Email to Inactive Users") {

                                                            __sendEmailToUsers('inactive', et.trainer_id, et.subject, et.description);
                                                            // Send Email to Inactive Users
                                                        } if ((et.if_send == "true" || et.if_send) && et.label == "Email after 48 hours when user signs up") {


                                                            // Send Email after 48 hours when user signs up
                                                            __sendEmailToUsers('after_48hours', et.trainer_id, et.subject, et.description);
                                                        } if ((et.if_send == "true" || et.if_send) && et.label == "Email to Last month's inactive/trial user") {


                                                            // Send Email to Last Month Inactive/trial users
                                                            __sendEmailToUsers('last_month_inactive', et.rainer_id, et.subject, et.description);

                                                        }

                                                    });

                                                } else {
                                                    console.warn("No Email Template Found for this Trainer===" + tr._id.toString());
                                                }

                                                if (++loadedEmailTemplates >= trainers.length) {

                                                    sendSuccess(res, {
                                                        Message: "Email has been sent to All Users"
                                                    });
                                                }

                                            }
                                        });
                                    }
                                });
                            });
                        }
                    }
                });
            }
        });

    }

    /* GET home page. */
    // router.get('/', function(req, res, next) {
    //   res.send('Trainer API Home')
    // });

    router.post('/login', function(req, res, next) {
        if (!req.body) {
            sendError(res, "User/pass is missing!!");
            return;
        }

        var user = req.body.email || "";
        var pass = req.body.password || "";

        if (!user || !pass) {
            sendError(res, "User/pass is missing!!");
            return;
        }

        var trainer_model = Model.load('trainer', {}, function(err, trainer_model) {
            trainer_model.find({
                email: user,
                password: Model.password(pass)
            }).limit(1).next(function(err, isTrainer) {
                if (isTrainer) {
                    var tr = {};
                    tr.last_seen = new Date().getTime();
                    trainer_model.updateOne({
                        _id: new Model.ObjectID(isTrainer._id)
                    }, {
                        $set: tr
                    }, function(err, trainer) {
                        if (err) {
                            sendError(res, "Failed to update record: " + err);
                        } else {
                            var token = jwt.sign({
                                user: isTrainer,
                                name: isTrainer.name,
                                isGuest: false,
                                isAdmin: false,
                                isTrainer: true
                            }, config.secret);
                            sendSuccess(res, {
                                token: token,
                                id: isTrainer._id
                            });
                        }
                    });
                } else {
                    sendError(res, "User/pass is wrong!!");
                }
            });
        });
    });

    /**
        @@Function to send Push Notification by CRON JOB
    **/

    var activateChallengePlan = function(req, res, next) {
        var posted_data = req.body.plan
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id
        if (trainer_id && posted_data.trainer_id && trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this plan")
        }
        if(trainer_id) {
            var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
                if (err) {
                    sendError(res, "Failed to access db: " + err)
                } else {
                        var conds = { trainer_id:trainer_id, type: "challenge" }

                        if(posted_data.plan_id) conds._id = Model.ObjectID(posted_data.plan_id)

                            model_tp.find(conds).sort({"modified_date": -1}).limit(1).next(function(err, trainerplan) {
                            if (err) {
                                sendError(res, "Failed to retrieve challenge plan: " + err)
                            } else if (!trainerplan) {
                                sendError(res, "No challenge plan found")
                            } else {
                                var updated_data = { "challenge": true, "modified_date" : (new Date()).getTime() + "" }
                                _.defaults(updated_data, trainerplan)
                                model_tp.updateOne(conds, {
                                    $set: { "challenge": true, "modified_date" : (new Date()).getTime() + "" }
                                }, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, "Failed to update record: " + err)
                                    } else {
                                        posted_data.push_message = posted_data.push_message || "New push notification for Pop-Up Challenge"
                                        const data = { push_type: "new_challenge", message: posted_data.push_message, trainer_id: trainer_id , plan_info: updated_data }
                                        sendNotificationForChallengePlan(data, function(error, result){
                                            if(err) {
                                                 sendError(res, error);
                                            }else{
                                                sendSuccess(res, {
                                                    message: updated_data.label+ " has been activated successfully",
                                                    plan: updated_data
                                                });
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
        }else{
            sendError(res, "trainer id is missing, please try with trainer id in query string" );
        }
    }

    /**
        @@Function to send Push Notification by CRON JOB
    **/

    var deactivateChallengePlan = function(req, res, next) {
        var posted_data = req.body.plan;
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;

        if (trainer_id && posted_data.trainer_id && trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this plan")
        }
        if(trainer_id) {
            var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
                if (err) {
                    sendError(res, "Failed to access db: " + err)
                } else {
                        var conds = { trainer_id:trainer_id, type: "challenge", challenge: true }

                        if(posted_data.plan_id) conds._id = Model.ObjectID(posted_data.plan_id)

                        model_tp.find(conds).sort({"modified_date": -1}).limit(1).next(function(err, trainerplan) {
                            if (err) {
                                sendError(res, "Failed to retrieve challenge plan: " + err);
                            } else if (!trainerplan) {
                                sendError(res, "No active challenge plan found");
                            } else {
                                var conditions = {_id: trainerplan._id }
                                var updated_data = { "challenge": false, "modified_date" : (new Date()).getTime() + "" }
                                _.defaults(updated_data, trainerplan)

                                model_tp.updateOne(conditions, {
                                    $set: { "challenge": false, "modified_date" : (new Date()).getTime() + "" }
                                }, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, "Failed to update record: " + err);
                                    } else {
                                        posted_data.push_message = posted_data.push_message || "Pop-Up Challenge has been closed now";
                                        const data = { push_type: "challenge_close", message: posted_data.push_message, trainer_id: trainer_id , plan_info: updated_data }
                                        sendNotificationForChallengePlan(data, function(error, result){
                                            if(err) {
                                                 sendError(res, error);
                                            }else{
                                                sendSuccess(res, {
                                                    message: updated_data.label+ " has been deactivated successfully",
                                                    plan: updated_data
                                                });
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
        }else{
            sendError(res, "trainer id is missing, please try with trainer id in query string" );
        }
    }

    /**
        @@Function to send Push Notification by CRON JOB if challenge plan is opened or closed
    **/

    var sendNotificationForChallengePlan = function(plan_data, callback) {
        var trainer_id = plan_data.trainer_id || false;
        if(trainer_id) {
            var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
                if (err) {
                    callback("Failed to access db: " + err)
                } else {
                        var model_user = Model.load('user', {}, function(err, model_user) {
                            if (err) {
                                callback("Failed to access db: " + err)
                            } else {
                                model_user.find({trainer_id:trainer_id}, {"profile.device_type":1, "device_token": 1}).toArray(function(err, all_users) {
                                    if (err) {
                                        callback("Failed to retrieve users: " + err)
                                    } else {
                                            // Multiple destinations
                                            const registrationIds = [];

                                            if(all_users && all_users.length){

                                                all_users.forEach(function(user){

                                                    if(user.profile.device_type && user.device_token) registrationIds.push(user.device_token)
                                                });
                                                if( registrationIds && registrationIds.length ){
                                                    const data = { type: plan_data.push_type, message: plan_data.message, challenge_plan_info: plan_data.plan_info };
                                                    data.badge = 1;
                                                    Model.sendPush(["iOS", "Android"], registrationIds, data.message, data, trainer_id)
                                                    callback(undefined, {result: "Push Notifications sent to all users successfully"})
                                                }else{
                                                    callback("Device tokens not found for users")
                                                }

                                            }else{
                                                callback("No User found for this trainer")
                                            }
                                        }
                                });
                            }
                        });
                    }
                });
        }else{
            callback("trainer id is missing, please try with trainer id in query string")
        }
    }

    /**
    	@@ send Emails to Users

    **/

    router.get('/send_emails', sendEmailToUsers);

    /**
        @@ Activate Challenge Plan

    **/

    router.post('/activate_challenge_plan', activateChallengePlan);

    /**
        @@ Deactivate Challenge Plan

    **/

    router.post('/deactivate_challenge_plan', deactivateChallengePlan);



    /**
        @@ Public Get Trainer Bio
    **/
   router.get('/:id/public_bio', function(req, res, next){
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
            trainer = _.omit(trainer, ['password', 'contact_info', 'social_links', 'invitation', 'profile'])
						sendSuccess(res, {trainer: trainer});
					}
				});
			}
		});
	});


    router.use(function(req, res, next) {
      if(!req.userinfo){
        sendError(res, "Unauthorized", 401);
      } else if (req.userinfo.isTrainer) {
        req.trainer_id = req.userinfo.user._id;
        next();
      } else if (req.userinfo.isAdmin || !req.userinfo.isGuest) {
        req.trainer_id = 0;
        next();
      } else {
        sendError(res, "Unauthorized", 401);
      }
    });

    /**
        @@ Get Progress Pic Interval
        @@ input trainer_id
    **/

    router.get('/progress_pic_interval', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_trainer = Model.load('trainer', {}, function(err, model_trainer) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var condition = {};
                if (trainer_id) {
                    condition._id = Model.ObjectID(trainer_id);
                }
                var fields = { "progress_pic_interval": 1, "gap_between_progress_pic_interval": 1, "first_progress_pic_popup_appear": 1, "next_progress_pic_popup_appear": 1 }
                model_trainer.find(condition, fields).limit(1).next(function(err, trainer) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer: " + err);
                    } else if (!trainer) {
                        sendError(res, "Sorry, this trainer doesn't exists in our records ");
                    } else {
                        sendSuccess(res, {
                            result: trainer
                        });
                    }
                });
            }
        });
    })

    router.get('/', function(req, res, next) {
        var model_trainer = Model.load('trainer', {}, function(err, model_trainer) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                model_trainer.find({
                    _id: Model.ObjectID(req.trainer_id)
                }).limit(1).next(function(err, trainer) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer: " + err);
                    } else if (!trainer) {
                        sendError(res, "Not found");
                    } else {
                        sendSuccess(res, {
                            trainer: trainer
                        });
                    }
                });
            }
        });
    });

    router.post('/', function(req, res, next) {
        var tr = req.body.trainer;
        var removeImages = req.body.removeImages || [];
        var replace = req.body.replace || false;
        var id = req.trainer_id;

        var model_trainer = Model.load('trainer', {}, function(err, model_trainer) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                if (tr.password) {
                    tr.password = Model.password(tr.password);
                }

                var conds = {
                    _id: new Model.ObjectID(id)
                };


                model_trainer.find(conds).limit(1).next(function(err, trainer) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer: " + err);
                    } else if (!trainer) {
                        sendError(res, "Not found");
                    } else {

                        if (!replace) {
                            _.defaultsDeep(tr, trainer);
                            delete tr._id;
                        }

                        if (model_trainer.verify(tr)) {
                            if (req.files && req.files.length) {
                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/trainers/");

                                Model.uploadFilesEx(req, baseFolder, (tr.name).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                    if (!succeeded.length) {
                                        sendError(res, "Failed to upload all file(s)");
                                    } else {

                                        if (typeof fields.image != 'undefined') {
                                            tr.image = fields.image.shift();
                                        }

                                        if (typeof fields.images != 'undefined') {
                                            tr.images = fields.images;
                                        } else {
                                            tr.images = [];
                                        }

                                        if (typeof fields.video != 'undefined') {
                                            tr.video = fields.video.shift();
                                        }

                                        if (typeof fields.videos != 'undefined') {
                                            tr.videos = fields.videos;
                                        } else {
                                            tr.videos = [];
                                        }


                                        if (typeof fields.app_logo != 'undefined') {
                                            tr.app_info.app_logo = fields.app_logo.shift();
                                        }



                                        if (replace) {
                                            if (!tr.image && tr.images && tr.images.length) {
                                                tr.image = tr.images.shift();
                                            }

                                            if (!tr.video && tr.videos && tr.videos.length) {
                                                tr.video = tr.videos.shift();
                                            }
                                            model_trainer.replaceOne(conds, tr, function(err, trainer) {
                                                if (err) {
                                                    sendError(res, "Failed to replace record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: trainer,
                                                        replaced: true
                                                    });
                                                }
                                            });
                                        } else {

                                            if (removeImages.length) {
                                                for (var i = 0; i < removeImages.length; i++) {
                                                    trainer.images.splice(trainer.images.indexOf(removeImages[i]), 1);
                                                }
                                            }

                                            if (trainer.images.length) {
                                                tr.images = tr.images || [];
                                                for (var i = 0; i < trainer.images.length; i++) {
                                                    tr.images.push(trainer.images[i]);
                                                }
                                            }

                                            model_trainer.updateOne(conds, {
                                                $set: tr
                                            }, function(err, trainer) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: trainer,
                                                        replaced: false
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                if (replace) {
                                    model_trainer.replaceOne(conds, tr, function(err, trainer) {
                                        if (err) {
                                            sendError(res, "Failed to replace record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: trainer,
                                                replaced: true
                                            });
                                        }
                                    });
                                } else {
                                    if (removeImages.length) {
                                        for (var i = 0; i < removeImages.length; i++) {
                                            trainer.images.splice(trainer.images.indexOf(removeImages[i]), 1);
                                        }
                                    }


                                    tr.images = trainer.images;

                                    model_trainer.updateOne(conds, {
                                        $set: tr
                                    }, function(err, trainer) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: trainer,
                                                replaced: false
                                            });
                                        }
                                    });
                                }
                            }
                        } else {
                            sendError(res, "Invalid data for trainer!");
                        }

                    }
                });
            }
        });
    });

    router.get('/trainer_dashboard/:id', function(req, res, next) {

        var model_trainer_dashboard = Model.load('trainerdashboard', {}, function(err, model_trainer_dashboard) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                model_trainer_dashboard.find({
                    trainer_id: req.params.id
                }).limit(1).next(function(err, trainer) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer: " + err);
                    } else if (!trainer) {
                        sendError(res, "Not found");
                    } else {
                        sendSuccess(res, {
                            trainer: trainer
                        });
                    }
                });
            }
        });

    });

    router.get('/get_trainer_dashboard/:id', function(req, res, next) {
        var trainer_id = req.params.id;
        var model_trainer_dashboard = Model.load('trainerdashboard', {}, function(err, model_trainer_dashboard) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var model_user = Model.load('user', {}, function(err, model_user) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err);
                    } else {
                        var conds = {
                            // excluding wegile emails...
                            //email: /^((?!wegile).)*$/i
                        };

                        if (trainer_id) {
                            conds.trainer_id = trainer_id;
                        }

                        var fields = {
                            "profile.name": 1,
                            "progress_pics": 1
                        };

                        var __loadUserCount = function(callback) {
                            var todate = new Date();
                            var start_date = new Date(todate.getFullYear(), todate.getMonth(), 1, 0, 0, 0, 0).getTime(); // First Date of Month
                            var numberOfDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                            var end_date = new Date(todate.getFullYear(), todate.getMonth(), numberOfDaysInMonth, 23, 59, 59, 999).getTime(); // Last Date of Month
                            conds.joined_on = {
                                $lte: end_date,
                                $gte: start_date
                            };
                            conds.$or = [{
                                "profile.paid": "1",
                                "profile.startPlan_date": {
                                    "$exists": true
                                }
                            }, {
                                "profile.paid": {
                                    $not: {
                                        "$exists": true
                                    }
                                },
                                "profile.subscribed_plan": "0",
                                "profile.startPlan_date": {
                                    "$exists": true
                                }
                            }];
                            model_user.find(conds)
                                .count(callback)
                        };
                        model_user.find(conds, fields).sort({
                            '_id': 1
                        }).toArray(function(err, all_users) {
                            if (err) {
                                sendError(res, "Failed to retrieve users: " + err);
                            } else {
                                model_trainer_dashboard.find({
                                    trainer_id: trainer_id
                                }).limit(1).next(function(err, trainer) {
                                    if (err) {
                                        sendError(res, "Failed to retrieve trainer: " + err);
                                    } else {
                                        __loadUserCount(function(err, trial_users) {
                                            trainer = trainer || {};
                                            var loadedUsers = 0;
                                            var sumOfPics = 0;
                                            if (all_users.length) {
                                                all_users.forEach(function(users, index) {
                                                    if (typeof users.progress_pics != "undefined") {
                                                        var picsLength = Object.keys(users.progress_pics).length;
                                                        sumOfPics += picsLength;
                                                    }

                                                    if (++loadedUsers >= all_users.length) {
                                                        trainer.all_users = all_users.length;
                                                        trainer.progress_pics = sumOfPics;
                                                        trainer.trial_users = trial_users;
                                                        sendSuccess(res, {
                                                            trainer: trainer
                                                        });
                                                    }

                                                });
                                            } else {
                                                trainer.all_users = all_users.length;
                                                trainer.progress_pics = sumOfPics;
                                                trainer.trial_users = trial_users;
                                                sendSuccess(res, {
                                                    trainer: trainer
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

    });

    router.post('/trainer_dashboard/:id', function(req, res, next) {
        var tr = req.body.trainer;
        var id = req.params.id;
        var fieldname = req.body.field;
        var model_trainer = Model.load('trainerdashboard', {}, function(err, model_trainer) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conds = {
                    trainer_id: id
                };

                if (fieldname) tr[fieldname]['modified_date'] = (new Date()).getTime();

                model_trainer.find(conds).limit(1).next(function(err, trainer) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer: " + err);
                    } else if (!trainer) {
                        if (model_trainer.verify(tr)) {
                            model_trainer.insertOne(tr, {}, function(err, dbres) {
                                if (err) {
                                    sendError(res, "Failed to insert record: " + err);
                                } else {
                                    sendSuccess(res, {
                                        res: dbres,
                                        trainer_dashboard: tr
                                    });
                                }
                            });
                        } else {
                            sendError(res, "Invalid data for trainer!");
                        }
                    } else {
                        if (model_trainer.verify(tr)) {

                            model_trainer.updateOne(conds, {
                                $set: tr
                            }, function(err, trainer) {
                                if (err) {
                                    sendError(res, "Failed to update record: " + err);
                                } else {
                                    sendSuccess(res, {
                                        res: trainer
                                    });
                                }
                            });
                        } else {
                            sendError(res, "Invalid data for trainer!");
                        }

                    }
                });
            }
        });
    });

    router.get('/equipment', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id
          ? req.query.trainer_id
          : req.query.org_id
          ? req.query.trainer_id
          : req.trainer_id;

        var model_eqip = Model.load('equipment', {}, function(err, model_eqip) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_eqip.find(conds).sort({
                    'label': 1
                }).toArray(function(err, equipments) {
                    if (err) {
                        sendError(res, "Failed to retrieve equipments: " + err);
                    } else {
                        sendSuccess(res, {
                            equipments: equipments
                        });
                    }
                });
            }
        });
    });

    router.get('/equipment/:id', function(req, res, next) {
        var id = req.params.id;
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id
          ? req.query.trainer_id
          : req.query.org_id
          ? req.query.trainer_id
          : req.trainer_id;

        var model_eqip = Model.load('equipment', {}, function(err, model_eqip) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_eqip.find(conds).limit(1).next(function(err, equipment) {
                    if (err) {
                        sendError(res, err);
                    } else if (!equipment) {
                        sendError(res, "Not found");
                    } else {
                        sendSuccess(res, {
                            equipment: equipment
                        });
                    }
                });
            }
        });
    });

    router.post('/equipment/:id', function(req, res, next) {
        var equip = req.body.equipment;
        var removeImages = req.body.removeImages || [];
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && equip.trainer_id && req.trainer_id != equip.trainer_id) {
            return sendError(res, "Not authorized to update this equipment");
        }

        if (!equip.trainer_id && req.trainer_id) {
            equip.trainer_id = req.trainer_id;
        }

        var model_eqip = Model.load('equipment', {}, function(err, model_eqip) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_eqip.find(conds).limit(1).next(function(err, equipment) {
                    if (err) {
                        sendError(res, err);
                    } else if (!equipment) {
                        sendError(res, "Not found");
                    } else {
                        if (!replace) {
                            _.defaults(equip, equipment);
                            delete equip._id;
                        }


                        if (model_eqip.verify(equip)) {

                            if (req.files && req.files.length) {
                                // upload new file...
                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/equipments/");

                                Model.uploadFilesEx(req, baseFolder, equip.trainer_id + "_" + (equip.photo ? equip.photo : equip.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                    if (!succeeded.length) {
                                        sendError(res, "Failed to upload all file(s)");
                                    } else {
                                        if (typeof fields.image != 'undefined') {
                                            equip.image = fields.image.shift();
                                        }

                                        if (typeof fields.images != 'undefined') {
                                            equip.images = fields.images;
                                        }

                                        if (typeof fields.video != 'undefined') {
                                            equip.video = fields.video.shift();
                                        }

                                        if (typeof fields.videos != 'undefined') {
                                            equip.videos = fields.videos;
                                        }


                                        if (replace) {

                                            if (!equip.image && equip.images && equip.images.length) {
                                                equip.image = equip.images.shift();
                                            }

                                            if (!equip.video && equip.videos && equip.videos.length) {
                                                equip.video = equip.videos.shift();
                                            }
                                            model_eqip.replaceOne(conds, equip, {}, function(err, equipment) {
                                                if (err) {
                                                    sendError(res, "Failed to replace record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: equipment,
                                                        equipment: equip
                                                    });
                                                }
                                            });
                                        } else {
                                            if (removeImages.length) {
                                                for (var i = 0; i < removeImages.length; i++) {
                                                    equipment.images.splice(equipment.images.indexOf(removeImages[i]), 1);
                                                }
                                            }

                                            if (equipment.images.length) {
                                                equip.images = equip.images || [];
                                                for (var i = 0; i < equipment.images.length; i++) {
                                                    equip.images.push(equipment.images[i]);
                                                }
                                            }

                                            model_eqip.updateOne(conds, {
                                                $set: equip
                                            }, {}, function(err, equipment) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: equipment,
                                                        equipment: equip
                                                    });
                                                }
                                            });
                                        }

                                    }
                                });
                            } else {
                                if (replace) {
                                    model_eqip.replaceOne(conds, equip, {}, function(err, equipment) {
                                        if (err) {
                                            sendError(res, "Failed to replace record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: equipment,
                                                equipment: equip
                                            });
                                        }
                                    });
                                } else {
                                    if (removeImages.length) {
                                        for (var i = 0; i < removeImages.length; i++) {
                                            equipment.images.splice(equipment.images.indexOf(removeImages[i]), 1);
                                        }
                                    }


                                    equip.images = equipment.images;

                                    model_eqip.updateOne(conds, {
                                        $set: equip
                                    }, {}, function(err, equipment) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: equipment,
                                                equipment: equip
                                            });
                                        }
                                    });
                                }
                            }
                        } else {
                            sendError(res, "Invalid data for equipment");
                        }
                    }
                });

            }
        });
    });


    router.put('/equipment', function(req, res, next) {
        var equip = req.body.equipment;

        if (req.trainer_id && equip.trainer_id && req.trainer_id != equip.trainer_id) {
            return sendError(res, "Not authorized to update this equipment");
        }

        if (!equip.trainer_id && req.trainer_id) {
            equip.trainer_id = req.trainer_id;
        }

        var model_eqip = Model.load('equipment', {}, function(err, model_eqip) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_eqip.verify(equip)) {

                    if (req.files && req.files.length) {


                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/equipments/");

                        Model.uploadFiles(req, baseFolder, equip.trainer_id + "_" + (equip.photo ? equip.photo : equip.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, succeeded_images, succeeded_videos) {
                            if (!succeeded_images.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {
                                equip.image = succeeded_images.shift();
                                equip.images = succeeded_images;

                                if (succeeded_videos.length) {
                                    equip.video = succeeded_videos.shift();
                                    equip.videos = succeeded_videos;
                                } else {
                                    equip.video = "";
                                }

                                model_eqip.insertOne(equip, {}, function(err, equipment) {
                                    if (err) {
                                        sendError(res, "Failed to insert record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: equipment,
                                            equipment: equip
                                        });
                                    }
                                });

                            }
                        });
                    } else {
                        equip.image = "";
                        equip.images = [];
                        model_eqip.insertOne(equip, {}, function(err, equipment) {
                            if (err) {
                                sendError(res, "Failed to insert record: " + err);
                            } else {
                                sendSuccess(res, {
                                    res: equipment,
                                    equipment: equip
                                });
                            }
                        });
                    }
                } else {
                    sendError(res, "Invalid data for equipment");
                }
            }
        });
    });

    router.delete('/equipment/:id', function(req, res, next) {
        var id = req.params.id;
        var model_eqip = Model.load('equipment', {}, function(err, model_eqip) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                model_eqip.find(conds).limit(1).next(function(err, equipment) {
                    if (err) {
                        sendError(res, err);
                    } else if (!equipment) {
                        sendError(res, "Not found");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/equipments/");
                        var files = [equipment.image].concat(equipment.images, [equipment.video], equipment.videos);
                        Model.removeFiles(files, baseFolder);

                        model_eqip.deleteOne(conds, {}, function(err, equipment) {
                            if (err) {
                                sendError(res, err);
                            } else {
                                sendSuccess(res, {
                                    res: equipment
                                });
                            }
                        });
                    }
                });
            }
        });
    });

    router.get('/bodypart', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id
          ? req.query.trainer_id
          : req.query.org_id
          ? req.query.trainer_id
          : req.trainer_id;

        var model_bodypart = Model.load('bodypart', {}, function(err, model_bodypart) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_bodypart.find(conds).toArray(function(err, bodyparts) {
                    if (err) {
                        sendError(res, "Failed to retrieve bodyparts: " + err);
                    } else {
                        sendSuccess(res, {
                            bodyparts: bodyparts
                        });
                    }
                });
            }
        });
    });

    router.get('/bodypart/:id', function(req, res, next) {
        var id = req.params.id;

        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id
          ? req.query.trainer_id
          : req.query.org_id
          ? req.query.trainer_id
          : req.trainer_id;

        var model_bodypart = Model.load('bodypart', {}, function(err, model_bodypart) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_bodypart.find(conds).limit(1).next(function(err, bodypart) {
                    if (err) {
                        sendError(res, err);
                    } else if (!bodypart) {
                        sendError(res, "Not found");
                    } else {
                        sendSuccess(res, {
                            bodypart: bodypart
                        });
                    }
                });
            }
        });
    });

    router.post('/bodypart/:id', function(req, res, next) {
        var bp = req.body.bodypart;
        var removeImages = req.body.removeImages || [];
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && bp.trainer_id && req.trainer_id != bp.trainer_id) {
            return sendError(res, "Not authorized to update this bodypart");
        }

        if (!bp.trainer_id && req.trainer_id) {
            bp.trainer_id = req.trainer_id;
        }
        var model_bodypart = Model.load('bodypart', {}, function(err, model_bodypart) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {


                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_bodypart.find(conds).limit(1).next(function(err, bodypart) {
                    if (err) {
                        sendError(res, err);
                    } else if (!bodypart) {
                        sendError(res, "Not found");
                    } else {

                        if (!replace) {
                            _.defaults(bp, bodypart);
                            delete bp._id;
                        }

                        if (model_bodypart.verify(bp)) {

                            if (req.files && req.files.length) {
                                // upload new file...
                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/bodyparts/");

                                Model.uploadFilesEx(req, baseFolder, bp.trainer_id + "_" + (bp.photo ? bp.photo : bp.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                    if (!succeeded.length) {
                                        sendError(res, "Failed to upload all file(s)");
                                    } else {
                                        if (typeof fields.image != 'undefined') {
                                            bp.image = fields.image.shift();
                                        }

                                        if (typeof fields.images != 'undefined') {
                                            bp.images = fields.images;
                                        }

                                        if (typeof fields.video != 'undefined') {
                                            bp.video = fields.video.shift();
                                        }

                                        if (typeof fields.videos != 'undefined') {
                                            bp.videos = fields.videos;
                                        }


                                        if (replace) {

                                            if (!bp.image && bp.images && bp.images.length) {
                                                bp.image = bp.images.shift();
                                            }

                                            if (!bp.video && bp.videos && bp.videos.length) {
                                                bp.video = bp.videos.shift();
                                            }
                                            model_bodypart.replaceOne(conds, bp, {}, function(err, bodypart) {
                                                if (err) {
                                                    sendError(res, "Failed to replace record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: bodypart,
                                                        bodypart: bp,
                                                        replace: true
                                                    });
                                                }
                                            });
                                        } else {
                                            if (removeImages.length) {
                                                for (var i = 0; i < removeImages.length; i++) {
                                                    bodypart.images.splice(bodypart.images.indexOf(removeImages[i]), 1);
                                                }
                                            }

                                            if (bodypart.images.length) {
                                                bp.images = bp.images || [];
                                                for (var i = 0; i < bodypart.images.length; i++) {
                                                    bp.images.push(bodypart.images[i]);
                                                }
                                            }

                                            model_bodypart.updateOne(conds, {
                                                $set: bp
                                            }, {}, function(err, bodypart) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: bodypart,
                                                        bodypart: bp
                                                    });
                                                }
                                            });
                                        }

                                    }
                                });

                            } else {
                                if (replace) {
                                    model_bodypart.replaceOne(conds, bp, {}, function(err, bodypart) {
                                        if (err) {
                                            sendError(res, "Failed to replace record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: bodypart,
                                                bodypart: bp,
                                                replace: true
                                            });
                                        }
                                    });
                                } else {
                                    if (removeImages.length) {
                                        for (var i = 0; i < removeImages.length; i++) {
                                            bodypart.images.splice(bodypart.images.indexOf(removeImages[i]), 1);
                                        }
                                    }


                                    bp.images = bodypart.images;

                                    model_bodypart.updateOne(conds, {
                                        $set: bp
                                    }, {}, function(err, bodypart) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: bodypart,
                                                bodypart: bp
                                            });
                                        }
                                    });
                                }
                            }
                        } else {
                            sendError(res, "Invalid bodypart");
                        }
                    }
                });

            }
        });
    });

    router.put('/bodypart', function(req, res, next) {

        var bp = req.body.bodypart;
        if (req.trainer_id && bp.trainer_id && req.trainer_id != bp.trainer_id) {
            return sendError(res, "Not authorized to update this exercise");
        }

        if (!bp.trainer_id && req.trainer_id) {
            bp.trainer_id = req.trainer_id;
        }

        var model_bodypart = Model.load('bodypart', {}, function(err, model_bodypart) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_bodypart.verify(bp)) {

                    if (req.files && req.files.length) {

                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/bodyparts/");

                        Model.uploadFiles(req, baseFolder, bp.trainer_id + "_" + (bp.photo ? bp.photo : bp.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, succeeded_images, succeeded_videos) {
                            if (!succeeded_images.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {
                                bp.image = succeeded_images.shift();
                                bp.images = succeeded_images;

                                if (succeeded_videos.length) {
                                    bp.video = succeeded_videos.shift();
                                    bp.videos = succeeded_videos;
                                } else {
                                    bp.video = "";
                                }

                                model_bodypart.insertOne(bp, {}, function(err, bodypart) {
                                    if (err) {
                                        sendError(res, "Failed to insert record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: bodypart,
                                            bodypart: bp
                                        });
                                    }
                                });

                            }
                        });
                    } else {
                        bp.image = "";
                        bp.images = [];
                        model_bodypart.insertOne(bp, {}, function(err, bodypart) {
                            if (err) {
                                sendError(res, "Failed to insert record: " + err);
                            } else {
                                sendSuccess(res, {
                                    res: bodypart,
                                    bodypart: bp
                                });
                            }
                        });
                    }

                } else {
                    sendError(res, "Invalid bodypart");
                }
            }
        });
    });

    router.delete('/bodypart/:id', function(req, res, next) {
        var id = req.params.id;
        var model_bodypart = Model.load('bodypart', {}, function(err, model_bodypart) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                model_bodypart.find(conds).limit(1).next(function(err, bodypart) {
                    if (err) {
                        sendError(res, err);
                    } else if (!bodypart) {
                        sendError(res, "Not found");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/bodyparts/");
                        var files = [bodypart.image].concat(bodypart.images, [bodypart.video], bodypart.videos);
                        Model.removeFiles(files, baseFolder);
                        model_bodypart.deleteOne(conds, {}, function(err, bodypart) {
                            if (err) {
                                sendError(res, err);
                            } else {
                                sendSuccess(res, {
                                    res: bodypart
                                });
                            }
                        });
                    }
                });
            }
        });
    });


    router.get('/exercise', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id
          ? req.query.trainer_id
          : req.query.org_id
          ? req.query.trainer_id
          : req.trainer_id;

        var model_exercise = Model.load('exercise', {}, function(err, model_exercise) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                if (req.query.org_id) {
                    conds.org_id = req.query.org_id;
                }
                model_exercise.find(conds).toArray(function(err, exercise) {
                    if (err) {
                        sendError(res, "Failed to retrieve exercise: " + err);
                    } else {
                        sendSuccess(res, {
                            exercises: exercise
                        });
                    }
                });
            }
        });
    });

    router.get('/exercise/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id
          ? req.query.trainer_id
          : req.query.org_id
          ? req.query.trainer_id
          : req.trainer_id;

        var id = req.params.id;
        var model_exercise = Model.load('exercise', {}, function(err, model_exercise) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_exercise.find(conds).limit(1).next(function(err, exercise) {
                    if (err) {
                        sendError(res, err);
                    } else if (!exercise) {
                        sendError(res, "Not found");
                    } else {
                        sendSuccess(res, {
                            exercise: exercise
                        });
                    }
                });
            }
        });
    });



    router.post('/exercise/:id', function(req, res, next) {
        var exer = req.body.exercise;
        var removeImages = req.body.removeImages || [];
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this exercise");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        var model_exercise = Model.load('exercise', {}, function(err, model_exercise) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {


                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                model_exercise.find(conds).limit(1).next(function(err, exercise) {
                    if (err) {
                        sendError(res, err);
                    } else if (!exercise) {
                        sendError(res, "Not found");
                    } else {

                        if (!replace) {
                            _.defaults(exer, exercise);
                            delete exer._id;
                        }


                        if (model_exercise.verify(exer)) {

                            if (req.files && req.files.length) {

                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/exercises/");

                                Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                    if (!succeeded.length) {
                                        sendError(res, "Failed to upload all file(s)");
                                    } else {

                                        if (typeof fields.image != 'undefined') {
                                            exer.image = fields.image.shift();
                                        }

                                        if (typeof fields.images != 'undefined') {
                                            exer.images = fields.images;
                                        }

                                        if (typeof fields.video != 'undefined') {
                                            exer.video = fields.video.shift();
                                        }

                                        if (typeof fields.videos != 'undefined') {
                                            exer.videos = fields.videos;
                                        }


                                        if (replace) {

                                            if (!exer.image && exer.images && exer.images.length) {
                                                exer.image = exer.images.shift();
                                            }

                                            if (!exer.video && exer.videos && exer.videos.length) {
                                                exer.video = exer.videos.shift();
                                            }

                                            model_exercise.replaceOne(conds, exer, {}, function(err, exercise) {
                                                if (err) {
                                                    sendError(res, "Failed to replace record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: exercise,
                                                        exercise: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        } else {

                                            if (removeImages.length) {
                                                for (var i = 0; i < removeImages.length; i++) {
                                                    exercise.images.splice(exercise.images.indexOf(removeImages[i]), 1);
                                                }
                                            }

                                            if (exercise.images.length) {
                                                exer.images = exer.images || [];
                                                for (var i = 0; i < exercise.images.length; i++) {
                                                    exer.images.push(exercise.images[i]);
                                                }
                                            }

                                            model_exercise.updateOne(conds, {
                                                $set: exer
                                            }, {}, function(err, exercise) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: exercise,
                                                        exercise: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });

                            } else {
                                if (replace) {
                                    model_exercise.replaceOne(conds, exer, {}, function(err, exercise) {
                                        if (err) {
                                            sendError(res, "Failed to replace record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: exercise,
                                                exercise: exer
                                            });
                                        }
                                    });
                                } else {
                                    if (removeImages.length) {
                                        for (var i = 0; i < removeImages.length; i++) {
                                            exercise.images.splice(exercise.images.indexOf(removeImages[i]), 1);
                                        }
                                    }


                                    exer.images = exercise.images;

                                    model_exercise.updateOne(conds, {
                                        $set: exer
                                    }, {}, function(err, exercise) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: exercise,
                                                exercise: exer
                                            });
                                        }
                                    });
                                }
                            }
                        } else {
                            sendError(res, "Invalid data for exercise");
                        }


                    }
                });



            }
        });
    });

    router.put('/exercise', function(req, res, next) {
        var exer = req.body.exercise;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this exercise");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }


        var model_exercise = Model.load('exercise', {}, function(err, model_exercise) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_exercise.verify(exer)) {
                    if (req.files && req.files.length) {

                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/exercises/");

                        Model.uploadFiles(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, succeeded_images, succeeded_videos) {
                            if (!succeeded_images.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {
                                exer.image = succeeded_images.shift();
                                exer.images = succeeded_images;
                                /*
                                if(succeeded_videos.length){
                                	exer.video = succeeded_videos.shift();
                                	exer.videos = succeeded_videos;
                                }else{
                                	exer.video = "";
                                }
                                */


                                if (typeof fields.image != 'undefined') {
                                    exer.image = fields.image.shift();
                                }

                                if (typeof fields.images != 'undefined') {
                                    exer.images = fields.images;
                                } else {
                                    exer.images = [];
                                }

                                if (typeof fields.video != 'undefined') {
                                    var v = fields.video.shift();
                                    exer.video = v.path;
                                    exer.video_mime = v.mime;

                                    exer.local_video = true;
                                    exer.uncompressed = true;
                                }

                                if (typeof fields.videos != 'undefined') {
                                    exer.videos = fields.videos;
                                    exer.local_video = true;
                                    exer.uncompressed = true;
                                } else {
                                    exer.videos = [];
                                }

                                model_exercise.insertOne(exer, {}, function(err, exercise) {
                                    if (err) {
                                        sendError(res, "Failed to insert record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: exercise,
                                            exercise: exer,
                                            failed_files: failed
                                        });
                                    }
                                });
                            }
                        }, function(err, fieldname, eventtype, newvalue) {
                            //pd 2
                            var id = exer._id;

                            if (!err) {
                                if (fieldname == "video") {
                                    var o = {};

                                    if (eventtype == "converted") {
                                        o.uncompressed = false;
                                    }
                                    if (eventtype == "uploaded") {
                                        o.local_video = false;
                                        o.video_mime = '';
                                    }
                                    if (newvalue) {
                                        o.video = newvalue;
                                    }


                                    model_exercise.updateOne({
                                        _id: id
                                    }, {
                                        "$set": o
                                    }, {}, function(err, workout) {
                                        // TODO: error handling
                                        console.error("update2", err, workout);
                                    });

                                }
                            }


                        }, exer.trainer_id);
                    } else {
                        exer.image = "";
                        exer.images = [];
                        model_exercise.insertOne(exer, {}, function(err, exercise) {
                            if (err) {
                                sendError(res, "Failed to insert record: " + err);
                            } else {
                                sendSuccess(res, {
                                    res: exercise,
                                    exercise: exer
                                });
                            }
                        });
                    }
                } else {
                    sendError(res, "Invalid data for exercise");
                }
            }
        });
    });

    router.delete('/exercise/:id', function(req, res, next) {
        var id = req.params.id;
        var model_exercise = Model.load('exercise', {}, function(err, model_exercise) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                model_exercise.find(conds).limit(1).next(function(err, exercise) {
                    if (err) {
                        sendError(res, err);
                    } else if (!exercise) {
                        sendError(res, "Not found");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/exercises/");
                        var files = [exercise.image].concat(exercise.images, [exercise.video], exercise.videos);
                        Model.removeFiles(files, baseFolder);

                        model_exercise.deleteOne(conds, {}, function(err, exercise) {
                            if (err) {
                                sendError(res, err);
                            } else {
                                sendSuccess(res, {
                                    res: exercise
                                });
                            }
                        });
                    }
                });
            }
        });
    });


    router.get('/exercisestrength', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id
          ? req.query.trainer_id
          : req.query.org_id
          ? req.query.trainer_id
          : req.trainer_id;

        var model_estrength = Model.load('exercisestrength', {}, function(err, model_estrength) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_estrength.find(conds).toArray(function(err, exercisestrengths) {
                    if (err) {
                        sendError(res, "Failed to retrieve exercise strengths: " + err);
                    } else {
                        sendSuccess(res, {
                            exercisestrengths: exercisestrengths
                        });
                    }
                });
            }
        });
    });

    router.get('/exercisestrength/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id
          ? req.query.trainer_id
          : req.query.org_id
          ? req.query.trainer_id
          : req.trainer_id;

        var id = req.params.id;
        var model_estrength = Model.load('exercisestrength', {}, function(err, model_estrength) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_estrength.find(conds).limit(1).next(function(err, exercisestrength) {
                    if (err) {
                        sendError(res, err);
                    } else if (!exercisestrength) {
                        sendError(res, "Not found");
                    } else {
                        sendSuccess(res, {
                            exercisestrength: exercisestrength
                        });
                    }
                });
            }
        });
    });



    router.post('/exercisestrength/:id', function(req, res, next) {
        var exer = req.body.strength;
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this exercise strength");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        var model_estrength = Model.load('exercisestrength', {}, function(err, model_estrength) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_estrength.find(conds).limit(1).next(function(err, exercisestrength) {
                    if (err) {
                        sendError(res, err);
                    } else if (!exercisestrength) {
                        sendError(res, "Not found");
                    } else {

                        if (!replace) {
                            _.defaults(exer, exercisestrength);
                            delete exer._id;
                        }



                        if (model_estrength.verify(exer)) {

                            if (replace) {
                                model_estrength.replaceOne(conds, exer, {}, function(err, exercise) {
                                    if (err) {
                                        sendError(res, "Failed to replace record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: exercise,
                                            exercisestrength: exer
                                        });
                                    }
                                });
                            } else {
                                model_estrength.updateOne(conds, {
                                    $set: exer
                                }, {}, function(err, exercise) {
                                    if (err) {
                                        sendError(res, "Failed to update record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: exercise,
                                            exercisestrength: exer
                                        });
                                    }
                                });
                            }
                        } else {
                            sendError(res, "Invalid data for exercise strength");
                        }

                    }
                });


            }
        });
    });

    router.put('/exercisestrength', function(req, res, next) {
        var exer = req.body.exercisestrength;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this exercise");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        var model_estrength = Model.load('exercisestrength', {}, function(err, model_estrength) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_estrength.verify(exer)) {

                    model_estrength.insertOne(exer, {}, function(err, exercise) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: exercise,
                                exercisestrength: exer
                            });
                        }
                    });

                } else {
                    sendError(res, "Invalid data for exercise strength");
                }
            }
        });
    });

    router.delete('/exercisestrength/:id', function(req, res, next) {
        var id = req.params.id;
        var model_estrength = Model.load('exercisestrength', {}, function(err, model_estrength) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_estrength.deleteOne(conds, {}, function(err, exercise) {
                    if (err) {
                        sendError(res, err);
                    } else {
                        sendSuccess(res, {
                            res: exercise
                        });
                    }
                });
            }
        });
    });


    /**
        @@ Image Categories Modules
        @@ This is for EXTRAS Section
        @@ Add/Edit/Delete Image Category

    **/

    router.get('/imagecategory', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_imagecategory = Model.load('imagecategory', {}, function(err, model_imagecategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_imagecategory.find(conds).sort({
                        'created_at': -1
                    }).toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve image categories: " + err);
                    } else {
                        sendSuccess(res, {
                            imagecategory: dbres
                        });
                    }
                });
            }
        });
    });

    router.get('/imagecategory/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_imagecategory = Model.load('imagecategory', {}, function(err, model_imagecategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_imagecategory.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "Not found");
                    } else {
                        sendSuccess(res, {
                            imagecategory: dbres
                        });
                    }
                });
            }
        });
    });

    router.post('/imagecategory/:id', function(req, res, next) {
        var posted_data = req.body.imagecategory;
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this image category");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_imagecategory = Model.load('imagecategory', {}, function(err, model_imagecategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conditions.trainer_id = req.trainer_id;
                }
                model_imagecategory.find(conditions).limit(1).next(function(err, result) {
                    if (err) {
                        sendError(res, err);
                    } else if (!result) {
                        sendError(res, "Not found");
                    } else {

                        if (!replace) {
                            _.defaults(posted_data, result);
                            delete posted_data._id;
                        }



                        if (model_imagecategory.verify(posted_data)) {

                            if (replace) {
                                model_imagecategory.replaceOne(conditions, posted_data, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, "Failed to replace record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: dbres,
                                            imagecategory: posted_data
                                        });
                                    }
                                });
                            } else {
                                model_imagecategory.updateOne(conditions, {
                                    $set: posted_data
                                }, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, "Failed to update record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: dbres,
                                            imagecategory: posted_data
                                        });
                                    }
                                });
                            }
                        } else {
                            sendError(res, "Invalid data for image category");
                        }

                    }
                });


            }
        });
    });

    router.put('/imagecategory', function(req, res, next) {
        var posted_data = req.body.imagecategory;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this image category");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_imagecategory = Model.load('imagecategory', {}, function(err, model_imagecategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_imagecategory.verify(posted_data)) {

                    model_imagecategory.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                imagecategory: posted_data
                            });
                        }
                    });

                } else {
                    sendError(res, "Invalid data for image category");
                }
            }
        });
    });

    router.delete('/imagecategory/:id', function(req, res, next) {
        var id = req.params.id;
        var model_imagecategory = Model.load('imagecategory', {}, function(err, model_imagecategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_imagecategory.deleteOne(conds, {}, function(err, response) {
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
        @@ Video Categories Modules
        @@ This is for EXTRAS Section
        @@ Add/Edit/Delete Video Category

    **/

    router.get('/videocategory', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_videocategory = Model.load('videocategory', {}, function(err, model_videocategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_videocategory.find(conds).sort({
                        'created_at': -1
                    }).toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve video categories: " + err);
                    } else {
                        sendSuccess(res, {
                            videocategory: dbres
                        });
                    }
                });
            }
        });
    });

    router.get('/videocategory/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_videocategory = Model.load('videocategory', {}, function(err, model_videocategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_videocategory.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "Not found");
                    } else {
                        sendSuccess(res, {
                            videocategory: dbres
                        });
                    }
                });
            }
        });
    });

    router.post('/videocategory/:id', function(req, res, next) {
        var posted_data = req.body.videocategory;
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this video category");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_videocategory = Model.load('videocategory', {}, function(err, model_videocategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conditions.trainer_id = req.trainer_id;
                }
                model_videocategory.find(conditions).limit(1).next(function(err, result) {
                    if (err) {
                        sendError(res, err);
                    } else if (!result) {
                        sendError(res, "Not found");
                    } else {

                        if (!replace) {
                            _.defaults(posted_data, result);
                            delete posted_data._id;
                        }



                        if (model_videocategory.verify(posted_data)) {

                            if (replace) {
                                model_videocategory.replaceOne(conditions, posted_data, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, "Failed to replace record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: dbres,
                                            videocategory: posted_data
                                        });
                                    }
                                });
                            } else {
                                model_videocategory.updateOne(conditions, {
                                    $set: posted_data
                                }, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, "Failed to update record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: dbres,
                                            videocategory: posted_data
                                        });
                                    }
                                });
                            }
                        } else {
                            sendError(res, "Invalid data for video category");
                        }

                    }
                });


            }
        });
    });

    router.put('/videocategory', function(req, res, next) {
        var posted_data = req.body.videocategory;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this video category");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_videocategory = Model.load('videocategory', {}, function(err, model_videocategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_videocategory.verify(posted_data)) {

                    model_videocategory.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                videocategory: posted_data
                            });
                        }
                    });

                } else {
                    sendError(res, "Invalid data for video category");
                }
            }
        });
    });

    router.delete('/videocategory/:id', function(req, res, next) {
        var id = req.params.id;
        var model_videocategory = Model.load('videocategory', {}, function(err, model_videocategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                model_videocategory.deleteOne(conds, {}, function(err, response) {
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
        @@ Music Categories Modules
        @@ This is for EXTRAS Section
        @@ Add/Edit/Delete Music Category

    **/

    router.get('/musiccategory', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_musiccategory = Model.load('musiccategory', {}, function(err, model_musiccategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_musiccategory.find(conds).sort({
                        'created_at': -1
                    }).toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve music categories: " + err);
                    } else {
                        sendSuccess(res, {
                            musiccategory: dbres
                        });
                    }
                });
            }
        });
    });

    router.get('/musiccategory/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_musiccategory = Model.load('musiccategory', {}, function(err, model_musiccategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_musiccategory.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "This music category not found in our record");
                    } else {
                        sendSuccess(res, {
                            musiccategory: dbres
                        });
                    }
                });
            }
        });
    });

    router.post('/musiccategory/:id', function(req, res, next) {
        var posted_data = req.body.musiccategory
        var id = req.params.id
        var replace = req.body.replace || false

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this music category")
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id
        }

        var model_musiccategory = Model.load('musiccategory', {}, function(err, model_musiccategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err)
            } else {

                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conditions.trainer_id = req.trainer_id
                }
                model_musiccategory.find(conditions).limit(1).next(function(err, result) {
                    if (err) {
                        sendError(res, err)
                    } else if (!result) {
                        sendError(res, "This music category not found in our record");
                    } else {
                        if (!replace) {
                            _.defaults(posted_data, result)
                            delete posted_data._id
                        }

                        if (model_musiccategory.verify(posted_data)) {

                            if (replace) {
                                model_musiccategory.replaceOne(conditions, posted_data, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, "Failed to replace record: " + err)
                                    } else {
                                        sendSuccess(res, {
                                            res: dbres,
                                            musiccategory: posted_data
                                        });
                                    }
                                });
                            } else {
                                model_musiccategory.updateOne(conditions, {
                                    $set: posted_data
                                }, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, "Failed to update record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: dbres,
                                            musiccategory: posted_data
                                        })
                                    }
                                })
                            }
                        } else {
                            sendError(res, "Invalid data for image category")
                        }
                    }
                })
            }
        })
    })

    router.put('/musiccategory', function(req, res, next) {
        var posted_data = req.body.musiccategory

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this music category")
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id
        }

        var model_musiccategory = Model.load('musiccategory', {}, function(err, model_musiccategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err)
            } else {
                if (model_musiccategory.verify(posted_data)) {

                    model_musiccategory.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err)
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                musiccategory: posted_data
                            })
                        }
                    })

                } else {
                    sendError(res, "Invalid data for music category")
                }
            }
        })
    })

    router.delete('/musiccategory/:id', function(req, res, next) {
        var id = req.params.id;
        var model_musiccategory = Model.load('musiccategory', {}, function(err, model_musiccategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_musiccategory.deleteOne(conds, {}, function(err, response) {
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
        @@ Notifications Modules
        @@ This is for Push Notification
        @@ Add/Edit/Delete Notifications

    **/

    router.get('/notifications', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var notification_type = 'inapp_notification';
        var model_notification = Model.load('notification', {}, function(err, model_notification) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                    conds.notification_type = notification_type;
                }

                var sortOrder = { 'created_at': -1 }

                model_notification.find(conds).sort(sortOrder).toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve data for video extra : " + err)
                    } else {
                        var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification){
                            if(err){
                                sendError(res, "Failed to access db :" +err);
                            } else {
                                var j = 0;
                                var data = [];
                                if(dbres && dbres.length) {
                                    dbres.forEach(function(n, index) {

                                        var conditions = {
                                            type: 'push',
                                            sub_type: 'inapp_notification',
                                            notification_id: (n._id).toString(),
                                            read_status: "y"
                                        };

                                        var _viewNotificationCount = function(conditions, callback) {
                                            model_get_notification.find(conditions).count(callback)
                                        };
                                        _viewNotificationCount(conditions, function(error, result){
                                            if(error){
                                                sendError(res, "Failed to get notification data :" +error);
                                            } else {

                                                n.viewCount = parseInt(result);
                                                data.push(n);

                                                if(++j == dbres.length){

                                                    sendSuccess(res, {
                                                        notifications: data
                                                    })
                                                }
                                            }
                                        });
                                    })
                                }else{
                                    sendSuccess(res, {
                                        notifications: dbres
                                    })
                                }
                            }
                        });
                    }
                })
            }
        })
    })

    /**
        @@ Get Notification data with notification_id
        @@ This is for getting notification data
    **/

    router.get('/notification/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_notification = Model.load('notification', {}, function(err, model_notification) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                    conds.notification_type = 'inapp_notification';
                }
                model_notification.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "This video data doesn't exist in our record");
                    } else {
                        sendSuccess(res, {
                            notification: dbres
                        });
                    }
                });
            }
        });
    });

    /**
        @@ Notification Modules for Notification
        @@ This is for Notification Section
        @@ Add Notification

    **/

    router.put('/notification', function(req, res, next) {

        var posted_data = req.body.notification;
        posted_data.notification_type = 'inapp_notification';

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this notification data");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_notification = Model.load('notification', {}, function(err, model_notification) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var saveNotification = function(failed) {
                    model_notification.insertOne(posted_data, {}, function(err2, dbres) {
                        if (err2) {
                            sendError(res, "Failed to insert record: " + err2);
                        } else {
                            var notificationId = dbres.insertedId;

                            var model_user = Model.load('user', {}, function(err3, model_user) {
                                if (err3) {
                                    sendError(res, "Failed to load user: " + err3);
                                } else {
                                    var trainerId = posted_data.trainer_id;

                                    model_user.find({trainer_id:posted_data.trainer_id},{"profile.device_type":1, "device_token": 1}).toArray(function(err4, all_users) {

                                        if (err4) {
                                            sendError(res, "Failed to find record: " + err4);
                                        } else {

                                            sendSuccess(res, {
                                                res: dbres,
                                                notification: posted_data,
                                                failed_files: failed
                                            });
                                        }
                                    });
                                }
                            })
                        }
                    });
                };

                if(posted_data.title) posted_data.title = posted_data.title.replace(/\s+$/, '');

                if (model_notification.verify(posted_data)) {

                    posted_data.created_at = (new Date()).getTime();
                    posted_data.updated_at = (new Date()).getTime();

                    // If User choose From Media Library
                    if (typeof posted_data.status != "undefined") {
                        posted_data.status = true;
                    }else{
                        posted_data.status = false;
                    }


                    if (req.files && req.files.length) {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/notifications/");

                        Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (posted_data.photo ? posted_data.photo : posted_data.title).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                            if (!succeeded.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {

                                if (fields.image) {
                                    posted_data.image = fields.image.shift();
                                }

                                saveNotification(failed);

                            }
                        }, function(err, fieldname, eventtype, newvalue) {

                        }, posted_data.trainer_id);
                    } else {

                        posted_data.image = posted_data.image || "";
                        if (!posted_data.image) {
                            posted_data.image = "";
                        }

                        saveNotification();
                    }

                } else {
                    sendError(res, "Invalid data for notification");
                }
            }
        });
    });

    /**
        @@ Update In App Notification
    **/

    router.post('/notification/:id', function(req, res, next) {
        var notification_info = req.body.notification;
        var id = req.params.id;

        notification_info.notification_type = 'inapp_notification';
        notification_info.notification_id = id;

        if (req.trainer_id && notification_info.trainer_id && req.trainer_id != notification_info.trainer_id) {
            return sendError(res, "Not authorized to update this notification data");
        }

        if (!notification_info.trainer_id && req.trainer_id) {
            notification_info.trainer_id = req.trainer_id;
        }

        if(notification_info.title) notification_info.title = notification_info.title.replace(/\s+$/, '');

        var model_notification = Model.load('notification', {}, function(err, model_notification) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_notification.find(conditions).limit(1).next(function(err, notification_data) {
                    if (err) {
                        sendError(res, err);
                    } else if (!notification_data) {
                        sendError(res, "notification data not found, please try with another notification data");
                    } else {

                        var _updateNotification = function() {

                            if (typeof notification_info.status != "undefined") {
                                notification_info.status = true;
                            }else{
                                notification_info.status = false;
                            }

                            _.defaults(notification_info, notification_data);
                            delete notification_info._id;
                            if (model_notification.verify(notification_info)) {


                                if (req.files && req.files.length) {

                                    var baseFolder = path.join(path.dirname(require.main.filename), "uploads/notifications/");

                                    Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + ((notification_info.photo ? notification_info.photo : notification_info.title) + "").replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                        if (!succeeded.length) {
                                            sendError(res, "Failed to upload all file(s)");
                                        } else {

                                            if (typeof fields.image != 'undefined') {
                                                var files = [notification_info.image];
                                                Model.removeFiles(files, baseFolder);
                                                notification_info.image = fields.image.shift();
                                            }

                                            notification_info.updated_at = (new Date()).getTime();
                                            model_notification.update(conds, {
                                                $set: notification_info
                                            }, {
                                                multi: true
                                            }, function(err, dbres) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {

                                                    sendSuccess(res, {
                                                        res: dbres,
                                                        notification: notification_info,
                                                        failed_files: failed
                                                    });

                                                    // sendTrainerNotification(notification_info, notification_info.trainer_id, function(status, result){
                                                        // sendSuccess(res, {
                                                            // res: dbres,
                                                            // notification: notification_info,
                                                            // failed_files: failed
                                                        // });
                                                    // })
                                                }
                                            });
                                        }
                                    }, function(err, fieldname, eventtype, newvalue) {

                                    }, notification_info.trainer_id);

                                } else {

                                    notification_info.updated_at = (new Date()).getTime();

                                    model_notification.update(conds, {
                                        $set: notification_info
                                    }, {
                                        multi: true
                                    }, function(err, dbres) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: dbres,
                                                notification: notification_info
                                            });
                                            // sendTrainerNotification(notification_info, notification_info.trainer_id, function(status, result){
                                                // sendSuccess(res, {
                                                    // res: dbres,
                                                    // notification: notification_info
                                                // });
                                            // })
                                        }
                                    });
                                }
                            } else {
                                sendError(res, "Invalid data for image data");
                            }
                        };

                        conds._id = new Model.ObjectID(id);
                        _updateNotification();
                    }
                });
            }
        });
    });

    /**
        @@ Delete Notification
    **/

    router.delete('/notification/:id', function(req, res, next) {
        var id = req.params.id;
        var model_notification = Model.load('notification', {}, function(err, model_notification) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conds.notification_type = 'inapp_notification';
                }
                model_notification.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "Notification data not found, please try again");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/notifications/");
                        var files = [dbres.image];
                        Model.removeFiles(files, baseFolder);

                        model_notification.deleteOne(conds, {}, function(err, response) {
                            if (err) {
                                sendError(res, err);
                            } else {
                                var model_get_notification = Model.load('get_notification', {}, function(gnerr, model_get_notification) {
                                    if (gnerr) {
                                        sendError(res, "Failed to access db: " + gnerr);
                                    } else {
                                        var cond = {};
                                        cond['notification_id'] = id;
                                        model_get_notification.remove(cond, function(rerr, rdbres) {
                                            if(rerr){
                                                sendError(res, "Failed to remove get notification data :" +rerr);
                                            } else {
                                                sendSuccess(res, {
                                                    res: response
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
    });


    router.get('/pushnotifications', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var notification_type = 'push_notification';
        var model_notification = Model.load('notification', {}, function(err, model_notification) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                    conds.notification_type = notification_type;
                }

                var sortOrder = { 'created_at': -1 }

                model_notification.find(conds).sort(sortOrder).toArray(function(err2, dbres) {
                    if (err2) {
                        sendError(res, "Failed to retrieve data for video extra : " + err2)
                    } else {
                        var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification){
                            if(err){
                                sendError(res, "Failed to access db :" +err);
                            } else {
                                var j = 0;
                                if(dbres && dbres.length) {
                                    dbres.forEach(function(n, index) {

                                        var conditions = {
                                            type: 'push',
                                            sub_type: 'push_notification',
                                            notification_id: (n._id).toString(),
                                            read_status: "y"
                                        };

                                        var _viewNotificationCount = function(conditions, callback) {
                                            model_get_notification.find(conditions).count(callback)
                                        };
                                        _viewNotificationCount(conditions, function(error, result){
                                            if(error){
                                                sendError(res, "Failed to get notification data :" +error);
                                            } else {

                                                dbres[index].viewCount = result

                                                if(++j == dbres.length){
                                                    sendSuccess(res, {
                                                        notifications: dbres
                                                    })
                                                }
                                            }
                                        });
                                    })
                                }else{
                                    sendSuccess(res, {
                                        notifications: dbres
                                    })
                                }
                            }
                        });
                    }
                })
            }
        })
    })

    /**
        @@ Get Notification data with notification_id
        @@ This is for getting notification data
    **/

    router.get('/pushnotification/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_notification = Model.load('notification', {}, function(err, model_notification) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                    conds.notification_type = 'push_notification';
                }
                model_notification.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "This video data doesn't exist in our record");
                    } else {
                        sendSuccess(res, {
                            notification: dbres
                        });
                    }
                });
            }
        });
    });

    /**
        @@ Push Notification Modules for Notification
        @@ This is for Notification Section
        @@ Add Push Notification

    **/

    router.put('/pushnotification', function(req, res, next) {

        var posted_data = req.body.pushnotification;
        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this notification data");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_notification = Model.load('notification', {}, function(err, model_notification) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var saveNotification = function(failed) {

                    model_notification.insertOne(posted_data, {}, function(err2, dbres) {
                        if (err2) {
                            sendError(res, "Failed to insert record: " + err2);
                        } else {
                            var notificationId = dbres.insertedId;

                            var model_user = Model.load('user', {}, function(err3, model_user) {
                                if (err3) {
                                    sendError(res, "Failed to load user: " + err3);
                                } else {
                                    var trainerId = posted_data.trainer_id;

                                    model_user.find({trainer_id:posted_data.trainer_id},{"profile.device_type":1, "device_token": 1}).toArray(function(err4, all_users) {

                                        if (err4) {
                                            sendError(res, "Failed to find record: " + err4);
                                        } else {

                                            sendSuccess(res, {
                                                res: dbres,
                                                notification: posted_data,
                                                failed_files: failed
                                            });
                                        }
                                    });
                                }
                            })
                        }
                    });
                };


                if(posted_data.title) posted_data.title = posted_data.title.replace(/\s+$/, '');

                if (model_notification.verifyPn(posted_data)) {

                    posted_data.created_at = (new Date()).getTime();
                    posted_data.updated_at = (new Date()).getTime();
                    posted_data.notification_type = 'push_notification';

                    saveNotification();

                } else {
                    sendError(res, "Invalid data for notification");
                }
            }
        });
    });

    /**
        @@ Update pushnotification Data
    **/

    router.post('/pushnotification/:id', function(req, res, next) {
        var notification_info = req.body.pushnotification;
        var id = req.params.id;

        notification_info.notification_type = 'push_notification';
        notification_info.notification_id = id;

        if (req.trainer_id && notification_info.trainer_id && req.trainer_id != notification_info.trainer_id) {
            return sendError(res, "Not authorized to update this notification data");
        }

        if (!notification_info.trainer_id && req.trainer_id) {
            notification_info.trainer_id = req.trainer_id;

        }

        if(notification_info.title) notification_info.title = notification_info.title.replace(/\s+$/, '');

        var model_notification = Model.load('notification', {}, function(err, model_notification) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_notification.find(conditions).limit(1).next(function(err, notification_data) {
                    if (err) {
                        sendError(res, err);
                    } else if (!notification_data) {
                        sendError(res, "notification data not found, please try with another notification data");
                    } else {

                        var _updateNotification = function() {

                            _.defaults(notification_info, notification_data);
                            delete notification_info._id;
                            if (model_notification.verifyPn(notification_info)) {
                                notification_info.updated_at = (new Date()).getTime();

                                model_notification.update(conds, {
                                        $set: notification_info
                                    }, {
                                        multi: true
                                    }, function(err, dbres) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: dbres,
                                                notification: notification_info
                                            });
                                            // sendTrainerNotification(notification_info, notification_info.trainer_id, function(status, result){
                                                // sendSuccess(res, {
                                                    // res: dbres,
                                                    // notification: notification_info
                                                // });
                                            // })
                                        }
                                    });

                            } else {
                                sendError(res, "Invalid data for image data");
                            }
                        };

                        conds._id = new Model.ObjectID(id);
                        _updateNotification();
                    }
                });
            }
        });
    });

    /**
        @@ Delete Notification
    **/

    router.delete('/pushnotification/:id', function(req, res, next) {
        var id = req.params.id;
        var model_notification = Model.load('notification', {}, function(err, model_notification) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conds.notification_type = 'push_notification';
                }
                model_notification.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "Notification data not found, please try again");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/notifications/");
                        var files = [dbres.image];
                        Model.removeFiles(files, baseFolder);

                        model_notification.deleteOne(conds, {}, function(err, response) {
                            if (err) {
                                sendError(res, err);
                            } else {
                                var model_get_notification = Model.load('get_notification', {}, function(gnerr, model_get_notification) {
                                    if (gnerr) {
                                        sendError(res, "Failed to access db: " + gnerr);
                                    } else {
                                        var cond = {};
                                        cond['notification_id'] = id;
                                        model_get_notification.remove(cond, function(rerr, rdbres) {
                                            if(rerr){
                                                sendError(res, "Failed to remove get notification data :" +rerr);
                                            } else {
                                                sendSuccess(res, {
                                                    res: response
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
    });


    /**
        @@ Video EXTRA Modules for EXTRAS
        @@ This is for EXTRAS Section
        @@ Add/Edit/Delete Video EXTRA

    **/

    router.get('/videoextras', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var webapp = req.query.webapp || 0
        var model_videoextra = Model.load('videoextra', {}, function(err, model_videoextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var model_videocategory = Model.load('videocategory', {}, function(err, model_videocategory) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err);
                    } else {
                        var conds = {};
                        if (trainer_id) {
                            conds.trainer_id = trainer_id;
                        }
                        var __loadVideoCategory = function(conds, callback){
                            model_videocategory.findOne(conds, {"label":1}, function(err, dbres) {
                                if (err) {
                                    callback(err)
                                } else {
                                    callback(undefined, dbres)
                                }
                            });
                        }
                        var sortOrder = { 'created_at': -1, "paid": -1 }
                        if(webapp){
                            sortOrder = { 'sort_order': 1 , "paid": -1}
                        }
                        model_videoextra.find(conds).sort(sortOrder).toArray(function(err, dbres) {
                            if (err) {
                                sendError(res, "Failed to retrieve data for video extra : " + err)
                            } else {
                                var loadedVideos = 0
                                if(dbres && dbres.length){
                                    dbres.forEach(function(result, ind) {
                                        if(typeof result.video_type!='undefined' && result.video_type) {
                                            var conditions = {_id: new Model.ObjectID(result.video_type) }
                                            __loadVideoCategory(conditions, function(error, response){
                                                if(error) sendError(res, "Failed to retrieve data for video extra : " + error)
                                                else{
                                                    dbres[ind].video_type = response
                                                    if(++loadedVideos >= dbres.length){
                                                        if(!webapp && trainer_id != "597b8a331b54472074c2dd1a") { // No Sorting for Sugary Six Pack
                                                            var sort_array = [true, false];
                                                            dbres.sort(function(a,b){ // sort them to have paid always on first
                                                                var ia = sort_array.indexOf(a.paid)
                                                                var ib = sort_array.indexOf(b.paid)
                                                                return ia < ib ? 1 : (ia>ib ? -1 : 0);
                                                            })
                                                        }

                                                        sendSuccess(res, {
                                                            videoextras: dbres
                                                        })
                                                    }
                                                }
                                            })
                                        }else{
                                            if(++loadedVideos >= dbres.length){
                                                if(!webapp && trainer_id != "597b8a331b54472074c2dd1a") { // No Sorting for Sugary Six Pack
                                                    var sort_array = [true, false];
                                                    dbres.sort(function(a,b){ // sort them to have paid always on first
                                                        var ia = sort_array.indexOf(a.paid)
                                                        var ib = sort_array.indexOf(b.paid)
                                                        return ia < ib ? 1 : (ia>ib ? -1 : 0);
                                                    })
                                                }
                                                sendSuccess(res, {
                                                    videoextras: dbres
                                                })
                                            }
                                        }
                                    })
                                }else{
                                    sendSuccess(res, {
                                        videoextras: dbres
                                    })
                                }
                            }
                        })
                    }
                })
            }
        })
    })

    /**
        @@ Get Video data with video_id
        @@ This is for getting video data
    **/

    router.get('/videoextra/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_videoextra = Model.load('videoextra', {}, function(err, model_videoextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_videoextra.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "This video data doesn't exist in our record");
                    } else {
                        sendSuccess(res, {
                            videoextra: dbres
                        });
                    }
                });
            }
        });
    });

    /**
        @@ Video EXTRA Modules for EXTRAS
        @@ This is for EXTRAS Section
        @@ Add Video EXTRA

    **/

    router.put('/videoextra', function(req, res, next) {
        var posted_data = req.body.video;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this video data");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_videoextra = Model.load('videoextra', {}, function(err, model_videoextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var saveVideo = function(failed) {
                    model_videoextra.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                video: posted_data,
                                failed_files: failed
                            });
                        }
                    });
                };

                if(posted_data.label) posted_data.label = posted_data.label.replace(/\s+$/, '');

                if (model_videoextra.verify(posted_data)) {

                    posted_data.created_at = (new Date()).getTime();
                    posted_data.updated_at = (new Date()).getTime();

                    /** If User choose From Media Library **/
                    if (typeof posted_data.paid != "undefined") {
                        posted_data.paid = true;
                    }else{
                        posted_data.paid = false;
                    }

                    if (req.files && req.files.length) {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                        Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (posted_data.photo ? posted_data.photo : posted_data.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                            if (!succeeded.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {


                                if (fields.image) {
                                    posted_data.image = fields.image.shift();
                                } else {

                                    posted_data.images = posted_data.images || [];
                                    if (!posted_data.image) {
                                        posted_data.image = "";
                                    }

                                }


                                if (fields.video) {
                                    var v = fields.video.shift();
                                    posted_data.video = v.path;
                                    posted_data.video_mime = v.mime;
                                    posted_data.video_thumbnail = v.video_thumbnail;
                                    posted_data.local_video = true;
                                    posted_data.uncompressed = true;
                                } else {
                                    posted_data.video = posted_data.video || "";
                                    if (!posted_data.video) {
                                        posted_data.video = "";
                                    }
                                }

                                if (fields.video_thumbnail) {
                                    posted_data.video_thumbnail = fields.video_thumbnail.shift();
                                } else {
                                    posted_data.video_thumbnail = posted_data.video_thumbnail || "";
                                }

                                saveVideo(failed);

                            }
                        }, function(err, fieldname, eventtype, newvalue) {
                            //pd 2
                            var id = posted_data._id;

                            if (!err) {
                                if (fieldname == "video") {
                                    var o = {};

                                    if (eventtype == "converted") {
                                        o.uncompressed = false;
                                    }
                                    if (eventtype == "uploaded") {
                                        o.local_video = false;
                                        o.video_mime = '';
                                    }
                                    if (newvalue) {
                                        o.video = newvalue;
                                    }


                                    model_videoextra.updateOne({
                                        _id: id
                                    }, {
                                        "$set": o
                                    }, {}, function(err, dbres) {
                                        // TODO: error handling
                                        console.error("update2", err, dbres);
                                    });

                                }
                            }


                        }, posted_data.trainer_id);
                    } else {

                        posted_data.image = posted_data.image || "";
                        posted_data.video = posted_data.video || "";
                        if (!posted_data.image) {
                            posted_data.image = "";
                        }

                        posted_data.video_thumbnail = posted_data.video_thumbnail || "";

                        saveVideo();
                    }

                } else {
                    sendError(res, "Invalid data for video");
                }
            }
        });
    });

    /**
        @@ Update Video Data
    **/

    router.post('/videoextra/:id', function(req, res, next) {
        var exer = req.body.video;
        var removeImages = req.body.removeImages || [];
        var removeVideo = req.body.removeVideo || "";

        var id = req.params.id;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this video data");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        if(exer.label) exer.label = exer.label.replace(/\s+$/, '');

        var model_videoextra = Model.load('videoextra', {}, function(err, model_videoextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_videoextra.find(conditions).limit(1).next(function(err, video_data) {
                    if (err) {
                        sendError(res, err);
                    } else if (!video_data) {
                        sendError(res, "Video data not found, please try with another video");
                    } else {

                        var _updateVideo = function() {

                            if (typeof exer.paid != 'undefined') {
                                exer.paid = true;
                            }else{
                                exer.paid = false;
                            }

                            _.defaults(exer, video_data);
                            delete exer._id;
                            if (model_videoextra.verify(exer)) {


                                if (removeVideo) {
                                    exer.video = "";
                                    exer.video_thumbnail = "";
                                }

                                if (req.files && req.files.length) {

                                    var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                                    Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + ((exer.photo ? exer.photo : exer.label) + "").replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                        if (!succeeded.length) {
                                            sendError(res, "Failed to upload all file(s)");
                                        } else {

                                            if (typeof fields.image != 'undefined') {
                                                exer.image = fields.image.shift();
                                            }

                                            if (typeof fields.video != 'undefined') {
                                                var v = fields.video.shift();
                                                exer.video = v.path;
                                                exer.video_mime = v.mime;
                                                exer.video_thumbnail = v.video_thumbnail;
                                                exer.local_video = true;
                                                exer.uncompressed = true;
                                            }

                                            if (typeof fields.video_thumbnail != "undefined") {
                                                var files = [exer.video_thumbnail];
                                                Model.removeFiles(files, baseFolder);
                                                exer.video_thumbnail = fields.video_thumbnail.shift();
                                            }

                                            exer.updated_at = (new Date()).getTime();
                                            model_videoextra.update(conds, {
                                                $set: exer
                                            }, {
                                                multi: true
                                            }, function(err, dbres) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: dbres,
                                                        videoextra: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }, function(err, fieldname, eventtype, newvalue) {
                                        // TODO: error handling
                                        if (!err) {
                                            if (fieldname == "video") {
                                                var o = {};

                                                if (eventtype == "converted") {
                                                    o.uncompressed = false;
                                                }
                                                if (eventtype == "uploaded") {
                                                    o.local_video = false;
                                                    o.video_mime = '';
                                                }
                                                if (newvalue) {
                                                    o.video = newvalue;
                                                }

                                                model_videoextra.update(conds, {
                                                    "$set": o
                                                }, {
                                                    multi: true
                                                }, function(err, dbres) {
                                                    // TODO: error handling
                                                    console.error("update2 video data", err, dbres);
                                                });

                                            }
                                        }
                                    }, exer.trainer_id);

                                } else {

                                    exer.updated_at = (new Date()).getTime();
                                    model_videoextra.update(conds, {
                                        $set: exer
                                    }, {
                                        multi: true
                                    }, function(err, dbres) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: dbres,
                                                videoextra: exer
                                            });
                                        }
                                    });
                                }
                            } else {
                                sendError(res, "Invalid data for video data");
                            }
                        };

                        conds._id = new Model.ObjectID(id);
                        _updateVideo();
                    }
                });
            }
        });
    });

    /**
        @@ Delete Video Data
    **/
    router.delete('/videoextra/:id', function(req, res, next) {
        var id = req.params.id;
        var model_videoextra = Model.load('videoextra', {}, function(err, model_videoextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_videoextra.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "Video data not found, please try again");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");
                        var files = [dbres.video_thumbnail];
                        Model.removeFiles(files, baseFolder);

                        model_videoextra.deleteOne(conds, {}, function(err, response) {
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
            }
        });
    });

    /**
        @@ video extras sort api
        @@ input sortable data array

    **/

    router.post('/updateOrder',function(req,res,next){
        var sorted_data = req.body.data;
        if (!req.query.trainer_id) {
            return sendError(res, "Not authorized to update this record");
        }
        if (!req.query.model_name) {
            return sendError(res, "Not authorized to update this record");
        }
        var model_name = req.query.model_name;
        var M = Model.load(model_name, {}, function(err, M) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if(sorted_data.length > 0){
                    var counter = 0;
                    var sort_order = 1;
                    sorted_data.forEach(function(item,index){
                        M.updateOne({_id:new Model.ObjectID(item._id)},{$set:{sort_order:sort_order}},function(err,data){
                               if (err) {
                                    sendError(res, "Failed to update record: " + err);
                                } else {
                                    if(++counter >=sorted_data.length){
                                        sendSuccess(res, {
                                            data: sorted_data,
                                            success:true
                                        });
                                    }
                                }
                            })
                        sort_order++;
                    })
                }
            }
        });
    })

    /**
        @@ Image EXTRA Modules for EXTRAS
        @@ This is for EXTRAS Section
        @@ Add/Edit/Delete Image EXTRA

    **/

    router.get('/imageextras', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_imageextra = Model.load('imageextra', {}, function(err, model_imageextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err)
            } else {
                var model_imagecategory = Model.load('imagecategory', {}, function(err, model_imagecategory) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err)
                    } else {
                        var conds = {};
                        if (trainer_id) {
                            conds.trainer_id = trainer_id
                        }
                        var __loadImageCategory = function(conds, callback){
                            model_imagecategory.findOne(conds, {"label":1}, function(err, dbres) {
                                if (err) {
                                    callback(err)
                                } else {
                                    callback(undefined, dbres)
                                }
                            })
                        }
                        var sortOrder = { 'sort_order': 1, paid: -1 }
                        model_imageextra.find(conds).sort(sortOrder).toArray(function(err, dbres) {
                            if (err) {
                                sendError(res, "Failed to retrieve data for image extra : " + err)
                            } else {
                                var loadedImages = 0
                                if(dbres && dbres.length){
                                    dbres.forEach(function(result, ind) {
                                        if(typeof result.image_type!='undefined' && result.image_type) {
                                            var conditions = {_id: new Model.ObjectID(result.image_type) }
                                            __loadImageCategory(conditions, function(error, response){
                                                if(error) sendError(res, "Failed to retrieve data for image extra : " + error)
                                                else{
                                                    dbres[ind].image_type = response
                                                    if(++loadedImages >= dbres.length){
                                                        sendSuccess(res, {
                                                            imageextras: dbres
                                                        })
                                                    }
                                                }
                                            })
                                        }else{
                                            if(++loadedImages >= dbres.length){
                                                // var sort_array = [true, false];
                                                // dbres.sort(function(a,b){ // sort them to have paid always on first
                                                //     var ia = sort_array.indexOf(a.paid)
                                                //     var ib = sort_array.indexOf(b.paid)
                                                //     return ia < ib ? 1 : (ia>ib ? -1 : 0);
                                                // })
                                                sendSuccess(res, {
                                                    imageextras: dbres
                                                })
                                            }
                                        }
                                    })
                                }else{
                                    sendSuccess(res, {
                                        imageextras: dbres
                                    })
                                }
                            }
                        })
                    }
                })
            }
        })
    })

    /**
        @@ Get Image Extras associated with Image Type
        @@ Input trainer_id
    **/

    var getImageTypeName = function(image_type,callback){

        var conditions = {
            _id: new Model.ObjectID(image_type)
        };
        var model_imagecategory = Model.load("imagecategory", {}, function(err, model_imagecategory) {
            if (err) {
                callback(err)
            }else{
                model_imagecategory.find(conditions).next(function(err,dbres){
                    callback(undefined, dbres)
                })
            }
        })
    }

    router.get('/imageextras_groupby_imagetype',function(req,res,next){

        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;

        var condition = {};

        if (trainer_id) {
            condition.trainer_id = trainer_id
        }

        var model_imageextra = Model.load("imageextra", {}, function(err, model_imageextra) {
             if (err) {
                sendError(res, "Failed to access db: " + err)
             }else{
                 model_imageextra.find(condition).sort({image_type: 1, paid: 1}).toArray(function(err, data){
                     if (err) {
                        sendError(res, "Failed to access db: " + err)
                     }else{
                        var image_extra = {};
                        var loadedImageExtras = 0;
                        data.forEach(function(item,index){
                            getImageTypeName(item.image_type, function(error, imagetypeResponse){
                                if(error) sendError(error)
                                else{
                                    var label = imagetypeResponse.label;
                                    if(typeof image_extra[label]=='undefined') image_extra[label] = [];

                                     image_extra[label].push(item);
                                    if(++loadedImageExtras >= data.length){

                                        var result = Object.keys(image_extra).map(function(key) {
                                            return {label:key,data:image_extra[key]};
                                        })

                                        sendSuccess(res, { message: 'Success', data: result})
                                    }
                                }
                            })

                        })
                    }
                })
            }
        })
    })

    /**
        @@ Get Image data with image_id
        @@ This is for getting image data
    **/

    router.get('/imageextra/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_imageextra = Model.load('imageextra', {}, function(err, model_imageextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_imageextra.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "This image data doesn't exist in our record");
                    } else {
                        sendSuccess(res, {
                            imageextra: dbres
                        });
                    }
                });
            }
        });
    });

    /**
        @@ Image EXTRA Modules for EXTRAS
        @@ This is for EXTRAS Section
        @@ Add Image EXTRA

    **/

    router.put('/imageextra', function(req, res, next) {
        var posted_data = req.body.image;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this image data");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_imageextra = Model.load('imageextra', {}, function(err, model_imageextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var saveImage = function(failed) {
                    model_imageextra.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                image: posted_data,
                                failed_files: failed
                            });
                        }
                    });
                };

                if(posted_data.label) posted_data.label = posted_data.label.replace(/\s+$/, '');

                if (model_imageextra.verify(posted_data)) {

                    posted_data.created_at = (new Date()).getTime();
                    posted_data.updated_at = (new Date()).getTime();

                    /** If User choose From Media Library **/
                    if (typeof posted_data.paid != "undefined") {
                        posted_data.paid = true;
                    }else{
                        posted_data.paid = false;
                    }

                    if (req.files && req.files.length) {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                        Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (posted_data.photo ? posted_data.photo : posted_data.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                            if (!succeeded.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {


                                if (fields.image) {
                                    posted_data.image = fields.image.shift();

                                } else {

                                    if (!posted_data.image) {
                                        posted_data.image = "";
                                    }

                                }

                                if (fields.image_thumbnail) {
                                    posted_data.image_thumbnail = fields.image_thumbnail.shift();
                                } else {
                                    posted_data.image_thumbnail = posted_data.image_thumbnail || "";
                                }

                                saveImage(failed);

                            }
                        }, function(err, fieldname, eventtype, newvalue) {
                            //pd 2

                        }, posted_data.trainer_id);
                    } else {

                        posted_data.image = posted_data.image || "";

                        if (!posted_data.image) {
                            posted_data.image = "";
                        }

                        posted_data.image_thumbnail = posted_data.image_thumbnail || "";

                        saveImage();
                    }

                } else {
                    sendError(res, "Invalid data for image");
                }
            }
        });
    });

    /**
        @@ Update Image Data
    **/

    router.post('/imageextra/:id', function(req, res, next) {
        var exer = req.body.image;
        var removeImages = req.body.removeImages || [];
        var removeVideo = req.body.removeVideo || "";

        var id = req.params.id;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this image data");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        if(exer.label) exer.label = exer.label.replace(/\s+$/, '');

        var model_imageextra = Model.load('imageextra', {}, function(err, model_imageextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_imageextra.find(conditions).limit(1).next(function(err, image_data) {
                    if (err) {
                        sendError(res, err);
                    } else if (!image_data) {
                        sendError(res, "Image data not found, please try with another image");
                    } else {

                        var _updateImage = function() {

                            if (typeof exer.paid != 'undefined') {
                                exer.paid = true;
                            }else{
                                exer.paid = false;
                            }

                            _.defaults(exer, image_data);
                            delete exer._id;
                            if (model_imageextra.verify(exer)) {


                                if (req.files && req.files.length) {

                                    var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                                    Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + ((exer.photo ? exer.photo : exer.label) + "").replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                        if (!succeeded.length) {
                                            sendError(res, "Failed to upload all file(s)");
                                        } else {

                                            if (typeof fields.image != 'undefined') {
                                                var files = [exer.image];
                                                Model.removeFiles(files, baseFolder);
                                                exer.image = fields.image.shift();
                                            }

                                            if (typeof fields.image_thumbnail != "undefined") {
                                                var anotherfiles = [exer.image_thumbnail];
                                                Model.removeFiles(anotherfiles, baseFolder);
                                                exer.image_thumbnail = fields.image_thumbnail.shift();
                                            }


                                            exer.updated_at = (new Date()).getTime();
                                            model_imageextra.update(conds, {
                                                $set: exer
                                            }, {
                                                multi: true
                                            }, function(err, dbres) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: dbres,
                                                        imageextra: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }, function(err, fieldname, eventtype, newvalue) {

                                    }, exer.trainer_id);

                                } else {

                                    exer.updated_at = (new Date()).getTime();

                                    model_imageextra.update(conds, {
                                        $set: exer
                                    }, {
                                        multi: true
                                    }, function(err, dbres) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: dbres,
                                                imageextra: exer
                                            });
                                        }
                                    });
                                }
                            } else {
                                sendError(res, "Invalid data for image data");
                            }
                        };

                        conds._id = new Model.ObjectID(id);
                        _updateImage();
                    }
                });
            }
        });
    });

    /**
        @@ Delete Image Data
    **/
    router.delete('/imageextra/:id', function(req, res, next) {
        var id = req.params.id;
        var model_imageextra = Model.load('imageextra', {}, function(err, model_imageextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_imageextra.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "Image data not found");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");
                        var files = [dbres.image].concat([dbres.image_thumbnail]);
                        Model.removeFiles(files, baseFolder);

                        model_imageextra.deleteOne(conds, {}, function(err, response) {
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
            }
        });
    });

    /**
        @@ Music EXTRA Data Modules for Music
        @@ This is for EXTRAS Section
        @@ Add/Edit/Delete Music EXTRA

    **/

    router.get('/musicextras', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id
        var model_musicextra = Model.load('musicextra', {}, function(err, model_musicextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err)
            } else {
                var model_musiccategory = Model.load('musiccategory', {}, function(err, model_musiccategory) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err)
                    } else {
                        var conds = {};
                        if (trainer_id) {
                            conds.trainer_id = trainer_id
                        }
                        var __loadMusicCategory = function(conds, callback){
                            model_musiccategory.findOne(conds, {"label":1}, function(err, dbres) {
                                if (err) {
                                    callback(err)
                                } else {
                                    callback(undefined, dbres)
                                }
                            })
                        }

                        var sortOrder = { 'sort_order': 1 , "paid": -1}

                        model_musicextra.find(conds).sort(sortOrder).toArray(function(err, dbres) {
                            if (err) {
                                sendError(res, "Failed to retrieve data for image extra : " + err)
                            } else {
                                var loadedMusics = 0
                                if(dbres && dbres.length){
                                    dbres.forEach(function(result, ind) {
                                        if(typeof result.music_type!='undefined' && result.music_type) {
                                            var conditions = {_id: new Model.ObjectID(result.music_type) }
                                            __loadMusicCategory(conditions, function(error, response){
                                                if(error) sendError(res, "Failed to retrieve data for music extra : " + error)
                                                else{
                                                    dbres[ind].music_type = response
                                                    if(++loadedMusics >= dbres.length){
                                                        sendSuccess(res, {
                                                            musicextras: dbres
                                                        })
                                                    }
                                                }
                                            })
                                        }else{
                                            if(++loadedMusics >= dbres.length){
                                                sendSuccess(res, {
                                                    musicextras: dbres
                                                })
                                            }
                                        }
                                    })
                                }else{
                                    sendSuccess(res, {
                                        musicextras: dbres
                                    })
                                }
                            }
                        })
                    }
                })
            }
        })
    })

    /**
        Get Music Data with music ID

    **/

    router.get('/musicextra/:music_id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var musicID = req.params.music_id;
        var model_musicextra = Model.load('musicextra', {}, function(err, model_musicextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(musicID)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_musicextra.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "This music data doesn't exist in our record");
                    } else {
                        sendSuccess(res, {
                            musicextra: dbres
                        });
                    }
                });
            }
        });
    });

    /**
        @@ Music EXTRA Modules for EXTRAS
        @@ This is for EXTRAS Section
        @@ Add Music EXTRA

    **/

    router.put('/musicextra', function(req, res, next) {
        var posted_data = req.body.music;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this music data");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_musicextra = Model.load('musicextra', {}, function(err, model_musicextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var saveMusic = function(failed) {
                    model_musicextra.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                music: posted_data,
                                failed_files: failed
                            });
                        }
                    });
                };

                if(posted_data.label) posted_data.label = posted_data.label.replace(/\s+$/, '');

                if (model_musicextra.verify(posted_data)) {

                    posted_data.created_at = (new Date()).getTime();
                    posted_data.updated_at = (new Date()).getTime();

                    /** If User choose From Media Library **/
                    if (typeof posted_data.paid != "undefined") {
                        posted_data.paid = true;
                    }else{
                        posted_data.paid = false;
                    }

                    if (req.files && req.files.length) {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                        Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (posted_data.photo ? posted_data.photo : posted_data.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                            if (!succeeded.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {

                                if (fields.image) {
                                    posted_data.image = fields.image.shift();

                                } else {

                                    if (!posted_data.image) {
                                        posted_data.image = "";
                                    }

                                }

                                if (fields.thumbnail) {
                                    posted_data.thumbnail = fields.thumbnail.shift();
                                } else {
                                    posted_data.thumbnail = posted_data.thumbnail || "";
                                }

                                saveMusic(failed);

                            }
                        }, function(err, fieldname, eventtype, newvalue) {
                            //pd 2

                        }, posted_data.trainer_id);
                    } else {

                        posted_data.image = posted_data.image || "";

                        if (!posted_data.image) {
                            posted_data.image = "";
                        }

                        posted_data.thumbnail = posted_data.thumbnail || "";

                        saveMusic();
                    }

                } else {
                    saveMusic(res, "Invalid data for music");
                }
            }
        });
    });

    /**
        @@Update Music Extra
    **/

    router.post('/musicextra/:id', function(req, res, next) {
        var exer = req.body.music;

        var id = req.params.id;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this music data");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        if(exer.label) exer.label = exer.label.replace(/\s+$/, '');

        var model_musicextra = Model.load('musicextra', {}, function(err, model_musicextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_musicextra.find(conditions).limit(1).next(function(err, music_data) {
                    if (err) {
                        sendError(res, err);
                    } else if (!music_data) {
                        sendError(res, "Image data not found, please try with another music");
                    } else {

                        var _updateMusic = function() {

                            if (typeof exer.paid != 'undefined') {
                                exer.paid = true;
                            }else{
                                exer.paid = false;
                            }

                            _.defaults(exer, music_data);
                            delete exer._id;
                            if (model_musicextra.verify(exer)) {


                                if (req.files && req.files.length) {

                                    var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                                    Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + ((exer.photo ? exer.photo : exer.label) + "").replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                        if (!succeeded.length) {
                                            sendError(res, "Failed to upload all file(s)");
                                        } else {

                                            if (typeof fields.image != 'undefined') {
                                                var files = [exer.image];
                                                Model.removeFiles(files, baseFolder);
                                                exer.image = fields.image.shift();
                                            }

                                            if (typeof fields.thumbnail != "undefined") {
                                                var files = [exer.thumbnail];
                                                Model.removeFiles(files, baseFolder);
                                                exer.thumbnail = fields.thumbnail.shift();
                                            }


                                            exer.updated_at = (new Date()).getTime();
                                            model_musicextra.update(conds, {
                                                $set: exer
                                            }, {
                                                multi: true
                                            }, function(err, dbres) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: dbres,
                                                        musicextra: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }, function(err, fieldname, eventtype, newvalue) {

                                    }, exer.trainer_id);

                                } else {

                                    exer.updated_at = (new Date()).getTime();

                                    model_musicextra.update(conds, {
                                        $set: exer
                                    }, {
                                        multi: true
                                    }, function(err, dbres) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: dbres,
                                                musicextra: exer
                                            });
                                        }
                                    });
                                }
                            } else {
                                sendError(res, "Invalid data for music data");
                            }
                        };

                        conds._id = new Model.ObjectID(id);
                        _updateMusic();
                    }
                });
            }
        });
    });


    /**
        @@ Delete Music Data
    **/
    router.delete('/musicextra/:id', function(req, res, next) {
        var id = req.params.id;
        var model_musicextra = Model.load('musicextra', {}, function(err, model_musicextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_musicextra.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "Music data not found, please try again.");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");
                        var files = [dbres.image].concat([dbres.thumbnail]);
                        Model.removeFiles(files, baseFolder);

                        model_musicextra.deleteOne(conds, {}, function(err, response) {
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
            }
        });
    });


    /**
        @@ OTHERS EXTRA Modules for EXTRAS
        @@ This is for EXTRAS Section
        @@ Add/Edit/Delete Others EXTRA like pdf, image

    **/

    router.get('/otherextras', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_otherextra = Model.load('otherextra', {}, function(err, model_otherextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                var sortOrder = { 'sort_order': 1 }
                model_otherextra
                    .find(conds)
                    .sort(sortOrder)
                    .toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve data for video extra : " + err);
                    } else {
                        sendSuccess(res, {
                            otherextras: dbres
                        });
                    }
                });
            }
        });
    });


    /**
        @@ Music EXTRA Modules for EXTRAS
        @@ This is for EXTRAS Section
        @@ Add Music EXTRA

    **/

    router.put('/otherextra', function(req, res, next) {
        var posted_data = req.body.others;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this data");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_otherextra = Model.load('otherextra', {}, function(err, model_otherextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var saveOtherData = function(failed) {
                    model_otherextra.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                music: posted_data,
                                failed_files: failed
                            });
                        }
                    });
                };

                if(posted_data.label) posted_data.label = posted_data.label.replace(/\s+$/, '');

                if (model_otherextra.verify(posted_data)) {

                    posted_data.created_at = (new Date()).getTime();
                    posted_data.updated_at = (new Date()).getTime();

                    /** If User choose From Media Library **/
                    if (typeof posted_data.paid != "undefined") {
                        posted_data.paid = true;
                    }else{
                        posted_data.paid = false;
                    }

                    if (req.files && req.files.length) {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                        Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (posted_data.photo ? posted_data.photo : posted_data.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                            if (!succeeded.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {

                                if (fields.image) {
                                    posted_data.image = fields.image.shift();

                                } else {

                                    if (!posted_data.image) {
                                        posted_data.image = "";
                                    }

                                }

                                if (fields.thumbnail) {
                                    posted_data.thumbnail = fields.thumbnail.shift();
                                } else {
                                    posted_data.thumbnail = posted_data.thumbnail || "";
                                }

                                if (fields.pdf) {
                                    posted_data.pdf = fields.pdf.shift();
                                } else {
                                    posted_data.pdf = posted_data.pdf || "";
                                }

                                if (fields.audio) {
                                    posted_data.audio = fields.audio.shift();
                                } else {
                                    posted_data.audio = posted_data.audio || "";
                                }


                                saveOtherData(failed);

                            }
                        }, function(err, fieldname, eventtype, newvalue) {
                            //pd 2

                        }, posted_data.trainer_id);
                    } else {

                        posted_data.image = posted_data.image || "";

                        if (!posted_data.image) {
                            posted_data.image = "";
                        }

                        posted_data.thumbnail = posted_data.thumbnail || "";

                        posted_data.pdf = posted_data.pdf || "";

                        posted_data.audio = posted_data.audio || "";

                        saveOtherData();
                    }

                } else {
                    sendError(res, "Invalid data, you have missed some required fields");
                }
            }
        });
    });

    /**
        Get Other Data with other-data ID

    **/

    router.get('/otherextra/:other_id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var otherID = req.params.other_id;
        var model_otherextra = Model.load('otherextra', {}, function(err, model_otherextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(otherID)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_otherextra.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "This music data doesn't exist in our record");
                    } else {
                        sendSuccess(res, {
                            otherextra: dbres
                        });
                    }
                });
            }
        });
    });

    /**
        @@Update Other Extra Data
    **/

    router.post('/otherextra/:id', function(req, res, next) {
        var exer = req.body.others;

        var id = req.params.id;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this others data");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        if(exer.label) exer.label = exer.label.replace(/\s+$/, '');

        var model_otherextra = Model.load('otherextra', {}, function(err, model_otherextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_otherextra.find(conditions).limit(1).next(function(err, response) {
                    if (err) {
                        sendError(res, err);
                    } else if (!response) {
                        sendError(res, "Image data not found, please try with another data");
                    } else {

                        var _updateOtherData = function() {

                            if (typeof exer.paid != 'undefined') {
                                exer.paid = true;
                            }else{
                                exer.paid = false;
                            }

                            _.defaults(exer, response);
                            delete exer._id;
                            if (model_otherextra.verify(exer)) {


                                if (req.files && req.files.length) {

                                    var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                                    Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + ((exer.photo ? exer.photo : exer.label) + "").replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                        if (!succeeded.length) {
                                            sendError(res, "Failed to upload all file(s)");
                                        } else {

                                            if (typeof fields.image != 'undefined') {
                                                var files = [exer.image];
                                                Model.removeFiles(files, baseFolder);
                                                exer.image = fields.image.shift();
                                            }

                                            if (typeof fields.thumbnail != "undefined") {
                                                var files = [exer.thumbnail];
                                                Model.removeFiles(files, baseFolder);
                                                exer.thumbnail = fields.thumbnail.shift();
                                            }

                                            if (typeof fields.pdf != "undefined" && fields.pdf) {
                                                var files = [exer.pdf];
                                                Model.removeFiles(files, baseFolder);
                                                exer.pdf = fields.pdf.shift();
                                            }

                                            if (typeof fields.audio != "undefined" && fields.audio) {
                                                var files = [exer.audio];
                                                Model.removeFiles(files, baseFolder);
                                                exer.audio = fields.audio.shift();
                                            }


                                            exer.updated_at = (new Date()).getTime();
                                            model_otherextra.update(conds, {
                                                $set: exer
                                            }, {
                                                multi: true
                                            }, function(err, dbres) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: dbres,
                                                        otherextra: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }, function(err, fieldname, eventtype, newvalue) {

                                    }, exer.trainer_id);

                                } else {

                                    exer.updated_at = (new Date()).getTime();

                                    model_otherextra.update(conds, {
                                        $set: exer
                                    }, {
                                        multi: true
                                    }, function(err, dbres) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: dbres,
                                                otherextra: exer
                                            });
                                        }
                                    });
                                }
                            } else {
                                sendError(res, "Invalid data for other/more data");
                            }
                        };

                        conds._id = new Model.ObjectID(id);
                        _updateOtherData();
                    }
                });
            }
        });
    });

    /**
        @@ Delete Other Data
    **/
    router.delete('/otherextra/:id', function(req, res, next) {
        var id = req.params.id;
        var model_otherextra = Model.load('otherextra', {}, function(err, model_otherextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_otherextra.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "Music data not found, please try again.");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");
                        var files = [dbres.image].concat([dbres.thumbnail], [dbres.pdf]);
                        Model.removeFiles(files, baseFolder);

                        model_otherextra.deleteOne(conds, {}, function(err, response) {
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
            }
        });
    });

    /**
        @@ Event EXTRA Modules for EXTRAS
        @@ This is for EXTRAS Section
        @@ Add/Edit/Delete Event EXTRA

    **/

    router.get('/eventextras', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_eventextra = Model.load('eventextra', {}, function(err, model_eventextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                var sortOrder = { 'sort_order': 1 }
                model_eventextra
                    .find(conds)
                    .sort(sortOrder)
                    .toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve data for event extra : " + err)
                    } else {
                        sendSuccess(res, {
                            eventextras: dbres
                        })
                    }
                })
            }
        })
    })

    /**
        Get Event Data with Event ID

    **/

    router.get('/eventextra/:event_id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var eventID = req.params.event_id;
        var model_eventextra = Model.load('eventextra', {}, function(err, model_eventextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(eventID)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_eventextra.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "This event data doesn't exist in our record");
                    } else {
                        sendSuccess(res, {
                            eventextra: dbres
                        });
                    }
                });
            }
        });
    });

    /**
        @@ Event EXTRA Modules for EVENTS
        @@ This is for EXTRAS Section
        @@ Add Event EXTRA

    **/

    router.put('/eventextra', function(req, res, next) {
        var posted_data = req.body.event;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this data");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_eventextra = Model.load('eventextra', {}, function(err, model_eventextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var saveEventData = function(failed) {
                    model_eventextra.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                music: posted_data,
                                failed_files: failed
                            });
                        }
                    });
                };

                if(posted_data.label) posted_data.label = posted_data.label.replace(/\s+$/, '');

                if (model_eventextra.verify(posted_data)) {

                    posted_data.created_at = (new Date()).getTime();
                    posted_data.updated_at = (new Date()).getTime();

                    if (req.files && req.files.length) {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                        Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (posted_data.photo ? posted_data.photo : posted_data.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                            if (!succeeded.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {


                                if (fields.image) {
                                    posted_data.image = fields.image.shift();
                                } else {
                                    if (!posted_data.image) {
                                        posted_data.image = "";
                                    }

                                }

                                if (fields.video) {
                                    var v = fields.video.shift();
                                    posted_data.video = v.path;
                                    posted_data.video_mime = v.mime;
                                    posted_data.video_thumbnail = v.video_thumbnail;
                                    posted_data.local_video = true;
                                    posted_data.uncompressed = true;
                                } else {
                                    posted_data.video = posted_data.video || "";
                                    if (!posted_data.video) {
                                        posted_data.video = "";
                                    }
                                }

                                saveEventData(failed);

                            }
                        }, function(err, fieldname, eventtype, newvalue) {
                            //pd 2
                            var id = posted_data._id;

                            if (!err) {
                                if (fieldname == "video") {
                                    var o = {};

                                    if (eventtype == "converted") {
                                        o.uncompressed = false;
                                    }
                                    if (eventtype == "uploaded") {
                                        o.local_video = false;
                                        o.video_mime = '';
                                    }
                                    if (newvalue) {
                                        o.video = newvalue;
                                    }


                                    model_videoextra.updateOne({
                                        _id: id
                                    }, {
                                        "$set": o
                                    }, {}, function(err, dbres) {
                                        // TODO: error handling
                                        console.error("update2", err, dbres);
                                    });

                                }
                            }


                        }, posted_data.trainer_id);
                    } else {

                        posted_data.image = posted_data.image || "";
                        posted_data.video = posted_data.video || "";
                        if (!posted_data.image) {
                            posted_data.image = "";
                        }

                        saveEventData();
                    }

                } else {
                    sendError(res, "Invalid data, you have missed some required fields");
                }
            }
        });
    });

    /**
        @@ Update Video Data
    **/

    router.post('/eventextra/:id', function(req, res, next) {
        var exer = req.body.event;
        var removeImages = req.body.removeImages || [];
        var removeVideo = req.body.removeVideo || "";

        var id = req.params.id;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this event data");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        if(exer.label) exer.label = exer.label.replace(/\s+$/, '');

        var model_eventextra = Model.load('eventextra', {}, function(err, model_eventextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_eventextra.find(conditions).limit(1).next(function(err, event_data) {
                    if (err) {
                        sendError(res, err);
                    } else if (!event_data) {
                        sendError(res, "Event data not found, please try with another video");
                    } else {

                        var _updateEvent = function() {

                            _.defaults(exer, event_data);
                            delete exer._id;
                            if (model_eventextra.verify(exer)) {


                                if (removeVideo) {
                                    exer.video = "";
                                    exer.video_thumbnail = "";
                                }

                                if (req.files && req.files.length) {

                                    var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                                    Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + ((exer.photo ? exer.photo : exer.label) + "").replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                        if (!succeeded.length) {
                                            sendError(res, "Failed to upload all file(s)");
                                        } else {

                                            if (typeof fields.image != 'undefined') {
                                                var files = [exer.image];
                                                Model.removeFiles(files, baseFolder);
                                                exer.image = fields.image.shift();
                                            }

                                            if (typeof fields.video != 'undefined') {
                                                var v = fields.video.shift();
                                                exer.video = v.path;
                                                exer.video_mime = v.mime;
                                                exer.video_thumbnail = v.video_thumbnail;
                                                exer.local_video = true;
                                                exer.uncompressed = true;
                                            }

                                            exer.updated_at = (new Date()).getTime();
                                            model_eventextra.update(conds, {
                                                $set: exer
                                            }, {
                                                multi: true
                                            }, function(err, dbres) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: dbres,
                                                        eventextra: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }, function(err, fieldname, eventtype, newvalue) {
                                        // TODO: error handling
                                        if (!err) {
                                            if (fieldname == "video") {
                                                var o = {};

                                                if (eventtype == "converted") {
                                                    o.uncompressed = false;
                                                }
                                                if (eventtype == "uploaded") {
                                                    o.local_video = false;
                                                    o.video_mime = '';
                                                }
                                                if (newvalue) {
                                                    o.video = newvalue;
                                                }

                                                model_eventextra.update(conds, {
                                                    "$set": o
                                                }, {
                                                    multi: true
                                                }, function(err, dbres) {
                                                    // TODO: error handling
                                                    console.error("update2 event data", err, dbres);
                                                });

                                            }
                                        }
                                    }, exer.trainer_id);

                                } else {

                                    exer.updated_at = (new Date()).getTime();
                                    model_eventextra.update(conds, {
                                        $set: exer
                                    }, {
                                        multi: true
                                    }, function(err, dbres) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: dbres,
                                                eventextra: exer
                                            });
                                        }
                                    });
                                }
                            } else {
                                sendError(res, "Invalid data for event data");
                            }
                        };

                        conds._id = new Model.ObjectID(id);
                        _updateEvent();
                    }
                });
            }
        });
    });

    /**
        @@ Delete Event Data
    **/
    router.delete('/eventextra/:id', function(req, res, next) {
        var id = req.params.id;
        var model_eventextra = Model.load('eventextra', {}, function(err, model_eventextra) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_eventextra.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "Event data not found, please try again.");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");
                        var files = [dbres.image];
                        Model.removeFiles(files, baseFolder);

                        model_eventextra.deleteOne(conds, {}, function(err, response) {
                            if (err) {
                                sendError(res, err)
                            } else {
                                sendSuccess(res, {
                                    res: response
                                })
                            }
                        })
                    }
                })
            }
        })
    })


    /**
        @@ Before/After Filters EXTRA Modules for EXTRAS
        @@ This is for EXTRAS Section
        @@ Add/Edit/Delete Before/After Filters EXTRA

    **/

    router.get('/beforeafterimage/:_id', function(req, res, next) {

      var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
      var otherID = req.params._id;
      var model_beforeafterimage = Model.load('beforeafterimage', {}, function(err, model_beforeafterimage) {
        if (err) {
              sendError(res, "Failed to access db: " + err);
        } else {
            var conds = {
                _id: new Model.ObjectID(otherID)
            };
            if (trainer_id) {
              conds.trainer_id = trainer_id;
            }

            model_beforeafterimage.find(conds).limit(1).next(function(err, dbres) {
                if (err) {
                      sendError(res, err);
                } else if (!dbres) {
                      sendError(res, "This music data doesn't exist in our record");
                } else {
                        sendSuccess(res, { beforeafterimage: dbres});
                    }
                })
            }
        })
    })

    router.get('/beforeafterimages', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_beforeafterimage = Model.load('beforeafterimage', {}, function(err, model_beforeafterimage) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }

                var sortOrder = { 'sort_order': 1 }

                model_beforeafterimage
                    .find(conds)
                    .sort(sortOrder)
                    .toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve data for video extra : " + err);
                    } else {
                        sendSuccess(res, {
                            beforeafterimages: dbres
                        });
                    }
                });
            }
        });
    })

    router.put('/beforeafterimage',function(req,res,next){

        var posted_data = req.body.beforeafterimage

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
          return sendError(res, "Not authorized to update this data")
        }
        if (!posted_data.trainer_id && req.trainer_id) {
          posted_data.trainer_id = req.trainer_id;
        }
        var model_beforeafterimage = Model.load('beforeafterimage', {}, function(err, model_beforeafterimage) {
          if (err) {
              sendError(res, "Failed to access db: " + err);
          } else {
                var saveBeforeAfterData = function(failed) {
                    model_beforeafterimage.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                          sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                              res: dbres
                            })
                        }
                    })
                }
            if(posted_data.label) posted_data.label = posted_data.label.replace(/\s+$/, '');


            if (model_beforeafterimage.verify(posted_data)) {

                  posted_data.created_at = (new Date()).getTime();
                  posted_data.updated_at = (new Date()).getTime();


                  if (req.files && req.files.length) {
                      var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                      Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + ((posted_data.photo ? posted_data.photo : posted_data.label) + "").replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {

                          if (!succeeded.length) {
                              sendError(res, "Failed to upload all file(s)");
                          } else {

                              if (typeof fields.image!="undefined") {
                                  posted_data.image = fields.image.shift();

                              }

                              saveBeforeAfterData(failed);

                          }
                      }, function(err, fieldname, eventtype, newvalue) {
                          //pd 2
                      }, posted_data.trainer_id);

                } else {

                    posted_data.image = posted_data.single_image || ""
                    posted_data.image = posted_data.before_after_image || ""

                    saveBeforeAfterData();
                }
            }else {
                sendError(res, "Invalid data, you have missed some required fields");
            }
          }
        });
    })

    router.post('/beforeafterimage/:_id', function(req, res, next) {
        var exer = req.body.beforeafterimage
        var id = req.params._id

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this others data");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        if(exer.label) exer.label = exer.label.replace(/\s+$/, '');

        var model_beforeafterimage = Model.load('beforeafterimage', {}, function(err, model_beforeafterimage) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_beforeafterimage.find(conditions).limit(1).next(function(err, response) {
                    if (err) {
                        sendError(res, err);
                    } else if (!response) {
                        sendError(res, "Image data not found, please try with another data");
                    } else {

                        var _updateBeforeAfterImageData = function() {

                            if (typeof exer.paid != 'undefined') {
                                exer.paid = true;
                            }else{
                                exer.paid = false;
                            }

                            _.defaults(exer, response);
                            delete exer._id;
                            if (model_beforeafterimage.verify(exer)) {


                                if (req.files && req.files.length) {

                                    var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");

                                    Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + ((exer.photo ? exer.photo : exer.label) + "").replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                        if (!succeeded.length) {
                                            sendError(res, "Failed to upload all file(s)");
                                        } else {

                                            if (typeof fields.image != 'undefined') {
                                                var files = [exer.image];
                                                Model.removeFiles(files, baseFolder);
                                                exer.image = fields.image.shift();
                                            }

                                            exer.updated_at = (new Date()).getTime();
                                            model_beforeafterimage.update(conds, {
                                                $set: exer
                                            }, function(err, dbres) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: dbres,
                                                        beforeafterimage: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }, function(err, fieldname, eventtype, newvalue) {

                                    }, exer.trainer_id);

                                } else {

                                    exer.updated_at = (new Date()).getTime();

                                    model_beforeafterimage.update(conds, {
                                        $set: exer
                                    }, function(err, dbres) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: dbres,
                                                beforeafterimage: exer
                                            });
                                        }
                                    });
                                }
                            } else {
                                sendError(res, "Invalid data for other/more data");
                            }
                        }

                        conds._id = new Model.ObjectID(id)
                        _updateBeforeAfterImageData()
                    }
                });
            }
        });
    })

    router.delete('/beforeafterimage/:id', function(req, res, next) {
        var id = req.params.id;
        var model_beforeafterimage = Model.load('beforeafterimage', {}, function(err, model_beforeafterimage) {
          if (err) {
              sendError(res, "Failed to access db: " + err);
          } else {
              var conds = {
                  _id: new Model.ObjectID(id)
              };

              if (req.trainer_id) {
                  conds.trainer_id = req.trainer_id;
              }
              model_beforeafterimage.find(conds).limit(1).next(function(err, dbres) {
                  if (err) {
                      sendError(res, err);
                  } else if (!dbres) {
                      sendError(res, "Before after image data not found, please try again.");
                  } else {
                      var baseFolder = path.join(path.dirname(require.main.filename), "uploads/extras/");
                      var files = [dbres.image]
                      Model.removeFiles(files, baseFolder)

                      model_beforeafterimage.deleteOne(conds, {}, function(err, response) {
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
          }
      });
    })

    router.get('/beforeafter_filters', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_beforeafterimage = Model.load('beforeafterimage', {}, function(err, model_beforeafterimage) {
            if (err) {
                sendError(res, "Failed to access db: " + err)
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id
                }
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id
                }
                model_beforeafterimage.find(conds).sort({
                        'created_at': -1
                    }).toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve data for image extra : " + err)
                    } else {
                        var single_image_filter = double_image_filter = []
                        single_image_filter = dbres.filter(function(item){
                            return item.image_filter_type == "single"
                        })
                        double_image_filter = dbres.filter(function(item){
                            return item.image_filter_type == "double"
                        })
                         sendSuccess(res, {
                            single_image_filter: single_image_filter,
                            double_image_filter: double_image_filter
                        })
                    }
                })
            }
        })
    })

    /**
        @@ Workout/Circuit Modules
        @@ Add/Edit/Delete Workouts
        @@ Copt Workout Day, Circuit, Week Feature
    **/

    router.get('/workout', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var type_filter = req.query.type || '';
        var label_filter = req.query.label || '';
        var keyword_filter = req.query.keyword || '';
        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                if (type_filter) {
                    conds.type = type_filter;
                }
                if (label_filter) {
                    if (label_filter == 'workout') {
                        conds.label = label_filter;
                    } else {
                        conds.label = {
                            $ne: 'workout'
                        };
                    }

                }
                if (keyword_filter) {
                    conds.label = new RegExp('.*' + keyword_filter + '.*', "i");
                }
                if (typeof req.query.is_alternate != 'undefined') {
                    conds.$or = [{
                        is_alternate: {
                            $not: {
                                "$exists": true
                            }
                        }
                    }, {
                        is_alternate: "false"
                    }];
                }
                model_workout.find(conds).sort({
                    'label': 1
                }).toArray(function(err, workouts) {
                    if (err) {
                        sendError(res, "Failed to retrieve workouts: " + err);
                    } else {
                        sendSuccess(res, {
                            workouts: workouts
                        });
                    }
                });
            }
        });
    });

    /**
    	@@ funtion for autocomplete search on Add Workout Form

    **/

    // Regular Expression for removing special characters
    RegExp.escape = function(str) {
        return String(str).replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    router.get('/same_workout', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var type_filter = req.query.type || '';
        var label_filter = req.query.label || '';
        var keyword_filter = req.query.term || '';
        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};

                //conds.$or= [ { is_alternate:{ $not: { "$exists" : true } } } , {  is_alternate : "false" } ];
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                if (type_filter) {
                    conds.type = type_filter;
                }
                if (label_filter) {
                    if (label_filter == 'workout') {
                        conds.label = label_filter;
                    } else {
                        conds.label = {
                            $ne: 'workout'
                        };
                    }

                }
                if (keyword_filter) {
                    conds.label = new RegExp("^"+RegExp.escape(keyword_filter)+".*", "i")
                }

                model_workout.find(conds).sort({
                    'created_at': -1
                }).toArray(function(err, workouts) {
                    if (err) {
                        res.json({
                            error: true,
                            responseCode: 0
                        });
                        res.end();
                    } else if (workouts && workouts.length) {
                        var unique_workout = {};
                        var loadedWorkouts = 0;
                        workouts.forEach(function(workout) {
                            model_workout.loadWorkout(workout._id.toString(), function(err, wout) {
                                if (err) {
                                    return sendError(res, "Failed to retrieve workout details: " + err);
                                } else {
                                    var equipment = "";
                                    if (wout.main_equipments && wout.main_equipments.length) {
                                        wout.main_equipments.forEach(function(e, i) {
                                            var plus = (i < wout.main_equipments.length - 1 ? '+ ' : '');
                                            equipment += e.label + plus;
                                        });
                                    }
                                    wout.equipment = equipment ? " (" + equipment + ")" : "";
                                    unique_workout[workout.label + "_" + wout.equipment] = wout;
                                }
                                if (++loadedWorkouts >= workouts.length) {
                                    var unique_workouts = Object.keys(unique_workout).map(function(kk) {
                                        return unique_workout[kk];
                                    });
                                    res.json(unique_workouts);
                                    return res.end();
                                }
                            });

                        });

                    } else {
                        res.json({
                            error: true,
                            responseCode: 0
                        });
                        res.end();
                    }
                });
            }
        });
    });

    router.get('/workout/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var load_workout = (typeof req.query.no_load != 'undefined') ? false : true;
        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_workout.find(conds).limit(1).next(function(err, workout) {
                    if (err) {
                        sendError(res, err);
                    } else if (!workout) {
                        sendError(res, "Not found");
                    } else {
                        if (!load_workout) {
                            sendSuccess(res, {
                                workout: workout
                            });
                        } else {
                            model_workout.loadWorkout(id, function(err, wout) {
                                if (err) {
                                    sendSuccess(res, {
                                        workout: workout,
                                        err: err
                                    });
                                } else {
                                    sendSuccess(res, {
                                        workout: wout
                                    });
                                }
                            });
                        }


                    }
                });
            }
        });
    });

    /**
        @@ Get Circuit Data bind with Workout (Exercise)
        @@ Input Exercise ID
    **/
    router.get('/parent_workout/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var exercise_id = req.params.id;
        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var model_workout_notes = Model.load('workoutnotes', {}, function(err, model_workout_notes) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err);
                    } else {
                        var conds = {
                            children: {
                                $in: [exercise_id]
                            }
                        };
                        if (trainer_id) {
                            conds.trainer_id = trainer_id;
                        }
                        model_workout.find(conds, {"sets":1, "label":1}).limit(1).next(function(err, circuit) { //Main Circuits

                            if (err) {
                                sendError(res, "Failed to retrieve exercise: " + err);
                            } else {
                                if (!circuit) {
                                    sendError(res, "Circuit data not found");
                                }else{
                                     model_workout_notes.find({workout_id: exercise_id}).toArray(function(err, workout_notes) {

                                        if (err) {
                                            sendError(res, "Failed to retrieve exercise: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                parent_workout: circuit,
                                                workout_notes: workout_notes
                                            })
                                        }
                                    })
                                }
                            }
                        });
                    }
                })
            }
        })
    });

    /**
    	@@ Get Plan ID and Workout Day ID bind with Workout (Exercise)
    **/
    router.get('/plan_and_workoutday/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var exercise_id = req.params.id;
        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    children: {
                        $in: [exercise_id]
                    }
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_workout.find(conds).limit(1).next(function(err, circuit) { //Main Circuits

                    if (err) {
                        sendError(res, "Failed to retrieve exercise: " + err);
                    } else {
                        if (!circuit) {
                            sendError(res, "Not found");
                        }
                        var conds = {
                            children: {
                                $in: [circuit._id.toString()]
                            }
                        };
                        if (trainer_id) {
                            conds.trainer_id = trainer_id;
                        }
                        model_workout.find(conds).limit(1).next(function(err, workout) {
                            if (err) {
                                sendError(res, "Failed to retrieve exercise: " + err);
                            } else {
                                if (workout && workout._id) {
                                    var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
                                        if (err) {
                                            sendError(res, "Failed to access db: " + err);
                                        } else {
                                            var conds2 = {
                                                workout: workout._id.toString()
                                            };
                                            if (trainer_id) {
                                                conds2.trainer_id = trainer_id;
                                            }
                                            model_workoutday.find(conds2).limit(1).next(function(err, workoutday) {
                                                if (err) {
                                                    sendError(res, "Failed to retrieve workout days: " + err);
                                                } else {
                                                    if (!workoutday) {
                                                        sendError(res, "Not found");
                                                    }
                                                    sendSuccess(res, {
                                                        workoutday: workoutday
                                                    });
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    sendError(res, "Not found");
                                }
                            }
                        });
                    }
                });
            }
        });
    });


    /**
    	@@ Get Plan Id and Workout Day Id
    	@@input Workout Alternate Id
    **/

    router.get('/plan_and_workoutday_by_alternate/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var exercise_id = req.params.id;
        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                return sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    alternates: {
                        $in: [exercise_id]
                    }
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_workout.find(conds, {
                    "label": 1
                }).limit(1).next(function(err, main_workout) { // Main Exercise
                    if (err) {
                        return sendError(res, "Failed to retrieve exercise: " + err);
                    } else {
                        if (!main_workout) {
                            return sendError(res, "Not found");
                        }
                        var conds = {
                            children: {
                                $in: [main_workout._id.toString()]
                            }
                        };
                        if (trainer_id) {
                            conds.trainer_id = trainer_id;
                        }
                        model_workout.find(conds, {
                            "label": 1,
                            "is_alternate": 1
                        }).limit(1).next(function(err, circuit) { // Main Circuit
                            if (err) {
                                return sendError(res, "Failed to retrieve exercise: " + err);
                            } else {
                                // Check if Circuit is alternate or not
                                if (circuit && circuit._id && (circuit.is_alternate == "true" || circuit.is_alternate == true)) {
                                    var circuit_alt = circuit._id.toString();
                                    var conds3 = {
                                        alternates: {
                                            $in: [circuit_alt]
                                        }
                                    };
                                    if (trainer_id) {
                                        conds3.trainer_id = trainer_id;
                                    }

                                    model_workout.find(conds3, {
                                        "label": 1
                                    }).limit(1).next(function(err, workout) {

                                        if (err) {
                                            return sendError(res, "Failed to retrieve workout: " + err);
                                        }

                                        var conds4 = {
                                            children: {
                                                $in: [workout._id.toString()]
                                            }
                                        };

                                        if (trainer_id) {
                                            conds.trainer_id = trainer_id;
                                        }
                                        model_workout.find(conds4, {
                                            "label": 1
                                        }).limit(1).next(function(err, wout) {
                                            if (err) {
                                                return sendError(res, "Failed to retrieve workout: " + err);
                                            }
                                            var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
                                                if (err) {
                                                    return sendError(res, "Failed to access db: " + err);
                                                } else {
                                                    var conds2 = {
                                                        workout: wout._id.toString()
                                                    };
                                                    if (trainer_id) {
                                                        conds2.trainer_id = trainer_id;
                                                    }
                                                    model_workoutday.find(conds2).limit(1).next(function(err, workoutday) {
                                                        if (err) {
                                                            return sendError(res, "Failed to retrieve workout days: " + err);
                                                        } else {
                                                            if (!workoutday) {
                                                                return sendError(res, "Not found");
                                                            }
                                                            sendSuccess(res, {
                                                                workoutday: workoutday,
                                                                main_workout: main_workout
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    });
                                } else if (circuit && circuit._id && (circuit.is_alternate == "false" || circuit.is_alternate == false)) {
                                    var conditions = {
                                        children: {
                                            $in: [circuit._id.toString()]
                                        }
                                    };
                                    if (trainer_id) {
                                        conditions.trainer_id = trainer_id;
                                    }
                                    model_workout.find(conditions).limit(1).next(function(err, workout) {
                                        if (err) {
                                            return sendError(res, "Failed to retrieve workout days: " + err);
                                        }
                                        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
                                            if (err) {
                                                sendError(res, "Failed to access db: " + err);
                                            } else {
                                                var conds2 = {
                                                    workout: workout._id.toString()
                                                };
                                                if (trainer_id) {
                                                    conds2.trainer_id = trainer_id;
                                                }
                                                model_workoutday.find(conds2).limit(1).next(function(err, workoutday) {
                                                    if (err) {
                                                        return sendError(res, "Failed to retrieve workout days: " + err);
                                                    } else {
                                                        if (!workoutday) {
                                                            return sendError(res, "Not found");
                                                        }
                                                        sendSuccess(res, {
                                                            workoutday: workoutday,
                                                            main_workout: main_workout
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    });

                                } else {
                                    sendError(res, "Not found");
                                }
                            }
                        });
                    }
                });
            }
        });
    });

    /**
        @@ Get all workouts with same name and Equipments
    **/

    function getAllSimilarWorkouts(trainer_id, id, callback) {
        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                callback("Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                conds.type = 'exercise';
                conds.label = {
                    $ne: 'workout'
                };
                model_workout.find({
                    _id: new Model.ObjectID(id)
                }).limit(1).next(function(err, workout) {
                    if (err) {
                        callback("Failed to retrieve workouts: " + err);
                    } else if (!workout) {
                        callback("Not found");
                    } else {
                        conds.label = new RegExp("^"+RegExp.escape(workout.label)+"$", "i"); // condition for case insensitive
                        model_workout.find(conds).sort({
                            'label': 1
                        }).toArray(function(err, workouts) {
                            if (err) {
                                callback("Failed to retrieve workouts: " + err);
                            } else {
                                var arr = workouts;
                                var matched_workouts = [];
                                arr.forEach(function(wout, i) {

                                    var matched = false;
                                    // find similar workouts
                                    matched = (typeof workout.main_equipments != "undefined" && typeof wout.main_equipments != "undefined" && workout.main_equipments.length == wout.main_equipments.length) || (!workout.main_equipments && !wout.main_equipments);

                                    if (matched && workout.main_equipments.length == wout.main_equipments.length) {
                                        // match all equiments..
                                        for (var e = 0; e < wout.main_equipments.length; e++) {
                                            if (typeof wout.main_equipments[e] != 'undefined' && typeof workout.main_equipments[e] != 'undefined' && wout.main_equipments[e].toString() != workout.main_equipments[e].toString()) {
                                                matched = false;
                                                break;
                                            }
                                        }
                                    }

                                    if (matched) {
                                        matched_workouts.push(wout._id);
                                    }

                                });
                                callback(undefined, matched_workouts);
                            }
                        });
                    }
                });
            }
        });
    }


    router.post('/workout/:id', function(req, res, next) {
        var exer = req.body.workout;
        var removeImages = req.body.removeImages || [];
        var removeVideo = req.body.removeVideo || "";
        var removeMainImage = req.body.removeMainImage || "";
        var removeAlternates = req.body.removeAlternates || [];
        var id = req.params.id;
        var replace = req.body.replace || false;
        var reflect_all = req.body.reflect_all || false;
        var reflect_tips = exer.reflect_tips || false;

        // if (exer.repeat_range && typeof exer.repeat_range == "object") {
        //     var repeat_reange = exer.repeat_range.join('-');
        //     exer.repeat_range = repeat_reange.replace(new RegExp('-' + '$'), "").replace(new RegExp('-*'), "");
        // }
        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this workout");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        if(exer.label) exer.label = exer.label.replace(/\s+$/, '').trim();

        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_workout.find(conditions).limit(1).next(function(err, workout) {
                    if (err) {
                        sendError(res, err);
                    } else if (!workout) {
                        sendError(res, "Not found");
                    } else {

                        var _updateWorkout = function() {

                            if (typeof exer.alternates == 'undefined') {
                                // special case, remove alternates, if nothing was sent
                                exer.alternates = [];
                            }

                            if (typeof exer.body_types == 'undefined' && workout.type == 'exercise') {
                                // special case, remove body types, if nothing was sent
                                exer.body_types = [];
                            }

                            if (typeof exer.main_equipments == 'undefined' && workout.type == 'exercise') {
                                // special case, remove main equipments, if nothing was sent
                                exer.main_equipments = [];
                            }

                            /** Weight track **/
                            if (exer.weight_track == 1 || exer.weight_track == "1") {
                                exer.weight_track = 1;
                            } else {
                                exer.weight_track = 0;
                            }

                            _.defaults(exer, workout);
                            delete exer._id;
                            if (model_workout.verify(exer)) {

                                if (exer.has_steps == true || exer.has_steps == "true") {
                                    exer.has_steps = true;
                                } else {
                                    exer.has_steps = false;
                                }

                                /** If User choose From Media Library **/
                                if (typeof req.body.avtar_media != "undefined") {
                                    exer.image = req.body.avtar_media;
                                }

                                if (removeAlternates && removeAlternates.length) {
                                    for (var i = 0; i < removeAlternates.length; i++) {
                                        workout.alternates.splice(workout.alternates.indexOf(removeAlternates[i]), 1);
                                    }
                                }
                                if (removeVideo) {
                                    exer.video = "";
                                    exer.video_thumbnail = "";
                                }
                                if (removeMainImage) {
                                    exer.image = "";
                                }
                            /** If User comes through Exercise Library **/
                                if (reflect_all) {
                                    delete exer.is_alternate;
                                    if (!reflect_tips) {
                                        delete exer.tip;  // for old field
                                        delete exer.tips; // for new Field
                                    }
                                    delete exer.strength_type;
                                    delete exer.repeat;
                                    delete exer.repeat_range;
                                    delete exer.time;
                                    delete exer.time_in_minutes;
                                    delete exer.gap_between_repetition;
                                    delete exer.alternates;
                                }

                                if (req.files && req.files.length) {

                                    var baseFolder = path.join(path.dirname(require.main.filename), "uploads/workouts/");

                                    Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + ((exer.photo ? exer.photo : exer.label) + "").replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                        if (!succeeded.length) {
                                            sendError(res, "Failed to upload all file(s)");
                                        } else {

                                            if (exer.has_steps && exer.steps) {
                                                // Check if there is new image for any step..
                                                _.forEach(exer.steps, function(es, i) {
                                                    if (typeof fields["step_image_i" + i] != 'undefined') {
                                                        // There is new image for Step#i
                                                        exer.steps[i].image = fields["step_image_i" + i].shift();
                                                    }
                                                });
                                            }
                                            if (workout.type == "exercise" && !workout.image) {
                                                exer.image = (typeof exer.steps[0].image != 'undefined') ? exer.steps[0].image : "";
                                            }

                                            if (typeof fields.image != 'undefined') {
                                                exer.image = fields.image.shift();
                                            }

                                            if (typeof fields.images != 'undefined') {
                                                exer.images = fields.images;
                                            } else {
                                                exer.images = [];
                                            }

                                            if (typeof fields.video != 'undefined') {
                                                var v = fields.video.shift();
                                                exer.video = v.path;
                                                exer.video_mime = v.mime;
                                                exer.video_thumbnail = v.video_thumbnail;
                                                exer.local_video = true;
                                                exer.uncompressed = true;
                                            }

                                            if (typeof fields.videos != 'undefined') {
                                                exer.videos = fields.videos;
                                                exer.local_video = true;
                                                exer.uncompressed = true;
                                            } else {
                                                exer.videos = [];
                                            }

                                            if (typeof fields.video_thumbnail != "undefined") {
                                                exer.video_thumbnail = fields.video_thumbnail.shift();
                                            }

                                            if (removeImages.length) {
                                                for (var i = 0; i < removeImages.length; i++) {
                                                    workout.images.splice(workout.images.indexOf(removeImages[i]), 1);
                                                }
                                            }

                                            if (workout.images.length) {
                                                exer.images = exer.images || [];
                                                for (var i = 0; i < workout.images.length; i++) {
                                                    exer.images.push(workout.images[i]);
                                                }
                                            }
                                            exer.updated_at = (new Date()).getTime();
                                            model_workout.update(conds, {
                                                $set: exer
                                            }, {
                                                multi: true
                                            }, function(err, workout) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: workout,
                                                        workout: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }, function(err, fieldname, eventtype, newvalue) {
                                        // TODO: error handling
                                        if (!err) {
                                            if (fieldname == "video") {
                                                var o = {};

                                                if (eventtype == "converted") {
                                                    o.uncompressed = false;
                                                }
                                                if (eventtype == "uploaded") {
                                                    o.local_video = false;
                                                    o.video_mime = '';
                                                }
                                                if (newvalue) {
                                                    o.video = newvalue;
                                                }

                                                model_workout.update(conds, {
                                                    "$set": o
                                                }, {
                                                    multi: true
                                                }, function(err, workout) {
                                                    // TODO: error handling
                                                    console.error("update2", err, workout);
                                                });

                                            }
                                        }
                                    }, exer.trainer_id);

                                } else {

                                    if (removeImages.length) {
                                        for (var i = 0; i < removeImages.length; i++) {
                                            workout.images.splice(workout.images.indexOf(removeImages[i]), 1);
                                        }
                                    }
                                    if (workout.type == "exercise" && !workout.image) {
                                        exer.image = (typeof exer.steps[0].image != 'undefined') ? exer.steps[0].image : "";
                                    }
                                    if (!removeMainImage) { exer.image = exer.image || workout.image } ;
                                    exer.images = exer.images || workout.images;
                                    exer.updated_at = (new Date()).getTime();
                                    model_workout.update(conds, {
                                        $set: exer
                                    }, {
                                        multi: true
                                    }, function(err, workout) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: workout,
                                                workout: exer
                                            });
                                        }
                                    });
                                }
                            } else {
                                sendError(res, "Invalid data for workout");
                            }
                        };
                        if (reflect_all) {
                            getAllSimilarWorkouts(exer.trainer_id, id, function(err, results) {
                                if (err) {
                                    return sendError(res, err);
                                } else {
                                    if (results && results.length) {
                                        conds._id = {
                                            "$in": results
                                        };
                                        _updateWorkout();
                                    } else {
                                        sendError(res, "Failed to update record");
                                    }

                                }

                            });
                        } else {
                            conds._id = new Model.ObjectID(id);
                            _updateWorkout();
                        }
                    }
                });
            }
        });
    });

    /**
        @@ Copy Workout Day
    **/

    router.post('/copy_workoutday', function(req, res, next) {
        var posted_data= req.body.workoutday;
        var copyFrom = posted_data.copyFrom || 0;
        var copyTo = posted_data.copyTo || 0;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to copy this workoutday");
        }

        if (!copyFrom && !copyTo.week) {
            return sendError(res, "Please specify copy from and copy to");
        }

        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var copyExercise0 = function(w, callback) {
                    delete w._id;
                    w.label = w.label.replace(/\s+$/, '');
                    if(w.type=="exercise") w.sets = "0"; // don't copy set if workout is exercise
                    w.created_at = (new Date()).getTime();
                    w.updated_at = (new Date()).getTime();
                    //if (typeof exer.is_alternate != "undefined") w.is_alternate = exer.is_alternate;
                    model_workout.insert(w, function(err, res) {
                        if (err) {
                            callback(err);
                        } else {

                            callback(undefined, w);
                        }
                    });
                };

                var copyExercise = function(workout, callback) {
                    if (workout.alternates && workout.alternates.length) {
                        var alternatesIds = [];
                        var invalidalternates = [];
                        workout.alternates.forEach(function(wc) {
                            if (!wc || wc.length != 24) {
                                invalidalternates.push(wc);
                                if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                    workout.alternates = alternatesIds;
                                    copyExercise0(workout, callback);
                                }
                            } else {

                                copyWorkout(wc, function(err, nW) {
                                    if (err) {
                                        //callback(err);
                                        invalidalternates.push(wc);
                                    } else {
                                        alternatesIds.push(nW._id + "");
                                    }
                                    if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                        workout.alternates = alternatesIds;
                                        copyExercise0(workout, callback);
                                    }
                                });
                            }

                        });
                    } else {
                        copyExercise0(workout, callback);
                    }
                };

                var copyWorkout = function(w, callback) {
                    model_workout.findOne({
                        "_id": Model.ObjectID(w)
                    }, {}, function(err, workout) {
                        if (err) {
                            return callback(err);

                        } else if (!workout) {
                            return callback("Not found");
                        }
                        if (workout.type == 'group' && workout.children && workout.children.length) {
                            var childrenIds = [];
                            var invalidChildren = [];
                            var _saveChildren = function(i){
                                if(i>=workout.children.length){
                                    workout.children = childrenIds;
                                    copyExercise(workout, callback);
                                }else{
                                    if(!workout.children[i] || workout.children[i].length != 24){
                                        invalidChildren.push(workout.children[i]);
                                        _saveChildren(i+1);
                                    }else{
                                        copyWorkout(workout.children[i], function(err, nW){
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
                            copyExercise(workout, callback);
                        }
                    });

                };

                var copyWorkoutday = function(wday, WorkoutDay, callback){
                    copyWorkout(wday.workout, function(err, newWorkout){
                        if(newWorkout){
                            delete wday._id;
                            wday.workout = newWorkout._id+"";
                            wday.week = copyTo.week;
                            if(copyTo.weekday){
                                wday.weekday = copyTo.weekday;
                            }
                            if(copyTo.plan_id){
                                wday.plan_id = copyTo.plan_id;
                            }
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

                Model.load('workoutday', {}, function(err, model_workoutday){

                    if(err){
                        console.error("Error1: "+err);
                    }
                    var conditions1 = copyTo;

                    if(copyFrom._id) {
                        copyFrom._id = new Model.ObjectID(copyFrom._id);
                    }
                    var conditions2 = copyFrom;

                    if(model_workoutday){
                        // Remove existing copyTo week

                        model_workoutday.remove(conditions1);
                        // Now fetch copyFrom week
                        model_workoutday.find(conditions2).toArray(function(err, workoutdays) {
                            var savedWorkoutdays = 0;
                            var savedDayData = [];
                            var invalidSavedDayData = [];
                            workoutdays.forEach(function(wday){
                                if(err){
                                    console.error("WD Error: "+err);
                                    return;
                                }

                                copyWorkoutday(wday, model_workoutday, function(err, newwday){
                                    if(newwday){
                                        savedDayData.push(newwday._id);
                                    }else{
                                        invalidSavedDayData.push(wday._id);
                                    }

                                    if (++savedWorkoutdays >= workoutdays.length) {

                                            sendSuccess(res, { workoutday: newwday, workoutdays: savedDayData, failed:invalidSavedDayData  });
                                        }
                                });

                            });
                        });
                    }
                });

            }

        });

    });


    /**
        @@ Copy Workout Week
    **/

    router.post('/copy_workoutweek', function(req, res, next) {

        var posted_data= req.body.workoutweek;
        var copyFrom = posted_data.copyFrom || false;
        var copyTo = posted_data.copyTo || false;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to copy this week");
        }

        if (!copyFrom.week && !copyTo.week) {
            return sendError(res, "Please specify copy from and copy to");
        }

        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var copyExercise0 = function(w, callback) {
                    delete w._id;
                    w.label = w.label.replace(/\s+$/, '');
                    if(w.type=="exercise") w.sets = "0"; // don't copy set if workout is exercise
                    w.created_at = (new Date()).getTime();
                    w.updated_at = (new Date()).getTime();
                    //if (typeof exer.is_alternate != "undefined") w.is_alternate = exer.is_alternate;
                    model_workout.insert(w, function(err, res) {
                        if (err) {
                            callback(err);
                        } else {

                            callback(undefined, w);
                        }
                    });
                };

                var copyExercise = function(workout, callback) {
                    if (workout.alternates && workout.alternates.length) {
                        var alternatesIds = [];
                        var invalidalternates = [];
                        workout.alternates.forEach(function(wc) {
                            if (!wc || wc.length != 24) {
                                invalidalternates.push(wc);
                                if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                    workout.alternates = alternatesIds;
                                    copyExercise0(workout, callback);
                                }
                            } else {

                                copyWorkout(wc, function(err, nW) {
                                    if (err) {
                                        //callback(err);
                                        invalidalternates.push(wc);
                                    } else {
                                        alternatesIds.push(nW._id + "");
                                    }
                                    if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                        workout.alternates = alternatesIds;
                                        copyExercise0(workout, callback);
                                    }
                                });
                            }

                        });
                    } else {
                        copyExercise0(workout, callback);
                    }
                };

                var copyWorkout = function(w, callback) {
                    model_workout.findOne({
                        "_id": Model.ObjectID(w)
                    }, {}, function(err, workout) {
                        if (err) {
                            callback(err);
                            return;
                        } else if (!workout) {
                            return callback("Not found");
                        }
                        if (workout.type == 'group' && workout.children && workout.children.length) {
                            var childrenIds = [];
                            var invalidChildren = [];
                            var _saveChildren = function(i){
                                if(i>=workout.children.length){
                                    workout.children = childrenIds;
                                    copyExercise(workout, callback);
                                }else{
                                    if(!workout.children[i] || workout.children[i].length != 24){
                                        invalidChildren.push(workout.children[i]);
                                        _saveChildren(i+1);
                                    }else{
                                        copyWorkout(workout.children[i], function(err, nW){
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
                            copyExercise(workout, callback);
                        }
                    });

                };

                var copyWorkoutday = function(wday, WorkoutDay, callback){
                    copyWorkout(wday.workout, function(err, newWorkout){
                        if(newWorkout){
                            delete wday._id;
                            wday.workout = newWorkout._id+"";
                            wday.week = copyTo.week;
                            if(copyTo.weekday){
                                wday.weekday = copyTo.weekday;
                            }
                            if(copyTo.plan_id){
                                wday.plan_id = copyTo.plan_id;
                            }
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

                Model.load('workoutday', {}, function(err, model_workoutday){

                    if(err){
                       sendError(res, "Error: "+err);
                    }
                    var conditions1 = copyTo;

                    if(copyFrom._id) {
                        copyFrom._id = new Model.ObjectID(copyFrom._id);
                    }
                    var conditions2 = copyFrom;

                    if(model_workoutday){
                        // Remove existing copyTo week

                        model_workoutday.remove(conditions1);
                        // Now fetch copyFrom week
                        model_workoutday.find(conditions2).toArray(function(err, workoutdays) {
                            var savedWorkoutdays = 0;
                            var savedDayData = [];
                            var invalidSavedDayData = [];
                            if(err){
                                sendError(res, "An error occured in workout day: " +err);
                            }
                            if(workoutdays && workoutdays.length)
                            {
                                workoutdays.forEach(function(wday){

                                    copyWorkoutday(wday, model_workoutday, function(err, newwday){
                                        if(newwday){
                                            savedDayData.push(newwday._id);
                                        }else{
                                            invalidSavedDayData.push(wday._id);
                                        }

                                        if (++savedWorkoutdays >= workoutdays.length) {

                                                sendSuccess(res, { success_days: savedDayData, failed:invalidSavedDayData  });
                                            }
                                    });

                                });
                            }else{
                                sendError(res, "Either week or day is missing, please try with another plan/week");
                            }
                        });
                    }
                });

            }

        });

    });

    /**
        @@ Copy Circuit
    **/

    router.post('/copy_circuit', function(req, res, next) {

        var exer = req.body.workout;
        var workout = exer.workoutId;
        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to copy this workout");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }
        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var copyExercise0 = function(w, callback) {
                    delete w._id;
                    w.label = w.label.replace(/\s+$/, '');
                    if(w.type=="exercise") w.sets = "0"; // don't copy set if workout is exercise
                    w.created_at = (new Date()).getTime();
                    w.updated_at = (new Date()).getTime();
                    if (typeof exer.is_alternate != "undefined") w.is_alternate = exer.is_alternate;
                    model_workout.insert(w, function(err, res) {
                        if (err) {
                            callback(err);
                        } else {

                            callback(undefined, w);
                        }
                    });
                };

                var copyExercise = function(workout, callback) {
                    if (workout.alternates && workout.alternates.length) {
                        var alternatesIds = [];
                        var invalidalternates = [];
                        workout.alternates.forEach(function(wc) {
                            if (!wc || wc.length != 24) {
                                invalidalternates.push(wc);
                                if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                    workout.alternates = alternatesIds;
                                    copyExercise0(workout, callback);
                                }
                            } else {

                                copyWorkout(wc, function(err, nW) {
                                    if (err) {
                                        //callback(err);
                                        invalidalternates.push(wc);
                                    } else {
                                        alternatesIds.push(nW._id + "");
                                    }
                                    if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                        workout.alternates = alternatesIds;
                                        copyExercise0(workout, callback);
                                    }
                                });
                            }

                        });
                    } else {
                        copyExercise0(workout, callback);
                    }
                };

                var copyWorkout = function(w, callback) {
                    model_workout.findOne({
                        _id : new Model.ObjectID(w)
                    }, {}, function(err, workout) {
                        if (err) {
                            callback(err);
                            return;
                        } else if (!workout) {
                            return callback("Not found");
                        }
                        if (workout.type == 'group' && workout.children && workout.children.length) {
                            var childrenIds = [];
                            var invalidChildren = [];
                            var _saveChildren = function(i){
                                if(i>=workout.children.length){
                                    workout.children = childrenIds;
                                    copyExercise(workout, callback);
                                }else{
                                    if(!workout.children[i] || workout.children[i].length != 24){
                                        invalidChildren.push(workout.children[i]);
                                        _saveChildren(i+1);
                                    }else{
                                        copyWorkout(workout.children[i], function(err, nW){
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
                            copyExercise(workout, callback);
                        }
                    });

                };

                copyWorkout(workout, function(err, results) {
                    if (err) {
                        sendError(res, "Failed to copy circuit" + err);
                    } else {
                        sendSuccess(res, { workout: results });
                    }

                });
            }

        });

    });


    router.put('/workout', function(req, res, next) {
        var exer = req.body.workout;

        // if (exer.repeat_range && typeof exer.repeat_range == "object") {
        //     var repeat_reange = exer.repeat_range.join('-');
        //     exer.repeat_range = repeat_reange.replace(new RegExp('-' + '$'), "").replace(new RegExp('-*'), "");
        // }

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this workout");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        if(exer.user_id) exer.user_id = Model.ObjectID(exer.user_id)

        if (exer.repeat == '0' && exer.time == '0' && exer.time_in_minutes =='0' && exer.repeat_range == "") {
            return sendError(res, "Either reps or reps range or time must be greater than 0 or non empty");
        }

        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var saveWorkout = function(failed) {
                    model_workout.insertOne(exer, {}, function(err, workout) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: workout,
                                workout: exer,
                                failed_files: failed
                            });
                        }
                    });
                };

                if(exer.label) exer.label = exer.label.replace(/\s+$/, '').trim()
                model_workout.find({
                    label: new RegExp("^"+RegExp.escape(exer.label) + "$", "i"), // condition for case insensitive
                    trainer_id: exer.trainer_id,
                    type: "exercise"
                }).limit(1).next(function(err, already_workout) {
                    if (err) {
                        sendError(res, "Failed to insert record: " + err);
                    } else if (already_workout && typeof req.body.copy_similar == "undefined" && exer.type == 'exercise') {
                        sendError(res, "A workout with same name is already exists in our record");
                    } else {
                        if (model_workout.verify(exer)) {
                            exer.created_at = (new Date()).getTime();
                            exer.updated_at = (new Date()).getTime();
                            if ((exer.has_steps == true || exer.has_steps == "true")) {
                                exer.has_steps = true;
                            } else {
                                exer.has_steps = false;
                            }
                            /** If User choose From Media Library **/
                            if (typeof req.body.avtar_media != "undefined") {
                                exer.image = req.body.avtar_media;
                            }
                            if (typeof exer.main_equipments == 'undefined' && exer.type == 'exercise') {
                                // special case, remove main equipments, if nothing was sent
                                exer.main_equipments = [];
                            }
                            if (req.files && req.files.length) {
                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/workouts/");

                                Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                    if (!succeeded.length) {
                                        sendError(res, "Failed to upload all file(s)");
                                    } else {

                                        if (exer.has_steps && exer.steps && fields.step_image) {
                                            _.forEach(exer.steps, function(step, i) {
                                                exer.steps[i].image = fields.step_image[i] || "";
                                            });
                                        }

                                        if (fields.image) {
                                            exer.image = fields.image.shift();
                                            exer.images = fields.image;
                                        } else {
                                            if (exer.type == "exercise" && !exer.image) {
                                                exer.image = (typeof exer.steps[0].image != 'undefined') ? exer.steps[0].image : "";
                                            }
                                            exer.images = exer.images || [];
                                            if (!exer.image) {
                                                exer.image = "";
                                            }
                                            if (!exer.images) {
                                                exer.images = [];
                                            }

                                        }


                                        if (fields.video) {
                                            var v = fields.video.shift();
                                            exer.videos = [];
                                            exer.video = v.path;
                                            exer.video_mime = v.mime;
                                            exer.video_thumbnail = v.video_thumbnail;
                                            exer.local_video = true;
                                            exer.uncompressed = true;
                                        } else {
                                            exer.video = exer.video || "";
                                            if (!exer.video) {
                                                exer.video = "";
                                            }
                                        }

                                        if (fields.video_thumbnail) {
                                            exer.video_thumbnail = fields.video_thumbnail.shift();
                                        } else {
                                            exer.video_thumbnail = exer.video_thumbnail || "";
                                        }

                                        // if(exer.has_steps && exer.steps){
                                        // 	// Check if there is new image for any step..
                                        // 	_.forEach(exer.steps, function(es, i){
                                        // 		if(typeof fields["step_image_i"+i] != 'undefined'){
                                        // 			// There is new image for Step#i
                                        // 			exer.steps[i].image = fields["step_image_i"+i].shift();
                                        // 		}
                                        // 	});
                                        // }

                                        saveWorkout(failed);

                                    }
                                }, function(err, fieldname, eventtype, newvalue) {
                                    //pd 2
                                    var id = exer._id;

                                    if (!err) {
                                        if (fieldname == "video") {
                                            var o = {};

                                            if (eventtype == "converted") {
                                                o.uncompressed = false;
                                            }
                                            if (eventtype == "uploaded") {
                                                o.local_video = false;
                                                o.video_mime = '';
                                            }
                                            if (newvalue) {
                                                o.video = newvalue;
                                            }


                                            model_workout.updateOne({
                                                _id: id
                                            }, {
                                                "$set": o
                                            }, {}, function(err, workout) {
                                                // TODO: error handling
                                                console.error("update2", err, workout);
                                            });

                                        }
                                    }


                                }, exer.trainer_id);
                            } else {
                                if (exer.type == "exercise" && !exer.image) {
                                    exer.image = (typeof exer.steps[0].image != 'undefined') ? exer.steps[0].image : "";
                                }
                                if (exer.images && exer.images.length) {
                                    exer.image = exer.images.shift() || "";
                                }
                                exer.image = exer.image || "";
                                exer.images = exer.images || [];
                                exer.video = exer.video || "";
                                if (!exer.image) {
                                    exer.image = "";
                                }

                                if (!exer.images.length) {
                                    exer.images = [];
                                }

                                exer.video_thumbnail = exer.video_thumbnail || "";

                                // If we don't have any image...create one.

                                /*if(exer.type == 'exercise'){
                                	// If workout has single exercise, just use image from exercise itself.
                                	var srcFolder = path.join(path.dirname(require.main.filename), "uploads/exercises/");
                                	var destFolder = path.join(path.dirname(require.main.filename), "uploads/workouts/");

                                	var model_exercise = Model.load('exercise', {}, function(err, model_exercise){
                                		if(err){
                                			// Something went wrong, ignore image, simply save workout
                                			saveWorkout();
                                		}else{
                                			model_exercise.find({_id: Model.ObjectID(exer.exercise)}).limit(1).next(function(err, exercise){
                                				if(err || !exercise){
                                					// Something went wrong, ignore image, simply save workout
                                					saveWorkout();
                                				}else{
                                					if(exercise.image){
                                						Model.copyFile(path.join(srcFolder, exercise.image), path.join(destFolder, trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_')+"_"+exercise.image), function(err){
                                							if(err){
                                								saveWorkout();
                                							}else{
                                								exer.image = trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_')+"_"+exercise.image;
                                								Model.generateThumbs(path.join(destFolder, exer.image), saveWorkout);
                                							}
                                						});
                                					}else{
                                						// No image in exercise, save workout
                                						saveWorkout();
                                					}
                                				}
                                			});
                                		}
                                	});

                                }else */
                                if (exer.type == 'group' && exer.children.length && exer.children[0]) {
                                    // If workout has multiple child workouts, take images of those workouts and make a mosaic.
                                    var child_workout_ids = _.map(exer.children, function(n) {
                                        return Model.ObjectID(n);
                                    });
                                    var destFolder = path.join(path.dirname(require.main.filename), "uploads/workouts/");
                                    var w_images = [];

                                    model_workout.find({
                                        _id: {
                                            '$in': child_workout_ids
                                        }
                                    }).forEach(function(w) {
                                        if (w.image) {
                                            w_images.push(w.image);
                                        }
                                    }, function(err) {
                                        if (err) {
                                            saveWorkout();
                                        } else {
                                            if (w_images.length == 1) {
                                                // Just use the first image from it...
                                                exer.image = w_images.shift();
                                                saveWorkout();
                                            } else if (w_images.length >= 2) {

                                                w_images = _.map(w_images, function(wi) {
                                                    var parts = path.parse(wi);
                                                    return path.join(destFolder, parts.dir, parts.name + "_thumb" + parts.ext);
                                                });

                                                Model.createMosaic(w_images, path.join(destFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_') + "_"), function(err, fileName) {
                                                    if (err) {
                                                        saveWorkout();
                                                    } else {
                                                        exer.image = path.basename(fileName);
                                                        Model.generateThumbs(fileName, saveWorkout);
                                                    }

                                                });
                                            } else {
                                                saveWorkout();
                                            }
                                        }
                                    });

                                } else {
                                    // Simply save this workout without image.
                                    saveWorkout();
                                }


                            }

                        } else {
                            sendError(res, "Invalid data for workout");
                        }
                    }
                });
            }
        });
    });

    /**
        **@@ Delete Workout
        **@@ param workoutid
    **/
    router.delete('/workout/:id', function(req, res, next) {
        var id = req.params.id;
        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                model_workout.find(conds).limit(1).next(function(err, workout) {
                    if (err) {
                        sendError(res, err);
                    } else if (!workout) {
                        sendError(res, "Not found");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/workouts/");
                        var files = [workout.image].concat(workout.images, [workout.video], workout.videos);
                        // Model.removeFiles(files, baseFolder);

                        model_workout.deleteOne(conds, {}, function(err, workout) {
                            if (err) {
                                sendError(res, err);
                            } else {
                                sendSuccess(res, {
                                    res: workout
                                });
                            }
                        });
                    }
                });
            }
        });
    });


    router.get('/workoutday', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_workoutday.find(conds).toArray(function(err, workoutdays) {
                    if (err) {
                        sendError(res, "Failed to retrieve workout days: " + err);
                    } else {
                        sendSuccess(res, {
                            workoutdays: workoutdays
                        });
                    }
                });
            }
        });
    });

    /** Load All Workoutdays with respect to their workouts **/

    router.get('/workoutday_with_workout', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var keyword_filter = req.query.keyword || '';
        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                if (keyword_filter) {
                    conds.label = new RegExp('^' + keyword_filter + '.*$', "i");
                }
                model_workoutday.find(conds).toArray(function(err, workoutdays) {
                    if (err) {
                        sendError(res, "Failed to retrieve workout days: " + err);
                    } else {
                        var model_workout = Model.load('workout', {}, function(err, model_workout) {
                            if (err) {
                                sendError(res, "Failed to access db: " + err);
                            } else {
                                var load_workout = (typeof req.query.no_load != 'undefined') ? false : true;
                                var loadedWorkouts = 0;
                                workoutdays.forEach(function(wDay, ind) {
                                    var id = wDay.workout;

                                    var conds = {
                                        _id: new Model.ObjectID(id)
                                    };
                                    if (trainer_id) {
                                        conds.trainer_id = trainer_id;
                                    }
                                    model_workout.find(conds).limit(1).next(function(err, workout) {
                                        if (err) {
                                            sendError(res, err);
                                        } else if (!workout) {
                                            sendError(res, "Not found");
                                        } else {

                                            workoutdays[ind].workout = workout;

                                        }

                                        if (++loadedWorkouts >= workoutdays.length) {

                                            sendSuccess(res, {
                                                workoutdays: workoutdays
                                            });
                                        }

                                    });

                                });
                            }
                        });
                    }
                });
            }
        });
    });


    /** Load All Workoutdays with respect to their plans **/
    /** This is an API to copy workoutday **/

    router.get('/workoutday_with_plan', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = { plan_type: {$ne: "custom"} }; // check for custom Plan

                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                var fields = { "label":1, "plan_id":1, "week":1, "weekday":1 };
                model_workoutday.find(conds, fields).sort({
                    label: 1,
                    week: 1,
                    weekday: 1,
                    sort_order: 1
                }).toArray(function(err, workoutdays) {
                    if (err) {
                        sendError(res, "Failed to retrieve workout days: " + err);
                    } else {
                        var model_plan = Model.load('trainerplan', {}, function(err, model_plan) {
                            if (err) {
                                sendError(res, "Failed to access db: " + err);
                            } else {

                                var loadedWorkoutDays = 0;
                                if(workoutdays && workoutdays.length){
                                    workoutdays.forEach(function(wDay, ind) {
                                        var plan_id = wDay.plan_id;

                                        var conditions = {
                                            _id: new Model.ObjectID(plan_id)
                                        };

                                        model_plan.find(conditions).limit(1).next(function(err, plan) {
                                            if (err) {
                                                return sendError(res, "Error found to fetch trainer plan" +err);
                                            } else if (plan) {
                                                workoutdays[ind].plan_name = plan.label;
                                                workoutdays[ind].weekday_name = "Week" + wDay.week + " Day" + wDay.weekday + " Plan" + plan.label;
                                            }

                                            if (++loadedWorkoutDays >= workoutdays.length) {

                                                sendSuccess(res, {
                                                    workoutdays: workoutdays
                                                });
                                            }

                                        });

                                    });
                                }else{
                                    sendSuccess(res, {workoutdays: workoutdays});
                                }


                            }
                        });
                    }
                });
            }
        });
    });



    /**
    	@@ Load All Circuits With their WorkoutDays
    	@@ input trainer_id
    **/

    router.get('/workoutday_with_circuit', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var keyword_filter = req.query.keyword || "";
                var conds = {};
                var if_custom_plan = req.query.if_custom_plan || false
                if(if_custom_plan) conds.plan_type = 'custom';
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }

                var rex = new RegExp('.*' + keyword_filter + '.*', "i");

                model_workoutday.find(conds).toArray(function(err, workoutdays) {
                    if (err) {
                        sendError(res, "Failed to retrieve workout days: " + err);
                    } else {
                        var model_workout = Model.load('workout', {}, function(err, model_workout) {
                            if (err) {
                                sendError(res, "Failed to access db: " + err);
                            } else {
                                var loadedWorkouts = 0;
                                workoutdays.forEach(function(wDay, ind) {
                                    var id = wDay.workout;
                                    model_workout.loadWorkout(id, function(err, workout) {
                                        if (err) {
                                            sendError(res, err);
                                        } else if (!workout) {
                                            sendError(res, "Not found");
                                        } else {

                                            workoutdays[ind].workout = workout;

                                        }
                                        if (++loadedWorkouts >= workoutdays.length) {
                                            var filtered_workouts = [];
                                            workoutdays.forEach(function(wDay, ind) { // Workout Days
                                                if (wDay.workout.children && wDay.workout.children.length) {
                                                    var arr = wDay.workout.children;

                                                    arr.forEach(function(wout, ind) { // Circuits
                                                        if (wout.is_alternate == true || wout.is_alternate == "true") {
                                                            return;
                                                        }
                                                        delete wout.children; // delete Exercises
                                                        wout.week = wDay.week;
                                                        wout.weekday = wDay.weekday;
                                                        wout.weekday_name = "Week#" + wDay.week + " Day#" + wDay.weekday;

                                                        //var matched=false;
                                                        // find similar workouts
                                                        /*for(var j=0; j < filtered_workouts.length; j++){
                                                            if(filtered_workouts[j]._id == wout._id) continue;
                                                            matched = false;
                                                            if(filtered_workouts[j].label.trim().toLowerCase() == wout.label.trim().toLowerCase()) {

                                                                matched = filtered_workouts[j].image == wout.image && ((filtered_workouts[j].has_steps && wout.has_steps && filtered_workouts[j].steps.length == wout.steps.length) || (!filtered_workouts[j].has_steps && !wout.has_steps));

                                                                if(matched && filtered_workouts[j].has_steps && wout.has_steps && filtered_workouts[j].steps.length == wout.steps.length){
                                                                    // match all steps..
                                                                    for(var s=0; s<wout.steps.length; s++){
                                                                        if(wout.steps[s].image != filtered_workouts[j].steps[s].image) {
                                                                            matched = false; break;
                                                                        }
                                                                    }
                                                                }

                                                                if(matched){
                                                                    break;
                                                                }
                                                            }
                                                        }*/
                                                        //if(!matched) {
                                                        if (rex.test(wout.label)) {
                                                            filtered_workouts.push(wout);
                                                        }
                                                        //}
                                                        // // For Alternates Circuits
                                                        var alternates = wout.alternates;
                                                        if (alternates && alternates.length) {

                                                            alternates.forEach(function(alt, i) {
                                                                delete alt.children; // delete Exercises
                                                                alt.week = wDay.week;
                                                                alt.weekday = wDay.weekday;
                                                                alt.weekday_name = "Week#" + wDay.week + " Day#" + wDay.weekday;

                                                                //var matched=false;
                                                                // find similar workouts
                                                                /*for(var j=0; j < filtered_workouts.length; j++){
                                                                  if(filtered_workouts[j]._id == alt._id) continue;
                                                                  matched = false;
                                                                  if(filtered_workouts[j].label.trim().toLowerCase() == alt.label.trim().toLowerCase()) {

                                                                    matched = filtered_workouts[j].image == wout.image && ((filtered_workouts[j].has_steps && wout.has_steps && filtered_workouts[j].steps.length == wout.steps.length) || (!filtered_workouts[j].has_steps && !wout.has_steps));

                                                                    if(matched && filtered_workouts[j].has_steps && wout.has_steps && filtered_workouts[j].steps.length == wout.steps.length){
                                                                        // match all steps..
                                                                        for(var s=0; s<wout.steps.length; s++){
                                                                            if(wout.steps[s].image != filtered_workouts[j].steps[s].image) {
                                                                                matched = false; break;
                                                                            }
                                                                        }
                                                                    }

                                                                    if(matched){
                                                                      break;
                                                                    }
                                                                  }
                                                                }*/
                                                                //if(!matched){
                                                                if (rex.test(alt.label)) {
                                                                    filtered_workouts.push(alt);
                                                                }
                                                                //}

                                                            });

                                                        }
                                                    });
                                                }
                                            })

                                            sendSuccess(res, {
                                                workouts: filtered_workouts
                                            });
                                        }

                                    });

                                });
                            }
                        });
                    }
                });
            }
        });
    });


    /**
        @@ Load All Workoutdays with respect to their Execise Library
        @@ Input trainer id
    **/

    router.get('/workoutday_with_exercise', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var keyword_filter = req.query.keyword || '';

        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            }else{
                var conds = { plan_type: {$ne: "custom"} }
                var queryPlanId = req.query.plan_id || false

                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                if(queryPlanId) conds.plan_id = queryPlanId

                if (keyword_filter) {
                    conds.label = new RegExp('^' + keyword_filter + '.*$', "i");
                }
                model_workoutday.find(conds).sort({
                    label: 1,
                    week: 1,
                    weekday: 1,
                    sort_order: 1
                }).toArray(function(err, workoutdays) {

                    if (err) {
                        sendError(res, "Failed to retrieve workout days: " + err);
                    } else {

                        var model_workout = Model.load('workout', {}, function(err, model_workout) {
                            if (err) {
                                sendError(res, "Failed to access db: " + err);
                            } else {
                                var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {

                                        model_tp.find({
                                            trainer_id: trainer_id,
                                            type: { $ne: 'custom'}
                                        }, {
                                            "label": 1,
                                            "type":1
                                        }).toArray(function(err, trainerplans) {

                                            if (err) {
                                                sendError(res, "Failed to retrieve trainer plans: " + err);
                                            } else {
                                                if(workoutdays.length > 0){
                                                    var loadedWorkouts = 0
                                                    for (var wdi = 0; wdi < workoutdays.length; wdi++) {
                                                        (function(wdi) {
                                                            model_workout.loadWorkout(workoutdays[wdi].workout, function(err, w) {
                                                                if (err) {
                                                                    return sendError(res, "Failed to retrieve workout details: " + err);
                                                                }

                                                                workoutdays[wdi].workout = w;
                                                                if (++loadedWorkouts >= workoutdays.length) {

                                                                    var filtered_workouts = [];
                                                                    var loadedPlans = 0;
                                                                    workoutdays.forEach(function(wDay, index) { // Workout Days

                                                                        model_tp.find({_id: new Model.ObjectID(wDay.plan_id)},{"label": 1,"type":1}).next(function(err, plan_data) {
                                                                            if (err) {
                                                                                return sendError(res, "Failed to retrieve workout details: " + err);
                                                                            }else{

                                                                                if (wDay.workout.children && wDay.workout.children.length) {
                                                                                    // sort according to updated_at time

                                                                                    wDay.workout.children.forEach(function(circuit, ind) { // Circuits
                                                                                        circuit.children.sort(function(a,b) { // Exercises
                                                                                            return (a.updated_at < b.updated_at) ? 1 : ((b.updated_at < a.updated_at) ? -1 : 0);
                                                                                        });
                                                                                        // Alternates of Circuits
                                                                                        if (circuit.alternates && circuit.alternates.length) {

                                                                                            circuit.alternates.forEach(function(circuit_alt, i) {
                                                                                                circuit_alt.children.sort(function(a,b) {
                                                                                                    return (a.updated_at < b.updated_at) ? 1 : ((b.updated_at < a.updated_at) ? -1 : 0);
                                                                                                });
                                                                                            });
                                                                                        }

                                                                                    });
                                                                                    wDay.workout.children.forEach(function(circuit, ind) { // Circuits
                                                                                        var arr = circuit.children; // Exercises
                                                                                        var repeat = 1;
                                                                                        arr.forEach(function(wout, i) {
                                                                                            if (wout.is_alternate == true || wout.is_alternate == "true") {
                                                                                                return;
                                                                                            }

                                                                                            wout.week = wDay.week;
                                                                                            wout.weekday = wDay.weekday;
                                                                                            wout.duplicate = 1;
                                                                                            wout.workoutday_id = wDay._id;
                                                                                            wout.plan_id = wDay.plan_id;
                                                                                            wout.plan_label = plan_data?plan_data.label:''


                                                                                            if(typeof wout.similar == 'undefined') {
                                                                                               wout.similar = {}
                                                                                            }
                                                                                            wout.similar[wout.plan_label] = [{
                                                                                                _id: wout._id,
                                                                                                weekday: wout.weekday,
                                                                                                week: wout.week,
                                                                                                workoutday_id: wDay._id,
                                                                                                plan_id: wDay.plan_id,
                                                                                                is_alternate: wout.is_alternate,
                                                                                                plan_label: plan_data?plan_data.label:''
                                                                                            }];
                                                                                            var matched = false;
                                                                                            // find similar workouts
                                                                                            for (var j = 0; j < filtered_workouts.length; j++) {
                                                                                                if (filtered_workouts[j]._id == wout._id) continue;
                                                                                                matched = false;
                                                                                                if (filtered_workouts[j].label.trim().toLowerCase() == wout.label.trim().toLowerCase()) {

                                                                                                    matched = (typeof filtered_workouts[j].main_equipments != "undefined" && typeof wout.main_equipments != "undefined" && filtered_workouts[j].main_equipments.length == wout.main_equipments.length) || (!filtered_workouts[j].main_equipments && !wout.main_equipments);

                                                                                                    if (matched && filtered_workouts[j].main_equipments.length == wout.main_equipments.length) {
                                                                                                        // match all equiments..
                                                                                                        for (var e = 0; e < wout.main_equipments.length; e++) {
                                                                                                            if (typeof wout.main_equipments[e]._id != 'undefined' && typeof filtered_workouts[j].main_equipments[e]._id != 'undefined' && wout.main_equipments[e]._id.toString() != filtered_workouts[j].main_equipments[e]._id.toString()) {
                                                                                                                matched = false;
                                                                                                                break;
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                    if (matched) {
                                                                                                        if (typeof filtered_workouts[j].similar[wout.plan_label] == "undefined") {
                                                                                                            filtered_workouts[j].similar[wout.plan_label] = []
                                                                                                        }

                                                                                                        filtered_workouts[j].similar[wout.plan_label].push(wout);
                                                                                                        filtered_workouts[j].duplicate++;
                                                                                                        break;
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                            if (!matched) {
                                                                                                filtered_workouts.push(wout);
                                                                                            }
                                                                                            // For Alternates Exercise
                                                                                            var alternates = wout.alternates;
                                                                                            if (alternates && alternates.length) {

                                                                                                alternates.forEach(function(alt, i) {
                                                                                                    alt.week = wDay.week;
                                                                                                    alt.weekday = wDay.weekday;
                                                                                                    alt.workoutday_id = wDay._id;
                                                                                                    alt.plan_id = wDay.plan_id;
                                                                                                    alt.parent_workout = wout._id;
                                                                                                    alt.duplicate = 1;
                                                                                                    alt.plan_label = plan_data?plan_data.label:''

                                                                                                    if(typeof alt.similar == 'undefined') {
                                                                                                       alt.similar = {}
                                                                                                    }
                                                                                                    alt.similar[alt.plan_label] = [{
                                                                                                        _id: alt._id,
                                                                                                        weekday: alt.weekday,
                                                                                                        week: alt.week,
                                                                                                        workoutday_id: wDay._id,
                                                                                                        plan_id: wDay.plan_id,
                                                                                                        parent_workout: wout._id,
                                                                                                        is_alternate: alt.is_alternate,
                                                                                                        plan_label : plan_data?plan_data.label:''
                                                                                                    }];
                                                                                                    var matched = false;
                                                                                                    // find similar workouts
                                                                                                    for (var j = 0; j < filtered_workouts.length; j++) {
                                                                                                        if (filtered_workouts[j]._id == alt._id) continue;
                                                                                                        matched = false;
                                                                                                        if (filtered_workouts[j].label.trim().toLowerCase() == alt.label.trim().toLowerCase()) {

                                                                                                            matched = (typeof filtered_workouts[j].main_equipments != "undefined" && typeof alt.main_equipments != "undefined" && filtered_workouts[j].main_equipments.length == alt.main_equipments.length) || (!filtered_workouts[j].main_equipments && !alt.main_equipments);

                                                                                                            if (matched && filtered_workouts[j].main_equipments.length == alt.main_equipments.length) {
                                                                                                                // match all equiments..
                                                                                                                for (var e = 0; e < alt.main_equipments.length; e++) {
                                                                                                                    if (typeof alt.main_equipments[e]._id != 'undefined' && typeof filtered_workouts[j].main_equipments[e]._id != 'undefined' && alt.main_equipments[e]._id.toString() != filtered_workouts[j].main_equipments[e]._id.toString()) {
                                                                                                                        matched = false;
                                                                                                                        break;
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                            if (matched) {
                                                                                                                if (typeof filtered_workouts[j].similar[alt.plan_label] == "undefined") {
                                                                                                                    filtered_workouts[j].similar[alt.plan_label] = []
                                                                                                                }
                                                                                                                filtered_workouts[j].similar[alt.plan_label].push(alt);
                                                                                                                filtered_workouts[j].duplicate++;
                                                                                                                break;
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                    if (!matched) {
                                                                                                        filtered_workouts.push(alt);
                                                                                                    }

                                                                                                });

                                                                                            }

                                                                                        });

                                                                                        var circuit_alternates = circuit.alternates; // Alternates of Circuits
                                                                                        if (circuit_alternates && circuit_alternates.length) {

                                                                                            circuit_alternates.forEach(function(circuit_alt, i) {

                                                                                                var alternates_exer = circuit_alt.children;
                                                                                                if (alternates_exer && alternates_exer.length) {
                                                                                                    alternates_exer.forEach(function(wa, i) { // Workout Alternates
                                                                                                        if (wa.is_alternate == true || wa.is_alternate == "true") {
                                                                                                            return;
                                                                                                        }
                                                                                                        wa.week = wDay.week;
                                                                                                        wa.weekday = wDay.weekday;
                                                                                                        wa.duplicate = 1;
                                                                                                        wa.workoutday_id = wDay._id;
                                                                                                        wa.plan_id = wDay.plan_id;
                                                                                                        wa.plan_label = plan_data?plan_data.label:''
                                                                                                        if(typeof wa.similar == 'undefined') {
                                                                                                           wa.similar = {}
                                                                                                        }
                                                                                                        wa.similar[wa.plan_label] = [{
                                                                                                            _id: wa._id,
                                                                                                            weekday: wa.weekday,
                                                                                                            week: wa.week,
                                                                                                            workoutday_id: wDay._id,
                                                                                                            plan_id: wDay.plan_id,
                                                                                                            is_alternate: wa.is_alternate,
                                                                                                            plan_label : plan_data?plan_data.label:''
                                                                                                        }];
                                                                                                        var matched = false;
                                                                                                        // find similar workouts
                                                                                                        for (var j = 0; j < filtered_workouts.length; j++) {
                                                                                                            if (filtered_workouts[j]._id == wa._id) continue;
                                                                                                            matched = false;
                                                                                                            if (filtered_workouts[j].label.trim().toLowerCase() == wa.label.trim().toLowerCase()) {

                                                                                                                matched = (typeof filtered_workouts[j].main_equipments != "undefined" && typeof wa.main_equipments != "undefined" && filtered_workouts[j].main_equipments.length == wa.main_equipments.length) || (!filtered_workouts[j].main_equipments && !wa.main_equipments);

                                                                                                                if (matched && filtered_workouts[j].main_equipments.length == wa.main_equipments.length) {
                                                                                                                    // match all equiments..
                                                                                                                    for (var e = 0; e < wa.main_equipments.length; e++) {
                                                                                                                        if (typeof wa.main_equipments[e]._id != 'undefined' && typeof filtered_workouts[j].main_equipments[e]._id != 'undefined' && wa.main_equipments[e]._id.toString() != filtered_workouts[j].main_equipments[e]._id.toString()) {
                                                                                                                            matched = false;
                                                                                                                            break;
                                                                                                                        }
                                                                                                                    }
                                                                                                                }

                                                                                                                if (matched) {
                                                                                                                    if (typeof filtered_workouts[j].similar[wa.plan_label] == "undefined") {
                                                                                                                        filtered_workouts[j].similar[wa.plan_label] = []
                                                                                                                    }
                                                                                                                    filtered_workouts[j].similar[wa.plan_label].push(wa);
                                                                                                                    filtered_workouts[j].duplicate++;
                                                                                                                    break;
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                        if (!matched) {
                                                                                                            filtered_workouts.push(wa);
                                                                                                        }
                                                                                                        // // For Alternates Exercise of Alternates Circuits
                                                                                                        var alternates = wa.alternates;
                                                                                                        if (alternates && alternates.length) {

                                                                                                            alternates.forEach(function(cawa, i) {
                                                                                                                cawa.week = wDay.week;
                                                                                                                cawa.weekday = wDay.weekday;
                                                                                                                cawa.duplicate = 1;
                                                                                                                cawa.workoutday_id = wDay._id;
                                                                                                                cawa.plan_id = wDay.plan_id;
                                                                                                                cawa.parent_workout = wa._id;
                                                                                                                cawa.plan_label = plan_data?plan_data.label:''
                                                                                                                if(typeof cawa.similar == 'undefined') {
                                                                                                                   cawa.similar = {}

                                                                                                                }
                                                                                                                cawa.similar[cawa.plan_label] = [{
                                                                                                                    _id: cawa._id,
                                                                                                                    weekday: cawa.weekday,
                                                                                                                    week: cawa.week,
                                                                                                                    workoutday_id: wDay._id,
                                                                                                                    plan_id: wDay.plan_id,
                                                                                                                    parent_workout: wa._id,
                                                                                                                    is_alternate: cawa.is_alternate,
                                                                                                                    plan_label : plan_data?plan_data.label:''
                                                                                                                }];
                                                                                                                var matched = false;
                                                                                                                // find similar workouts
                                                                                                                for (var j = 0; j < filtered_workouts.length; j++) {
                                                                                                                    if (filtered_workouts[j]._id == cawa._id) continue;
                                                                                                                    matched = false;
                                                                                                                    if (filtered_workouts[j].label.trim().toLowerCase() == cawa.label.trim().toLowerCase()) {

                                                                                                                        matched = (typeof filtered_workouts[j].main_equipments != "undefined" && typeof cawa.main_equipments != "undefined" && filtered_workouts[j].main_equipments.length == cawa.main_equipments.length) || (!filtered_workouts[j].main_equipments && !cawa.main_equipments);

                                                                                                                        if (matched && filtered_workouts[j].main_equipments.length == cawa.main_equipments.length) {
                                                                                                                            // match all equiments..
                                                                                                                            for (var e = 0; e < cawa.main_equipments.length; e++) {
                                                                                                                                if (typeof cawa.main_equipments[e]._id != 'undefined' && typeof filtered_workouts[j].main_equipments[e]._id != 'undefined' && cawa.main_equipments[e]._id.toString() != filtered_workouts[j].main_equipments[e]._id.toString()) {
                                                                                                                                    matched = false;
                                                                                                                                    break;
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }

                                                                                                                        if (matched) {
                                                                                                                            if (typeof filtered_workouts[j].similar[cawa.plan_label] == "undefined") {
                                                                                                                                filtered_workouts[j].similar[cawa.plan_label] = []
                                                                                                                            }
                                                                                                                            filtered_workouts[j].similar[cawa.plan_label].push(cawa);
                                                                                                                            filtered_workouts[j].duplicate++;
                                                                                                                            break;
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                                if (!matched) {
                                                                                                                    filtered_workouts.push(cawa);
                                                                                                                }

                                                                                                            });

                                                                                                        }

                                                                                                    })

                                                                                                }

                                                                                            });

                                                                                        }

                                                                                    });
                                                                                }
                                                                            }
                                                                            if(++loadedPlans >= workoutdays.length){
                                                                               // sort with Workout Label
                                                                                filtered_workouts.sort(function(a, b) {
                                                                                    return a.label.localeCompare(b.label);
                                                                                })
                                                                                sendSuccess(res, {
                                                                                    filtered_workouts: filtered_workouts,
                                                                                    trainerplans: trainerplans
                                                                                });
                                                                            }
                                                                        })

                                                                    });
                                                                 }
                                                            });
                                                        })(wdi);
                                                    }
                                                }else{
                                                    sendSuccess(res, {
                                                        filtered_workouts: [],
                                                        trainerplans: trainerplans
                                                    });
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                }) //end here

            }
        })
    })


    /**
    	@@Export Exercise Library
    	@@ trainer id
    **/

    router.get('/export_to_csv/:plan_id?', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var keyword_filter = req.query.keyword || '';
        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = { plan_type: {$ne: "custom"} };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                if (keyword_filter) {
                    conds.label = new RegExp('^' + keyword_filter + '.*$', "i");
                }

                var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err);
                    } else {

                        model_workoutday.find(conds).sort({
                            label: 1,
                            week: 1,
                            weekday: 1,
                            sort_order: 1
                        }).toArray(function(err, workoutdays) {
                            if (err) {
                                sendError(res, "Failed to retrieve workout days: " + err);
                            } else {
                                var model_workout = Model.load('workout', {}, function(err, model_workout) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {

                                        var loadedWorkouts = 0;
                                        if (workoutdays.length) {
                                            for (var wdi = 0; wdi < workoutdays.length; wdi++) {
                                                (function(wdi) {
                                                    model_workout.loadWorkout(workoutdays[wdi].workout, function(err, w) {
                                                        if (err) {
                                                            return sendError(res, "Failed to retrieve workout details: " + err);
                                                        }
                                                        workoutdays[wdi].workout = w;
                                                        if (++loadedWorkouts >= workoutdays.length) {
                                                            var filtered_workouts = [];
                                                            var loadedPlans = 0;
                                                            workoutdays.forEach(function(wDay, ind) { // Workout Days

                                                                model_tp.findOne({
                                                                    _id: new Model.ObjectID(wDay.plan_id)
                                                                }, {
                                                                    "label": 1
                                                                }, function(err, trainerplans) {
                                                                    if (err) {
                                                                        return sendError(res, "Failed to retrieve plan details: " + err);
                                                                    } else {

                                                                        wDay.plan_name = trainerplans;

                                                                        if (wDay.workout.children && wDay.workout.children.length) {
                                                                            wDay.workout.children.forEach(function(circuit, ind) { // Circuits
                                                                                var arr = circuit.children; // Exercises

                                                                                var repeat = 1;
                                                                                arr.forEach(function(wout, i) {
                                                                                    if (wout.is_alternate == true || wout.is_alternate == "true") {
                                                                                        return;
                                                                                    }

                                                                                    wout.week = wDay.week;
                                                                                    wout.weekday = wDay.weekday;
                                                                                    wout.workoutday_name = wDay.label;

                                                                                    if(trainerplans){
                                                                                        wout.plan_name = wDay.plan_name.label
                                                                                    }else{
                                                                                        wout.plan_name = ''
                                                                                    }
                                                                                    wout.duplicate = 1;
                                                                                    wout.similar = [{
                                                                                        _id: wout._id,
                                                                                        weekday: wout.weekday,
                                                                                        week: wout.week
                                                                                    }];
                                                                                    var matched = false;
                                                                                    // find similar workouts
                                                                                    for (var j = 0; j < filtered_workouts.length; j++) {
                                                                                        if (filtered_workouts[j]._id == wout._id) continue;
                                                                                        matched = false;
                                                                                        if (filtered_workouts[j].label.trim().toLowerCase() == wout.label.trim().toLowerCase()) {

                                                                                            matched = (typeof filtered_workouts[j].main_equipments != "undefined" && typeof wout.main_equipments != "undefined" && filtered_workouts[j].main_equipments.length == wout.main_equipments.length) || (!filtered_workouts[j].main_equipments && !wout.main_equipments);

                                                                                            if (matched && filtered_workouts[j].main_equipments.length == wout.main_equipments.length) {
                                                                                                // match all equiments..
                                                                                                for (var e = 0; e < wout.main_equipments.length; e++) {
                                                                                                    if (typeof wout.main_equipments[e]._id != 'undefined' && typeof filtered_workouts[j].main_equipments[e]._id != 'undefined' && wout.main_equipments[e]._id.toString() != filtered_workouts[j].main_equipments[e]._id.toString()) {
                                                                                                        matched = false;
                                                                                                        break;
                                                                                                    }
                                                                                                }
                                                                                            }

                                                                                            if (matched) {
                                                                                                filtered_workouts[j].similar.push(wout);
                                                                                                filtered_workouts[j].duplicate++;
                                                                                                break;
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                    if (!matched) {
                                                                                        filtered_workouts.push(wout);
                                                                                    }
                                                                                    // // For Alternates Exercise
                                                                                    var alternates = wout.alternates;
                                                                                    if (alternates && alternates.length) {

                                                                                        alternates.forEach(function(alt, i) {
                                                                                            alt.week = wDay.week;
                                                                                            alt.weekday = wDay.weekday;
                                                                                            alt.workoutday_name = wDay.label;

                                                                                            if(trainerplans){
                                                                                                alt.plan_name = wDay.plan_name.label
                                                                                            }else{
                                                                                                alt.plan_name = ''
                                                                                            }
                                                                                            //alt.plan_name = wDay.plan_name.label || "";
                                                                                            alt.duplicate = 1;
                                                                                            alt.similar = [{
                                                                                                _id: alt._id,
                                                                                                weekday: alt.weekday,
                                                                                                week: alt.week
                                                                                            }];
                                                                                            var matched = false;
                                                                                            // find similar workouts
                                                                                            for (var j = 0; j < filtered_workouts.length; j++) {
                                                                                                if (filtered_workouts[j]._id == alt._id) continue;
                                                                                                matched = false;
                                                                                                if (filtered_workouts[j].label.trim().toLowerCase() == alt.label.trim().toLowerCase()) {

                                                                                                    matched = (typeof filtered_workouts[j].main_equipments != "undefined" && typeof alt.main_equipments != "undefined" && filtered_workouts[j].main_equipments.length == alt.main_equipments.length) || (!filtered_workouts[j].main_equipments && !alt.main_equipments);

                                                                                                    if (matched && filtered_workouts[j].main_equipments.length == alt.main_equipments.length) {
                                                                                                        // match all equiments..
                                                                                                        for (var e = 0; e < alt.main_equipments.length; e++) {
                                                                                                            if (typeof alt.main_equipments[e]._id != 'undefined' && typeof filtered_workouts[j].main_equipments[e]._id != 'undefined' && alt.main_equipments[e]._id.toString() != filtered_workouts[j].main_equipments[e]._id.toString()) {
                                                                                                                matched = false;
                                                                                                                break;
                                                                                                            }
                                                                                                        }
                                                                                                    }

                                                                                                    if (matched) {
                                                                                                        filtered_workouts[j].similar.push(alt);
                                                                                                        filtered_workouts[j].duplicate++;
                                                                                                        break;
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                            if (!matched) {
                                                                                                filtered_workouts.push(alt);
                                                                                            }

                                                                                        });

                                                                                    }

                                                                                });

                                                                                var circuit_alternates = circuit.alternates; // Alternates of Circuits
                                                                                if (circuit_alternates && circuit_alternates.length) {

                                                                                    circuit_alternates.forEach(function(circuit_alt, i) {

                                                                                        var alternates_exer = circuit_alt.children;
                                                                                        if (alternates_exer && alternates_exer.length) {
                                                                                            alternates_exer.forEach(function(wa, i) { // Workout Alternates

                                                                                                if (wa.is_alternate == true || wa.is_alternate == "true") {
                                                                                                    return;
                                                                                                }
                                                                                                wa.week = wDay.week;
                                                                                                wa.weekday = wDay.weekday;
                                                                                                wa.workoutday_name = wDay.label;
                                                                                                if(trainerplans){
                                                                                                    wa.plan_name = wDay.plan_name.label
                                                                                                }else{
                                                                                                    wa.plan_name = ''
                                                                                                }
                                                                                                //wa.plan_name = wDay.plan_name.label || "";
                                                                                                wa.duplicate = 1;
                                                                                                wa.similar = [{
                                                                                                    _id: wa._id,
                                                                                                    weekday: wa.weekday,
                                                                                                    week: wa.week
                                                                                                }];
                                                                                                var matched = false;
                                                                                                //find similar workout
                                                                                                for (var j = 0; j < filtered_workouts.length; j++) {
                                                                                                    if (filtered_workouts[j]._id == wa._id) continue;
                                                                                                    matched = false;
                                                                                                    if (filtered_workouts[j].label.trim().toLowerCase() == wa.label.trim().toLowerCase()) {

                                                                                                        matched = (typeof filtered_workouts[j].main_equipments != "undefined" && typeof wa.main_equipments != "undefined" && filtered_workouts[j].main_equipments.length == wa.main_equipments.length) || (!filtered_workouts[j].main_equipments && !wa.main_equipments);

                                                                                                        if (matched && filtered_workouts[j].main_equipments.length == wa.main_equipments.length) {
                                                                                                            // match all equiments..
                                                                                                            for (var e = 0; e < wa.main_equipments.length; e++) {
                                                                                                                if (typeof wa.main_equipments[e]._id != 'undefined' && typeof filtered_workouts[j].main_equipments[e]._id != 'undefined' && wa.main_equipments[e]._id.toString() != filtered_workouts[j].main_equipments[e]._id.toString()) {
                                                                                                                    matched = false;
                                                                                                                    break;
                                                                                                                }
                                                                                                            }
                                                                                                        }

                                                                                                        if (matched) {
                                                                                                            filtered_workouts[j].similar.push(wa);
                                                                                                            filtered_workouts[j].duplicate++;
                                                                                                            break;
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                                if (!matched) {
                                                                                                    filtered_workouts.push(wa);
                                                                                                }
                                                                                                // // For Alternates Exercise of Alternates Circuits
                                                                                                var alternates = wa.alternates;
                                                                                                if (alternates && alternates.length) {

                                                                                                    alternates.forEach(function(cawa, i) {
                                                                                                        cawa.week = wDay.week;
                                                                                                        cawa.weekday = wDay.weekday;
                                                                                                        cawa.workoutday_name = wDay.label;

                                                                                                        if(trainerplans){
                                                                                                            cawa.plan_name = wDay.plan_name.label
                                                                                                        }else{
                                                                                                            cawa.plan_name = ''
                                                                                                        }
                                                                                                        //cawa.plan_name = wDay.plan_name.label || "";
                                                                                                        cawa.duplicate = 1;
                                                                                                        cawa.similar = [{
                                                                                                            _id: cawa._id,
                                                                                                            weekday: cawa.weekday,
                                                                                                            week: cawa.week
                                                                                                        }];
                                                                                                        var matched = false;
                                                                                                        // find similar workouts
                                                                                                        for (var j = 0; j < filtered_workouts.length; j++) {
                                                                                                            if (filtered_workouts[j]._id == cawa._id) continue;
                                                                                                            matched = false;
                                                                                                            if (filtered_workouts[j].label.trim().toLowerCase() == cawa.label.trim().toLowerCase()) {

                                                                                                                matched = (typeof filtered_workouts[j].main_equipments != "undefined" && typeof cawa.main_equipments != "undefined" && filtered_workouts[j].main_equipments.length == cawa.main_equipments.length) || (!filtered_workouts[j].main_equipments && !cawa.main_equipments);

                                                                                                                if (matched && filtered_workouts[j].main_equipments.length == cawa.main_equipments.length) {
                                                                                                                    // match all equiments..
                                                                                                                    for (var e = 0; e < cawa.main_equipments.length; e++) {
                                                                                                                        if (typeof cawa.main_equipments[e]._id != 'undefined' && typeof filtered_workouts[j].main_equipments[e]._id != 'undefined' && cawa.main_equipments[e]._id.toString() != filtered_workouts[j].main_equipments[e]._id.toString()) {
                                                                                                                            matched = false;
                                                                                                                            break;
                                                                                                                        }
                                                                                                                    }
                                                                                                                }

                                                                                                                if (matched) {
                                                                                                                    filtered_workouts[j].similar.push(cawa);
                                                                                                                    filtered_workouts[j].duplicate++;
                                                                                                                    break;
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                        if (!matched) {
                                                                                                            filtered_workouts.push(cawa);
                                                                                                        }

                                                                                                    });

                                                                                                }

                                                                                            })

                                                                                        }

                                                                                    });

                                                                                }

                                                                            });

                                                                        }
                                                                        if (++loadedPlans >= workoutdays.length) {
                                                                            filtered_workouts.sort(function(a, b) {
                                                                                return a.label.localeCompare(b.label);
                                                                            });
                                                                            if (req.query.file_type && req.query.file_type == "csv") {
                                                                                var csv = require("fast-csv");
                                                                                var fs = require("fs");
                                                                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/workouts/");
                                                                                var imgDest = "Exercise-Library-" + trainer_id + ".csv";
                                                                                var filename = path.join(baseFolder, imgDest)
                                                                                var ws = fs.createWriteStream(filename);
                                                                                csv
                                                                                    .write(filtered_workouts, {
                                                                                        headers: true,
                                                                                        transform: function(row) {
                                                                                            var img = !!row.image;
                                                                                            var equipment = "";
                                                                                            var bodypart = "";
                                                                                            var video = !!row.video;
                                                                                            var workout_type = "Exercise";
                                                                                            var week_day = "";
                                                                                            var steps_length = "";

                                                                                            if (row.is_alternate == "true" || row.is_alternate == true) workout_type = "Alternate";

                                                                                            if (row.similar && row.similar.length) {
                                                                                                row.similar.forEach(function(similar, i) {
                                                                                                    var comma = (i < row.similar.length - 1 ? ', ' : '');
                                                                                                    week_day += "Week" + similar.week + " Day" + similar.weekday + comma;
                                                                                                });
                                                                                            }

                                                                                            if (row.main_equipments && row.main_equipments.length) {
                                                                                                row.main_equipments.forEach(function(e, i) {
                                                                                                    var comma = (i < row.main_equipments.length - 1 ? ', ' : '');
                                                                                                    equipment += e.label + comma;
                                                                                                });
                                                                                            }
                                                                                            if (row.body_types && row.body_types.length) {
                                                                                                row.body_types.forEach(function(e, i) {
                                                                                                    var comma = (i < row.body_types.length - 1 ? ', ' : '');
                                                                                                    bodypart += e.label + comma;
                                                                                                });
                                                                                            }

                                                                                            // if (img && row.steps && row.steps.length) {
                                                                                            //     row.steps.forEach(function(s, i) {
                                                                                            //         img = img && (!!s.image);
                                                                                            //     });
                                                                                            // }

                                                                                            if (row.steps && row.steps.length) {
                                                                                                steps_length = row.steps.length;
                                                                                            }

                                                                                            return {
                                                                                                "Plan Name": row.plan_name,
                                                                                                "Workout Name": row.label,
                                                                                                "Workout Type": workout_type,
                                                                                                "Image": img ? 'Yes' : 'No',
                                                                                                "Video Upload": video ? 'Yes' : 'No',
                                                                                                "Video URL": video ? row.video : '',
                                                                                                "Steps": steps_length,
                                                                                                "Equipments": equipment,
                                                                                                "Bodyparts": bodypart,
                                                                                                "Workout Day Name": row.workoutday_name,
                                                                                                "No.of Uses": row.duplicate,
                                                                                                "Seen In": week_day,
                                                                                                "Tip": row.tip
                                                                                            };
                                                                                        }
                                                                                    })
                                                                                    .pipe(ws);
                                                                                ws.on('close', function() {
                                                                                    //res.setHeader('Content-Type', 'text/csv');
                                                                                    //res.setHeader("Content-Disposition", 'attachment; filename='+imgDest);
                                                                                    sendSuccess(res, {
                                                                                        filename: imgDest
                                                                                    });

                                                                                });
                                                                            } else if (req.query.file_type && req.query.file_type == "xlsx") {
                                                                                var fs = require("fs");
                                                                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/workouts/");
                                                                                var imgDest = "Exercise-Library-" + trainer_id + ".xlsx";
                                                                                var filename = path.join(baseFolder, imgDest)
                                                                                var data_array = [];
                                                                                var nodeExcel = require('excel-export');
                                                                                filtered_workouts.forEach(function(row, ind) {
                                                                                    var img = !!row.image;
                                                                                    var equipment = "";
                                                                                    var bodypart = "";
                                                                                    var video = !!row.video;
                                                                                    var workout_type = "Exercise";
                                                                                    var week_day = "";
                                                                                    var steps_length = 0;

                                                                                    if (row.is_alternate == "true" || row.is_alternate == true) workout_type = "Alternate";

                                                                                    if (row.similar && row.similar.length) {
                                                                                        row.similar.forEach(function(similar, i) {
                                                                                            var comma = (i < row.similar.length - 1 ? ', ' : '');
                                                                                            week_day += "Week" + similar.week + " Day" + similar.weekday + comma;
                                                                                        });
                                                                                    }

                                                                                    if (row.main_equipments && row.main_equipments.length) {
                                                                                        row.main_equipments.forEach(function(e, i) {
                                                                                            var comma = (i < row.main_equipments.length - 1 ? ', ' : '');
                                                                                            equipment += e.label + comma;
                                                                                        });
                                                                                    }
                                                                                    if (row.body_types && row.body_types.length) {
                                                                                        row.body_types.forEach(function(e, i) {
                                                                                            var comma = (i < row.body_types.length - 1 ? ', ' : '');
                                                                                            bodypart += e.label + comma;
                                                                                        });
                                                                                    }

                                                                                    // if (img && row.steps && row.steps.length) {
                                                                                    //     row.steps.forEach(function(s, i) {
                                                                                    //         img = img && (!!s.image);
                                                                                    //     });
                                                                                    // }

                                                                                    if (row.steps && row.steps.length) {
                                                                                        steps_length = row.steps.length;
                                                                                    }

                                                                                    var row_array = [row.plan_name, row.label, workout_type, img ? 'Yes' : 'No', video ? 'Yes' : 'No', steps_length, equipment, bodypart, row.workoutday_name, row.duplicate, week_day, row.tip]
                                                                                    data_array.push(row_array);
                                                                                });
                                                                                var conf = {};
                                                                                conf.name = "mysheet";
                                                                                conf.cols = [{
                                                                                    caption: 'Plan Name',
                                                                                    type: 'string',
                                                                                    beforeCellWrite: function(row, cellData) {
                                                                                        return cellData.toUpperCase();
                                                                                    }
                                                                                }, {
                                                                                    caption: 'Workout Name',
                                                                                    type: 'string',
                                                                                }, {
                                                                                    caption: 'Workout Type',
                                                                                    type: 'string',
                                                                                }, {
                                                                                    caption: 'Image',
                                                                                    type: 'string',
                                                                                }, {
                                                                                    caption: 'Video Upload',
                                                                                    type: 'string',
                                                                                }, {
                                                                                    caption: 'Steps',
                                                                                    type: 'number',
                                                                                }, {
                                                                                    caption: 'Equipments',
                                                                                    type: 'string',
                                                                                }, {
                                                                                    caption: 'Bodyparts',
                                                                                    type: 'string',
                                                                                }, {
                                                                                    caption: 'Workout Day Name',
                                                                                    type: 'string',
                                                                                }, {
                                                                                    caption: 'No.of Uses',
                                                                                    type: 'number'
                                                                                }, {
                                                                                    caption: 'Seen In',
                                                                                    type: 'string'
                                                                                }, {
                                                                                    caption: 'Tip',
                                                                                    type: 'string'
                                                                                }];
                                                                                conf.rows = data_array;
                                                                                var result = nodeExcel.execute(conf);
                                                                                try {
                                                                                    fs.writeFileSync(filename, result, 'binary');
                                                                                    sendSuccess(res, {
                                                                                        filename: imgDest
                                                                                    });
                                                                                } catch (err) {
                                                                                    sendError(res, "Error writing file: " + err.message);
                                                                                }

                                                                            } else {
                                                                                sendError(res, "Please specify the file type in which you want to export Exercise Library");
                                                                            }
                                                                        }
                                                                    }
                                                                });

                                                            });

                                                        }
                                                    });
                                                })(wdi);
                                            }
                                        } else {
                                            sendError(res, "No Exercise found in this Plan");
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });

    /**
        @@ Get Random Videos
        @@ Ingrid API
    **/

    function shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    /**
        @@ Get Unique Objects
        @@ Ingrid API
    **/

    function getUnique(arr, comp) {

        const unique = arr
           .map(e => e[comp])

         // store the keys of the unique objects
        .map((e, i, final) => final.indexOf(e) === i && i)

        // eliminate the dead keys & store unique objects
        .filter(e => arr[e]).map(e => arr[e]);

        return unique;
    }

    /**
        @@ Get Randomly 10 elements from an array
        @@ non-destructive (and fast) function:
    **/

    function getRandom(arr, n) {
        var result = new Array(n),
            len = arr.length,
            taken = new Array(len);
        if (n > len)
            throw new RangeError("getRandom: more elements taken than available");
        while (n--) {
            var x = Math.floor(Math.random() * len);
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result;
    }

    /**
        @@ Get Featured Videos API
        @@ Ingrid API
    **/

    router.get('/featured_videos', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;

        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            }else{
                var conds = {}

                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }

                conds.plan_id = {
                    "$in": ["5d0a6af556dc011a1b637318", "5d0d008756dc011a1b6376de", "5d4097d3af41d27b98b3c99d", "5d4097adaf41d27b98b3c99c" ] // only for specific plan ids
                };

                model_workoutday.find(conds).count(function(err, total_days) {
                    if (err) {
                        return sendError(res, "Failed to retrieve workout days: " + err);
                    } else{
                        R = Math.floor(Math.random() * 20);
                        model_workoutday.find(conds).skip(R).limit(100).sort({
                            label: 1,
                            week: 1,
                            weekday: 1,
                            sort_order: 1
                        }).toArray(function(err, workoutdays) {

                            if (err) {
                                sendError(res, "Failed to retrieve workout days: " + err);
                            } else {

                                var model_workout = Model.load('workout', {}, function(err, model_workout) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {
                                        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
                                            if (err) {
                                                sendError(res, "Failed to access db: " + err);
                                            } else {

                                                model_tp.find({
                                                    trainer_id: trainer_id
                                                }, {
                                                    "label": 1,
                                                    "type": 1,
                                                    "weeks": 1,
                                                    "days": 1,
                                                    "image": 1,
                                                    "secondary_image": 1
                                                }).toArray(function(err, trainerplans) {

                                                    if (err) {
                                                        sendError(res, "Failed to retrieve trainer plans: " + err);
                                                    } else {
                                                        if(workoutdays.length > 0){
                                                            var loadedWorkouts = 0
                                                            for (var wdi = 0; wdi < workoutdays.length; wdi++) {
                                                                (function(wdi) {
                                                                    model_workout.loadWorkout(workoutdays[wdi].workout, function(err, w) {
                                                                        if (err) {
                                                                            return sendError(res, "Failed to retrieve workout details: " + err);
                                                                        }

                                                                        workoutdays[wdi].workout = w;
                                                                        if (++loadedWorkouts >= workoutdays.length) {

                                                                            var filtered_workouts = [];
                                                                            var loadedPlans = 0;
                                                                            workoutdays.forEach(function(wDay, index) { // Workout Days

                                                                                // model_tp.find({_id: new Model.ObjectID(wDay.plan_id)},{"label": 1,"type":1}).next(function(err, plan_data) {
                                                                                //     if (err) {
                                                                                //         return sendError(res, "Failed to retrieve workout details: " + err);
                                                                                //     }else{

                                                                                        if (wDay.workout.children && wDay.workout.children.length) {
                                                                                            // sort according to updated_at time

                                                                                            wDay.workout.children.forEach(function(circuit, ind) { // Circuits
                                                                                                circuit.children.sort(function(a,b) { // Exercises
                                                                                                    return (a.updated_at < b.updated_at) ? 1 : ((b.updated_at < a.updated_at) ? -1 : 0);
                                                                                                });

                                                                                            });
                                                                                            wDay.workout.children.forEach(function(circuit, ind) { // Circuits
                                                                                                var arr = circuit.children; // Exercises
                                                                                                arr.forEach(function(wout, i) {
                                                                                                    if(wout.video) filtered_workouts.push(wout)
                                                                                                });
                                                                                            });
                                                                                        }
                                                                                    // }
                                                                                // })
                                                                            });
                                                                            // if(++loadedPlans >= workoutdays.length){
                                                                               // // sort with Workout Label
                                                                               //  filtered_workouts.sort(function(a, b) {
                                                                               //      return a.label.localeCompare(b.label);
                                                                               //  })

                                                                                let valueToHave = [ "5d0a6af556dc011a1b637318", "5d0d008756dc011a1b6376de",  "5d4097d3af41d27b98b3c99d", "5d4097adaf41d27b98b3c99c" ] // Only Long Videos Plans

                                                                                const filteredItems = trainerplans.filter(function(item) {
                                                                                  return valueToHave.indexOf(item._id.toString()) >= 0;
                                                                                })
                                                                                // shuffle data
                                                                                var shuffle_data = shuffle(filtered_workouts)
                                                                                // get unique data
                                                                                var unique_featured_videos = getUnique(shuffle_data, 'label');

                                                                                sendSuccess(res, {
                                                                                    filtered_workouts: getRandom(unique_featured_videos, 10), // Random 10 Videos
                                                                                    trainerplans: trainerplans,
                                                                                    long_video_plans: filteredItems
                                                                                });
                                                                            // }
                                                                        }
                                                                    });
                                                                })(wdi);
                                                            }
                                                        }else{
                                                            sendSuccess(res, {
                                                                filtered_workouts: [],
                                                                trainerplans: trainerplans,
                                                                long_video_plans: []
                                                            });
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        }) //end here
                    }

                })
            }
        })
    })

    router.get('/workoutday/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var model_workoutday_notes = Model.load('workoutdaynotes', {}, function(err, model_workoutday_notes) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err);
                    } else {
                        var conds = {
                            _id: new Model.ObjectID(id)
                        };
                        if (trainer_id) {
                            conds.trainer_id = trainer_id;
                        }
                        model_workoutday.find(conds).limit(1).next(function(err, workoutday) {
                            if (err) {
                                sendError(res, err);
                            } else if (!workoutday) {
                                sendError(res, "Not found", 400);
                            } else {
                                model_workoutday_notes.find({workoutday_id: id}).toArray(function(err, workoutday_notes) {
                                    if(err) {
                                        sendError(res, err);
                                    }else{
                                        sendSuccess(res, {
                                            workoutday: workoutday,
                                            workoutday_notes: workoutday_notes
                                        });
                                    }
                                })
                            }
                        });
                    }
                })
            }
        });
    });

    router.post('/workoutday/:id', function(req, res, next) {
        var exer = req.body.workoutday;
        var removeImages = req.body.removeImages || [];
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this workoutday");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_workoutday.find(conds).limit(1).next(function(err, workoutday) {
                    if (err) {
                        sendError(res, err);
                    } else if (!workoutday) {
                        sendError(res, "Not found");
                    } else {

                        if (!replace) {
                            _.defaults(exer, workoutday);
                            delete exer._id;
                        }

                        if (model_workoutday.verify(exer)) {

                            if (req.files && req.files.length) {

                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/workoutdays/");

                                Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                    if (!succeeded.length) {
                                        sendError(res, "Failed to upload all file(s)");
                                    } else {
                                        if (typeof fields.image != 'undefined') {
                                            exer.image = fields.image.shift();
                                        }

                                        if (typeof fields.images != 'undefined') {
                                            exer.images = fields.images;
                                        } else {
                                            exer.images = [];
                                        }

                                        if (typeof fields.video != 'undefined') {
                                            exer.video = fields.video.shift();
                                        }

                                        if (typeof fields.videos != 'undefined') {
                                            exer.videos = fields.videos;
                                        } else {
                                            exer.videos = [];
                                        }


                                        if (replace) {

                                            if (!exer.image && exer.images && exer.images.length) {
                                                exer.image = exer.images.shift();
                                            }

                                            if (!exer.video && exer.videos && exer.videos.length) {
                                                exer.video = exer.videos.shift();
                                            }
                                            model_workoutday.replaceOne(conds, exer, {}, function(err, workoutday) {
                                                if (err) {
                                                    sendError(res, "Failed to replace record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: workoutday,
                                                        workoutday: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        } else {

                                            if (removeImages.length) {
                                                for (var i = 0; i < removeImages.length; i++) {
                                                    workoutday.images.splice(workoutday.images.indexOf(removeImages[i]), 1);
                                                }
                                            }

                                            if (workoutday.images.length) {
                                                exer.images = exer.images || [];
                                                for (var i = 0; i < workoutday.images.length; i++) {
                                                    exer.images.push(workoutday.images[i]);
                                                }
                                            }

                                            model_workoutday.updateOne(conds, {
                                                $set: exer
                                            }, {}, function(err, workoutday) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: workoutday,
                                                        workoutday: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });

                            } else {
                                if (replace) {
                                    model_workoutday.replaceOne(conds, exer, {}, function(err, workoutday) {
                                        if (err) {
                                            sendError(res, "Failed to replace record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: workoutday,
                                                workoutday: exer
                                            });
                                        }
                                    });
                                } else {

                                    if (removeImages.length) {
                                        for (var i = 0; i < removeImages.length; i++) {
                                            workoutday.images.splice(workoutday.images.indexOf(removeImages[i]), 1);
                                        }
                                    }


                                    exer.images = workoutday.images;


                                    model_workoutday.updateOne(conds, {
                                        $set: exer
                                    }, {}, function(err, workoutday) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: workoutday,
                                                workoutday: exer
                                            });
                                        }
                                    });
                                }
                            }
                        } else {
                            sendError(res, "Invalid data for workoutday");
                        }
                    }
                });
            }
        });
    });

    router.put('/workoutday', function(req, res, next) {
        var exer = req.body.workoutday;
        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this workoutday");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        if(exer.user_id) exer.user_id = Model.ObjectID(exer.user_id)

        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_workoutday.verify(exer)) {

                    if (req.files && req.files.length) {

                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/workoutdays/");

                        Model.uploadFiles(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, succeeded_images, succeeded_videos) {
                            if (!succeeded_images.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {
                                exer.image = succeeded_images.shift();
                                exer.images = succeeded_images;

                                if (succeeded_videos.length) {
                                    exer.video = succeeded_videos.shift();
                                    exer.videos = succeeded_videos;
                                } else {
                                    exer.video = "";
                                }



                                model_workoutday.insertOne(exer, {}, function(err, workoutday) {
                                    if (err) {
                                        sendError(res, "Failed to insert record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: workoutday,
                                            workoutday: exer,
                                            failed_files: failed
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        exer.image = exer.image || "";
                        exer.images = exer.images || [];
                        model_workoutday.insertOne(exer, {}, function(err, workoutday) {
                            if (err) {
                                sendError(res, "Failed to insert record: " + err);
                            } else {
                                sendSuccess(res, {
                                    res: workoutday,
                                    workoutday: exer
                                });
                            }
                        });
                    }
                } else {
                    sendError(res, "Invalid data for workoutday");
                }
            }
        });
    });

    router.delete('/workoutday/:id', function(req, res, next) {
        var id = req.params.id;
        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var model_workout = Model.load('workout', {}, function(err, model_workout) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err);
                    } else {

                        var conds = {
                            _id: new Model.ObjectID(id)
                        };
                        if (req.trainer_id) {
                            conds.trainer_id = req.trainer_id;
                        }

                        model_workoutday.find(conds).limit(1).next(function(err, workoutday) {
                            if (err) {
                                sendError(res, err);
                            } else if (!workoutday) {
                                sendError(res, "Not found");
                            } else {
                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/workoutdays/");
                                var files = [workoutday.image].concat(workoutday.images, [workoutday.video], workoutday.videos);
                                Model.removeFiles(files, baseFolder);

                                model_workoutday.deleteOne(conds, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, err);
                                    } else {
                                        model_workout.find({_id: new Model.ObjectID(workoutday.workout+"")}).forEach(function(main){
                                            model_workout.remove({_id: main._id});
                                            if(main.children && main.children.length){
                                                main.children.forEach(function(cir){
                                                    model_workout.find({_id: new Model.ObjectID(cir)}).forEach(function(circuit){
                                                        model_workout.remove({_id: circuit._id});
                                                        if(circuit.children && circuit.children.length){
                                                            circuit.children.forEach(function(wout){
                                                                model_workout.find({_id: new Model.ObjectID(wout)}).forEach(function(workout){
                                                                    model_workout.remove({_id: workout._id});
                                                                    if(workout.alternates && workout.alternates.length){
                                                                        workout.alternates .forEach(function(alt){
                                                                            model_workout.find({_id: new Model.ObjectID(alt)}).forEach(function(alternate){
                                                                                model_workout.remove({_id: alternate._id});
                                                                            })
                                                                        })
                                                                    }
                                                                })
                                                            })
                                                        }
                                                    })
                                                })
                                            }
                                        })
                                        sendSuccess(res, {
                                            res: dbres
                                        });
                                    }
                                });
                            }
                        });
                    }
                })
            }
        });
    });

    /** Load All Workoutdays with respect to their workouts **/
    router.delete('/remove_workout_day_image', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var workout_id = req.query.workout_id || false
        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if(err){
                sendError(res, "Failed to access db: " + err);
            }else{
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                if (req.query.workout_id) {
                    conds._id = new Model.ObjectID(workout_id);
                }
                 model_workout.find(conds).limit(1).next(function(err, workout) {
                    if (err) {
                        sendError(res, err);
                    } else if (!workout) {
                        sendError(res, "Not found, please try again");
                    } else {
                        model_workout.updateOne(conds, {$set: {image:''}}, {}, function(errdata, dbres) {
                            if(errdata){
                                sendError(res, "Image not deleted: " + errdata);
                            }else{
                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/workouts/");
                                var files = [workout.image];
                                Model.removeFiles(files, baseFolder);
                                sendSuccess(res, { 'message': 'Successfully deleted', workout: dbres });
                            }
                        })
                    }
                })
            }
        })
     })

    /**
        @@ Get All Plans Key
        @@ Web API
    **/

    router.get('/plan', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                conds.$or = [{"type":"main"}, {"type":"side"}, {"type":"challenge", "challenge": true}];

                model_tp.find(conds).sort({sort_order: 1}).toArray(function(err, trainerplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plans: " + err);
                    } else {
                        /**
                            @@ Extra Check for MTC Trainer
                            @@ To populate Main Plan at first Index
                        **/
                        var plan_sort_arr = {
                            '5822bfb2b86828570dd90899': ['5822bfd0b86828570dd9089a', '5a6fd144b00f4a1acb506615', '5a6fcc57b00f4a1acb5065f2'], // MTC Influencer
                            '584fbe1dadbdd05d535cddae': ['58b5ced403e7e079550d2b22', '5a6f9aaab00f4a1acb5065a8', '5a6f9ba6b00f4a1acb5065a9', '5a6f9bbeb00f4a1acb5065aa'], // TWL Influencer
                            '597b8a331b54472074c2dd1a': ['597b8ddb1b54472074c2dd1d', '597b8db41b54472074c2dd1c', '5aa6e0b727d727022ed0a99a', '5ab8a296ecc1ec1ffbd077b6'] // Sugary Six Pack Influencer
                        }
                        var sort_arr = plan_sort_arr[trainer_id] || false;
                        if(sort_arr) {
                            trainerplans.sort(function(a,b){
                                var ia = sort_arr.indexOf(a._id.toString());
                                var ib = sort_arr.indexOf(b._id.toString());
                                return ia > ib? 1 : (ia<ib ? -1 : 0);
                            });
                        }

                        let valueToRemove = [ "5ca0fb768d72e50df3ca695d", "5ca3ac6c8d72e50df3ca6cae", "5c9a6c338d72e50df3ca5e81", "5defeef19791377ef51315b8", "5df28a909791377ef51317f9", "5d13b0dd56dc011a1b637f9a", "5d0aa57c56dc011a1b6375f6", "5c1018757a55ad64617c8fbd", "5d8b04af5991d165395c95d3", "5dea9dd69791377ef513132c", "5e7150f09791377ef513a67a", "5e61307a7b9836327b766d93", "5f627971e0d39d5fd64199ae" ] // Remove Spring Challenge Plan for Lais/ZBody/SamiB

                        const filteredItems = trainerplans.filter(function(item) {
                          return valueToRemove.indexOf(item._id.toString()) == -1;
                        })

                        /****** End Code Here*****/

                        sendSuccess(res, {
                            plans: filteredItems
                        });
                    }
                });
            }
        });
    });

    /**
        @@ This API gets All Plans,
        @@ Whether Main Plan, Side Plan, Challenge Plan
        @@ This is implemented for Frontend Admin
    **/

    router.get('/all_plans', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = { type: { $ne: 'custom'} };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }

                model_tp.find(conds).sort({sort_order: 1}).toArray(function(err, trainerplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plans: " + err);
                    } else {
                        sendSuccess(res, {
                            plans: trainerplans
                        });
                    }
                });
            }
        });
    });

    /**
        @@ Get All Plans API
        @@ Specified for MTC
    **/

    router.get('/plan_new', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                conds.$or = [{"type":"main"}, {"type":"side"}, {"type":"challenge", "challenge": true}];

                model_tp.find(conds).toArray(function(err, trainerplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plans: " + err);
                    } else {
                        /**
                            @@ Extra Check for MTC Trainer
                            @@ To populate Main Plan at first Index
                        **/
                        var plan_sort_arr = {
                            '5822bfb2b86828570dd90899': ['5822bfd0b86828570dd9089a', '5a6fd144b00f4a1acb506615', '5a6fcc57b00f4a1acb5065f2'], // MTC Influencer
                            '584fbe1dadbdd05d535cddae': ['58b5ced403e7e079550d2b22', '5a6f9aaab00f4a1acb5065a8', '5a6f9ba6b00f4a1acb5065a9', '5a6f9bbeb00f4a1acb5065aa'], // TWL Influencer
                            '597b8a331b54472074c2dd1a': ['597b8ddb1b54472074c2dd1d', '597b8db41b54472074c2dd1c', '5aa6e0b727d727022ed0a99a', '5ab8a296ecc1ec1ffbd077b6'] // Sugary Six Pack Influencer
                        }
                        var sort_arr = plan_sort_arr[trainer_id] || false;
                        if(sort_arr) {
                            trainerplans.sort(function(a,b){
                                var ia = sort_arr.indexOf(a._id.toString());
                                var ib = sort_arr.indexOf(b._id.toString());
                                return ia > ib? 1 : (ia<ib ? -1 : 0);
                            });
                        }

                        let valueToHave = [ "5ca0fb768d72e50df3ca695d", "5db617cf09be946ad14421a7" ]

                        const filteredItems = trainerplans.filter(function(item) {
                            return valueToHave.indexOf(item._id.toString()) != -1;
                        })

                        /****** End Code Here*****/

                        sendSuccess(res, {
                            plans: filteredItems
                        });
                    }
                });
            }
        });
    })

    /**
        @@ Get Tiana's Specified Plan
        @@ Specified for Tiana
    **/

    router.get('/new_plan_tianna', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                conds._id = new Model.ObjectID("5d8b04af5991d165395c95d3")

                model_tp.find(conds).toArray(function(err, trainerplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plans: " + err);
                    } else {
                        sendSuccess(res, {
                            plans: trainerplans
                        })
                    }
                })
            }
        })
    })


    /**
        @@ Get Lais's Specified Plan
        @@ Specified for Lais DeLeon
    **/

    router.get('/plan_v2', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                conds.$or = [{"type":"main"}, {"type":"side"}, {"type":"challenge", "challenge": true}];

                model_tp.find(conds).sort({sort_order: 1}).toArray(function(err, trainerplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plans: " + err);
                    } else {

                        // Remove Challenge Plan from v2 API
                        // They will be visible only on v3 API
                        let valueToRemove = [ "5ca0fb768d72e50df3ca695d", "5ca3ac6c8d72e50df3ca6cae", "5c9a6c338d72e50df3ca5e81", "5d8b04af5991d165395c95d3", "5d13b0dd56dc011a1b637f9a", "5d0aa57c56dc011a1b6375f6", "5c1018757a55ad64617c8fbd", "5e67ecf99791377ef51394e4", "5e67ed0b9791377ef51394e5", "5e67ef469791377ef5139765", "5f2c6cb3219d1b8575eb52f7", "5f627971e0d39d5fd64199ae" ] // Remove Spring Challenge Plan for Lais

                        const filteredItems = trainerplans.filter(function(item) {
                          return valueToRemove.indexOf(item._id.toString()) == -1;
                        })

                        /****** End Code Here*****/

                        sendSuccess(res, {
                            plans: filteredItems
                        })
                    }
                })
            }
        })
    })

    /**
        @@ Get Lais Challenge Plan API
        @@ Specified for Lais DeLeon
    **/

    router.get('/plan_v3', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                conds.$or = [{"type":"main"}, {"type":"side"}, {"type":"challenge"}];

                model_tp.find(conds).sort({sort_order: 1}).toArray(function(err, trainerplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plans: " + err);
                    } else {

                        let valueToRemove = [ "5ca0fb768d72e50df3ca695d", "5c1806917a55ad64617c983e", "5d66d792263ba05984c8817a", "5ce5ab90eece9c5058eb7e16", "5d8b04af5991d165395c95d3", "5d13b0dd56dc011a1b637f9a", "5d0aa57c56dc011a1b6375f6", "5c1018757a55ad64617c8fbd", "5ef6375702f794747f5fadc7", "5ef638e002f794747f5fadc8" ] // Remove Spring Challenge Plan for Lais, Slimmer plan for Sami B

                        const filteredItems = trainerplans.filter(function(item) {
                          return valueToRemove.indexOf(item._id.toString()) == -1;
                        })

                        /****** End Code Here*****/

                        sendSuccess(res, {
                            plans: filteredItems
                        })
                    }
                })
            }
        })
    })

    /**
        @@ Get Sami B Challenge Plan API
        @@ Specified for Lais DeLeon
    **/

    router.get('/plan_v4', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                conds.$or = [{"type":"main"}, {"type":"side"}, {"type":"challenge"}];

                model_tp.find(conds).sort({sort_order: 1}).toArray(function(err, trainerplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plans: " + err);
                    } else {

                        let valueToRemove = [ "5ca0fb768d72e50df3ca695d", "5c1806917a55ad64617c983e", "5d66d792263ba05984c8817a", "5ce5ab90eece9c5058eb7e16", "5d8b04af5991d165395c95d3", "5d13b0dd56dc011a1b637f9a", "5d0aa57c56dc011a1b6375f6", "5c1018757a55ad64617c8fbd" ] // Remove Spring Challenge Plan for Lais

                        const filteredItems = trainerplans.filter(function(item) {
                          return valueToRemove.indexOf(item._id.toString()) == -1;
                        })

                        /****** End Code Here*****/

                        sendSuccess(res, {
                            plans: filteredItems
                        })
                    }
                })
            }
        })
    })

    router.get('/plan_status/:id', function(req, res, next) {
        var id = req.params.id;
        sendSuccess(res, {
            changed: true
        });
    });

    router.post('/plan_status/:id', function(req, res, next) {
        var id = req.params.id;
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var plan_date = req.body.plan_date || "";
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_tp.find(conds).limit(1).next(function(err, trainerplan) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plan: " + err);
                    } else if (!trainerplan) {
                        sendError(res, "Not found");
                    } else {
                        var modified_date = trainerplan.modified_date || ((new Date()).getTime() + "");

                        sendSuccess(res, {
                            changed: plan_date < modified_date
                        });
                    }
                });
            }
        });

    });

    router.get('/plan/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var app_version = req.query.app_version || 0;
        var webapp = req.query.webapp || 0;
        var without_workout = req.query.without_workout || false;

        if(trainer_id == '597b8a331b54472074c2dd1a' && id =='597b8db41b54472074c2dd1c' && !without_workout){

            let jsonData = require(path.dirname(require.main.filename) + path.sep + 'Sugarysixpack-597b8db41b54472074c2dd1c.json');
            sendSuccess(res, {
                plan: jsonData
            });
        }else{

            if(trainer_id == '5a8c7aff14d55f7ad445a6f3' && id =='5a8c7bf414d55f7ad445a6fc' && !without_workout){
                let jsonData = require(path.dirname(require.main.filename) + path.sep + 'Boothcamp-5a8c7bf414d55f7ad445a6fc.json');
                return sendSuccess(res, {
                    plan: jsonData
                });
            }

            var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
                if (err) {
                    sendError(res, "Failed to access db: " + err);
                } else {
                    var conds = {
                        _id: new Model.ObjectID(id)
                    };
                    if (trainer_id) {
                        conds.trainer_id = trainer_id;
                        var conditions = { trainer_id :trainer_id }
                    }
                    model_tp.find(conditions).count(function(err, total_plan) {
                        if(err){
                             sendError(res, "Failed to access db: " + err);
                         }else{
                            model_tp.find(conds).limit(1).next(function(err, trainerplan) {
                                if (err) {
                                    sendError(res, "Failed to retrieve trainer plan: " + err);
                                } else if (!trainerplan) {
                                    sendError(res, "Not found");
                                } else {

                                    var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
                                        if (err) {
                                            sendError(res, "Failed to access db: " + err);
                                        } else {
                                            var conds2 = {
                                                plan_id: trainerplan._id + ""
                                            };
                                            if (!webapp) {
                                                if (trainerplan.trainer_id == "57c5310521bbac1d01aa75db") {

                                                    // Fit n Thick  App special check!!
                                                    if (app_version < 17) {
                                                        conds2.week = {
                                                            "$in": ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
                                                        };
                                                        trainerplan.weeks = "9";
                                                    } else if (app_version <= 19) {
                                                        conds2.week = {
                                                            "$in": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
                                                        };
                                                        trainerplan.weeks = "10";
                                                    } else if (app_version == 31) {
                                                        conds2.week = {
                                                            "$in": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
                                                        };
                                                        trainerplan.weeks = "12";
                                                    } else {
                                                        // show all...

                                                    }
                                                }

                                            }


                                            model_workoutday.find(conds2).sort({
                                                week: 1,
                                                weekday: 1,
                                                sort_order: 1
                                            }).toArray(function(err, workoutdays) {
                                                if (err) {
                                                    sendError(res, "Failed to retrieve workout days: " + err);
                                                } else {
                                                    if (workoutdays.length) {
                                                        if (without_workout) {
                                                            trainerplan.workoutdays = workoutdays;
                                                            return sendSuccess(res, {
                                                                plan: trainerplan,
                                                                total_plan:total_plan
                                                            });
                                                        }
                                                        var model_workout = Model.load('workout', {}, function(err, model_workout) {
                                                            if (err) {
                                                                return sendError(res, "DB connection failed: " + err);
                                                            }
                                                            var loadedWorkouts = 0;
                                                            for (var wdi = 0; wdi < workoutdays.length; wdi++) {
                                                                (function(wdi) {
                                                                    model_workout.loadWorkout(workoutdays[wdi].workout, function(err, w) {
                                                                        if (err) {
                                                                            return sendError(res, "Failed to retrieve workout details: " + err);
                                                                        }
                                                                        workoutdays[wdi].workout = w;
                                                                        if (++loadedWorkouts >= workoutdays.length) {
                                                                            trainerplan.workoutdays = workoutdays;
                                                                            sendSuccess(res, {
                                                                                plan: trainerplan
                                                                            });
                                                                        }
                                                                    });
                                                                })(wdi);
                                                            }
                                                        });
                                                    } else {
                                                        trainerplan.workoutdays = workoutdays;
                                                        sendSuccess(res, {
                                                            plan: trainerplan
                                                        });
                                                    }

                                                }
                                            });
                                        }
                                    });

                                }
                            })
                        }
                    })
                }
            })
        }
    });

    router.post('/plan/:id', function(req, res, next) {
        var exer = req.body.plan;

        var removeImages = req.body.removeImages || [];
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this plan");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        var model_plan = Model.load('trainerplan', {}, function(err, model_plan) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_plan.find(conds).limit(1).next(function(err, trainerplan) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plan: " + err);
                    } else if (!trainerplan) {
                        sendError(res, "Not found");
                    } else {
                        if (!replace) {
                            _.defaults(exer, trainerplan);
                            delete exer._id;
                        }
                        if (model_plan.verify(exer)) {

                            exer.modified_date = (new Date()).getTime() + "";

                            if(exer.type=="challenge") {
                                exer.paid = (exer.paid=='true' || exer.paid==true)?true:false; // Toggle for Challenge Plan if purchasable
                                exer.challenge = (exer.challenge=='true' || exer.challenge==true)?true:false; // Toggle for Challenge Plan if Active
                                var challenge_access_users = exer.challenge_access_users.trim().split(",");
                                challenge_access_users = challenge_access_users.filter(function(entry) { return entry.trim(); });
                                exer.challenge_access_users = challenge_access_users;
                            }

                            if (req.files && req.files.length) {

                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/trainerplans/");

                                Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                    if (!succeeded.length) {
                                        sendError(res, "Failed to upload all file(s)");
                                    } else {
                                        if (typeof fields.image != 'undefined') {
                                            var files = [exer.image];
                                            Model.removeFiles(files, baseFolder);
                                            exer.image = fields.image.shift();
                                        }

                                        if (typeof fields.secondary_image != 'undefined') {
                                            var anotherfiles = [exer.secondary_image];
                                            Model.removeFiles(anotherfiles, baseFolder);
                                            exer.secondary_image = fields.secondary_image.shift();
                                        }

                                        if (typeof fields.images != 'undefined') {
                                            exer.images = fields.images;
                                        } else {
                                            exer.images = [];
                                        }

                                        if (typeof fields.video != 'undefined') {
                                            exer.video = fields.video.shift();
                                        }

                                        if (typeof fields.videos != 'undefined') {
                                            exer.videos = fields.videos;
                                        } else {
                                            exer.videos = [];
                                        }


                                        if (replace) {

                                            if (!exer.image && exer.images && exer.images.length) {
                                                exer.image = exer.images.shift();
                                            }

                                            if (!exer.video && exer.videos && exer.videos.length) {
                                                exer.video = exer.videos.shift();
                                            }

                                            model_plan.replaceOne(conds, exer, {}, function(err, plan) {
                                                if (err) {
                                                    sendError(res, "Failed to replace record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: plan,
                                                        plan: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        } else {

                                            if (removeImages.length) {
                                                for (var i = 0; i < removeImages.length; i++) {
                                                    trainerplan.images.splice(trainerplan.images.indexOf(removeImages[i]), 1);
                                                }
                                            }

                                            if (trainerplan.images.length) {
                                                exer.images = exer.images || [];
                                                for (var i = 0; i < trainerplan.images.length; i++) {
                                                    exer.images.push(trainerplan.images[i]);
                                                }
                                            }

                                            model_plan.updateOne(conds, {
                                                $set: exer
                                            }, {}, function(err, plan) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: plan,
                                                        plan: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });

                            } else {
                                if (replace) {
                                    model_plan.replaceOne(conds, exer, {}, function(err, plan) {
                                        if (err) {
                                            sendError(res, "Failed to replace record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: plan,
                                                plan: exer
                                            });
                                        }
                                    });
                                } else {
                                    if (removeImages.length) {
                                        for (var i = 0; i < removeImages.length; i++) {
                                            trainerplan.images.splice(trainerplan.images.indexOf(removeImages[i]), 1);
                                        }
                                    }

                                    exer.images = trainerplan.images;

                                    model_plan.updateOne(conds, {
                                        $set: exer
                                    }, {}, function(err, plan) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: plan,
                                                plan: exer
                                            });
                                        }
                                    });
                                }
                            }
                        } else {
                            sendError(res, "Invalid data for plan");
                        }
                    }
                });
            }
        });
    });

    router.put('/plan', function(req, res, next) {
        var exer = req.body.plan;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this plan")
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id
        }


        var model_plan = Model.load('trainerplan', {}, function(err, model_plan) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_plan.verify(exer)) {

                    exer.modified_date = (new Date()).getTime() + "";

                    if(exer.type=="challenge") {
                        exer.paid = (exer.paid=='true' || exer.paid==true)?true:false; // Toggle for Challenge Plan if purchasable
                        exer.challenge = (exer.challenge=='true' || exer.challenge==true)?true:false; // Toggle for Challenge Plan if Active
                    }
                    /** if choose image in  Media Library **/
                    if (typeof req.body.plan_media != 'undefined') {
                        exer.image = req.body.plan_media;
                    }

                    if (req.files && req.files.length) {

                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/trainerplans/");

                        Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                            if (!succeeded.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {
                                if (typeof fields.image != 'undefined') {
                                    exer.image = fields.image.shift();
                                }

                                if (typeof fields.secondary_image != 'undefined') {
                                    exer.secondary_image = fields.secondary_image.shift();
                                }

                                if (typeof fields.images != 'undefined') {
                                    exer.images = fields.images;
                                } else {
                                    exer.images = [];
                                }

                                model_plan.insertOne(exer, {}, function(err, trainerplan) {
                                    if (err) {
                                        sendError(res, "Failed to insert record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: trainerplan,
                                            plan: exer,
                                            failed_files: failed
                                        });
                                    }
                                });
                            }
                        });
                    } else {

                        // if(typeof exer.image =='undefined'){
                        exer.image = exer.image || "";

                        exer.secondary_image = exer.secondary_image || "";
                        // }
                        // if(typeof exer.images =='undefined'){
                        exer.images = exer.images || [];
                        // }

                        model_plan.insertOne(exer, {}, function(err, trainerplan) {
                            if (err) {
                                sendError(res, "Failed to insert record: " + err);
                            } else {
                                sendSuccess(res, {
                                    res: trainerplan,
                                    plan: exer
                                });
                            }
                        });
                    }
                } else {
                    sendError(res, "Invalid data for plan");
                }
            }
        });
    });

    router.delete('/plan/:id', function(req, res, next) {
        var id = req.params.id;
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_tp = Model.load('trainerplan', {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }

                model_tp.find(conds).limit(1).next(function(err, plan) {
                    if (err) {
                        sendError(res, err);
                    } else if (!plan) {
                        sendError(res, "Plan doesn't exists in our records");
                    } else {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/trainerplans/");
                        var files = [plan.image].concat(plan.images, [plan.video], plan.videos);

                        Model.removeFiles(files, baseFolder);

                        model_tp.deleteOne(conds, {}, function(err, plan) {
                            if (err) {
                                sendError(res, err);
                            } else {
                                var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {
                                        var model_workout = Model.load('workout', {}, function(err, model_workout) {
                                            if (err) {
                                                sendError(res, "Failed to access db: " + err);
                                            } else {

                                                var conditions = { "plan_id" : id }

                                                if (trainer_id) {
                                                    conditions.trainer_id = trainer_id;
                                                }
                                                model_workoutday.find(conditions).forEach(function(wday){
                                                    model_workoutday.remove({_id: wday._id});
                                                    model_workout.find({_id: new Model.ObjectID(wday.workout+"")}).forEach(function(main){
                                                        model_workout.remove({_id: main._id});
                                                        if(main.children && main.children.length){
                                                            main.children.forEach(function(cir){
                                                                model_workout.find({_id: new Model.ObjectID(cir)}).forEach(function(circuit){
                                                                    model_workout.remove({_id: circuit._id});
                                                                    if(circuit.children && circuit.children.length){
                                                                        circuit.children.forEach(function(wout){
                                                                            model_workout.find({_id: new Model.ObjectID(wout)}).forEach(function(workout){
                                                                                model_workout.remove({_id: workout._id});
                                                                                if(workout.alternates && workout.alternates.length){
                                                                                    workout.alternates .forEach(function(alt){
                                                                                        model_workout.find({_id: new Model.ObjectID(alt)}).forEach(function(alternate){
                                                                                            model_workout.remove({_id: alternate._id});
                                                                                        })
                                                                                    })
                                                                                }
                                                                            })
                                                                        })
                                                                    }
                                                                })
                                                            })
                                                        }
                                                    })
                                                })
                                                sendSuccess(res, {
                                                    res: plan
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
    });

    /**
    	@@Nutrition Plans
    	@@input-nutrition-plan form data
    	@@Description- Nutrition Plans are displayed in backend
    **/
    router.put('/nutrition_plan', function(req, res, next) {
        var exer = req.body.plan;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this nutrition plan");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }


        var model_plan = Model.load('nutritionplan', {}, function(err, model_plan) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_plan.verify(exer)) {


                    if (req.files && req.files.length) {

                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/nutritionplans/");

                        Model.uploadFiles(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, succeeded_images, succeeded_videos) {
                            if (!succeeded_images.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {
                                exer.image = succeeded_images.shift();
                                exer.images = succeeded_images;

                                if (succeeded_videos.length) {
                                    exer.video = succeeded_videos.shift();
                                    exer.videos = succeeded_videos;
                                } else {
                                    exer.video = "";
                                }

                                model_plan.insertOne(exer, {}, function(err, nutritionplan) {
                                    if (err) {
                                        sendError(res, "Failed to insert record: " + err);
                                    } else {
                                        var model_week = Model.load('nutritionweek', {}, function(err, model_week) {
                                            if (err) {
                                                sendError(res, "Failed to access db: " + err);
                                            } else {
                                                var model_day = Model.load('nutritionday', {}, function(err, model_day) {
                                                    if (err) {
                                                        sendError(res, "Failed to access db: " + err);
                                                    } else {
                                                        var week_data_array = [];
                                                        var added_week_length = parseInt(exer.weeks) || 0;
                                                        if (added_week_length) {
                                                            for (var i = 1; i <= added_week_length; i++) {

                                                                (function(index) {

                                                                    var day_data_array = [];
                                                                    for (var w = 1; w <= 7; w++) {
                                                                        var day_data = {};
                                                                        day_data.shopping = "";
                                                                        day_data.trainer_id = exer.trainer_id;
                                                                        day_data.meal_prep = "";
                                                                        day_data.meal1 = "";
                                                                        day_data.meal2 = "";
                                                                        day_data.meal3 = "";
                                                                        day_data.meal4 = "";
                                                                        day_data.meal5 = "";
                                                                        day_data_array.push(day_data);
                                                                    }

                                                                    model_day.insertMany(day_data_array, {}, function(err, nutritionday) {

                                                                        if (err) {
                                                                            sendError(res, "Failed to insert record: " + err);
                                                                        } else {

                                                                            var week_data = {};
                                                                            week_data.grocery = "";
                                                                            week_data.meal_prep = "";
                                                                            week_data.macros = "";
                                                                            week_data.nutritionplan_id = exer._id.toString();
                                                                            week_data.trainer_id = exer.trainer_id;
                                                                            week_data.week_number = index;
                                                                            week_data.day1 = nutritionday.insertedIds[0].toString();
                                                                            week_data.day2 = nutritionday.insertedIds[1].toString();
                                                                            week_data.day3 = nutritionday.insertedIds[2].toString();
                                                                            week_data.day4 = nutritionday.insertedIds[3].toString();
                                                                            week_data.day5 = nutritionday.insertedIds[4].toString();
                                                                            week_data.day6 = nutritionday.insertedIds[5].toString();
                                                                            week_data.day7 = nutritionday.insertedIds[6].toString();
                                                                            week_data_array.push(week_data);
                                                                            if (week_data_array.length == exer.weeks) {
                                                                                model_week.insertMany(week_data_array, {}, function(err, nutritionweek) {

                                                                                    if (err) {
                                                                                        sendError(res, "Failed to insert record: " + err);
                                                                                    } else {
                                                                                        sendSuccess(res, {
                                                                                            res: nutritionplan,
                                                                                            plan: exer,
                                                                                            nutritionweek: week_data_array,
                                                                                            nutritionday: day_data_array
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }

                                                                        }
                                                                    });

                                                                })(i);

                                                            }
                                                        } else{
                                                            sendSuccess(res, {
                                                                res: nutritionplan,
                                                                plan: exer
                                                            });
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        var week_length = parseInt(exer.weeks) || 0;
                        model_plan.insertOne(exer, {}, function(err, nutritionplan) {
                            if (err) {
                                sendError(res, "Failed to insert record: " + err);
                            } else {
                                var model_week = Model.load('nutritionweek', {}, function(err, model_week) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {
                                        var model_day = Model.load('nutritionday', {}, function(err, model_day) {
                                            if (err) {
                                                sendError(res, "Failed to access db: " + err);
                                            } else {
                                                if (week_length) {
                                                    var week_data_array = [];
                                                    for (var i = 1; i <= week_length; i++) {

                                                        (function(index) {

                                                            var day_data_array = [];
                                                            for (var w = 1; w <= 7; w++) {
                                                                var day_data = {};
                                                                day_data.shopping = "";
                                                                day_data.image = "";
                                                                day_data.trainer_id = exer.trainer_id;
                                                                day_data.meal_prep = "";
                                                                day_data.meal1 = "";
                                                                day_data.meal2 = "";
                                                                day_data.meal3 = "";
                                                                day_data.meal4 = "";
                                                                day_data.meal5 = "";
                                                                day_data_array.push(day_data);
                                                            }

                                                            model_day.insertMany(day_data_array, function(err, nutritionday) {

                                                                if (err) {
                                                                    sendError(res, "Failed to insert record: " + err);
                                                                } else {

                                                                    var week_data = {};
                                                                    week_data.grocery = "";
                                                                    week_data.meal_prep = "";
                                                                    week_data.macros = "";
                                                                    week_data.nutritionplan_id = exer._id.toString();
                                                                    week_data.trainer_id = exer.trainer_id;
                                                                    week_data.week_number = index;
                                                                    week_data.day1 = nutritionday.insertedIds[0].toString();
                                                                    week_data.day2 = nutritionday.insertedIds[1].toString();
                                                                    week_data.day3 = nutritionday.insertedIds[2].toString();
                                                                    week_data.day4 = nutritionday.insertedIds[3].toString();
                                                                    week_data.day5 = nutritionday.insertedIds[4].toString();
                                                                    week_data.day6 = nutritionday.insertedIds[5].toString();
                                                                    week_data.day7 = nutritionday.insertedIds[6].toString();
                                                                    week_data_array.push(week_data);

                                                                    if (week_data_array.length == week_length) {
                                                                        model_week.insertMany(week_data_array, function(err, nutritionweek) {
                                                                            if (err) {
                                                                                sendError(res, "Failed to insert record: " + err);
                                                                            } else {
                                                                                sendSuccess(res, {
                                                                                    res: nutritionplan,
                                                                                    plan: exer,
                                                                                    nutritionweek: week_data_array,
                                                                                    nutritionday: day_data_array
                                                                                });
                                                                            }
                                                                        });
                                                                    }

                                                                }
                                                            });

                                                        })(i);

                                                    }
                                                } else {
                                                    sendSuccess(res, {
                                                        res: nutritionplan,
                                                        plan: exer
                                                    });
                                                }
                                            }

                                        });
                                    }
                                });

                            }
                        });
                    }
                } else {
                    sendError(res, "Invalid data for nutrition plan");
                }
            }
        });
    });

    router.get('/nutrition_plan', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_np = Model.load("nutritionplan", {}, function(err, model_np) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_np.find(conds).toArray(function(err, nutritionplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve nutrition plans: " + err);
                    } else {
                        var model_nw = Model.load("nutritionweek", {}, function(err, model_nw) {
                            if (err) {
                                sendError(res, "Failed to access db: " + err);
                            } else {
                                var loadedNutritionPlans = 0
                                if (nutritionplans.length) {
                                    nutritionplans.forEach(function(nplan, ind) {
                                        var nutritionplan_id = nplan._id;

                                        var conds2 = {
                                            nutritionplan_id: nutritionplan_id.toString()
                                        };
                                        if (trainer_id) {
                                            conds2.trainer_id = trainer_id;
                                        }
                                        model_nw.find(conds2).toArray(function(err, nutritionplan_weeks) {
                                            if (err) {
                                                sendError(res, err);
                                            } else if (nutritionplan_weeks.length < 0) {
                                                sendSuccess(res, {
                                                    plans: nutritionplans
                                                });
                                            } else {
                                                nutritionplan_weeks.sort(function(a, b) {
                                                    var ia = a.week_number;
                                                    var ib = b.week_number;
                                                    return ia > ib ? 1 : (ia < ib ? -1 : 0);
                                                });
                                                nutritionplans[ind].nutritionplan_weeks = nutritionplan_weeks;

                                            }

                                            if (++loadedNutritionPlans == nutritionplans.length ) {
                                                var plan_sort_arr = {
                                                    '5a9d7d110a4ae17da220a43e': [ '5c8b3a5c3d5bfa1e3da65fa6','5af9bd3dc7f1037bd289092d' ], // Fit By valen English
                                                    '5bf8d5dc315e77a1621cd67d': [ '5c1b6379693797d7d03bc5aa' ], // Fit By valen Spanish
                                                    '5c096ec07a55ad64617c8c8c': [ '5ccb85f2d17f9f5d70b9b13a', '5cc0bcb2e6829f72a8c6baf4', '5ccb8612d17f9f5d70b9b17b', '5ccb511bd17f9f5d70b9afcb', '5cd07386d17f9f5d70b9b701', '5cc9e64cd17f9f5d70b9adfb', '5d2cb7db0fd1947616ec180a', '5d2f6c780fd1947616ec21fb', '5d2f4d270fd1947616ec1bf0', '5d2f6fcb0fd1947616ec2221', '5d2f51720fd1947616ec21cf', '5d1a55bb56dc011a1b6386e2', '5d1d0a5056dc011a1b638b63', '5d1a555156dc011a1b6386c1', '5d23877d56dc011a1b638ce3', '5d1bb4fe56dc011a1b63896a', '5d1bb52156dc011a1b638983', '5d124b4a56dc011a1b637d50', '5d1519ef56dc011a1b638337', '5d12896656dc011a1b637e73', '5d166e0e56dc011a1b6385fe', '5d13de4756dc011a1b63808b', '5d166dee56dc011a1b6385fd', '5d4323c5af41d27b98b3cef0', '5d3b3e29af41d27b98b3c49f', '5d43603baf41d27b98b3cfcb', '5d42217eaf41d27b98b3cc62', '5d44520372636d2f8425e12d', '5d43071eaf41d27b98b3cdf7', '5d47427d72636d2f8425e377', '5d447a5472636d2f8425e1fd', '5d47457272636d2f8425e390', '5d44853772636d2f8425e26c', '5d4745e872636d2f8425e3a9', '5d45d7a372636d2f8425e2f3']
                                                }
                                                var sort_arr = plan_sort_arr[trainer_id] || false;
                                                if(sort_arr) {

                                                    nutritionplans = nutritionplans.filter(function(item) {
                                                      return sort_arr.indexOf(item._id.toString()) >= 0;
                                                    })

                                                    nutritionplans.sort(function(a,b){
                                                        var ia = sort_arr.indexOf(a._id.toString());
                                                        var ib = sort_arr.indexOf(b._id.toString());
                                                        return ia > ib? 1 : (ia<ib ? -1 : 0);
                                                    });
                                                }
                                                sendSuccess(res, {
                                                    plans: nutritionplans
                                                });
                                            }

                                        });

                                    });
                                } else {
                                    sendSuccess(res, {
                                        plans: nutritionplans
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    });

    // Fit By valen Spanish
    // Nutrition Plan

    router.get('/nutrition_plan_v2', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_np = Model.load("nutritionplan", {}, function(err, model_np) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_np.find(conds).toArray(function(err, nutritionplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve nutrition plans: " + err);
                    } else {
                        var model_nw = Model.load("nutritionweek", {}, function(err, model_nw) {
                            if (err) {
                                sendError(res, "Failed to access db: " + err);
                            } else {
                                var loadedNutritionPlans = 0
                                if (nutritionplans.length) {
                                    nutritionplans.forEach(function(nplan, ind) {
                                        var nutritionplan_id = nplan._id;

                                        var conds2 = {
                                            nutritionplan_id: nutritionplan_id.toString()
                                        };
                                        if (trainer_id) {
                                            conds2.trainer_id = trainer_id;
                                        }
                                        model_nw.find(conds2).toArray(function(err, nutritionplan_weeks) {
                                            if (err) {
                                                sendError(res, err);
                                            } else if (nutritionplan_weeks.length < 0) {
                                                sendSuccess(res, {
                                                    plans: nutritionplans
                                                });
                                            } else {
                                                nutritionplan_weeks.sort(function(a, b) {
                                                    var ia = a.week_number;
                                                    var ib = b.week_number;
                                                    return ia > ib ? 1 : (ia < ib ? -1 : 0);
                                                });
                                                nutritionplans[ind].nutritionplan_weeks = nutritionplan_weeks;

                                            }

                                            if (++loadedNutritionPlans == nutritionplans.length ) {
                                                var plan_sort_arr = {
                                                    '5a9d7d110a4ae17da220a43e': [ '5d820d4d91cce080770ebc65','5d4c34b80f5def29f9d4e66c' ], // Fit By valen English
                                                    '5bf8d5dc315e77a1621cd67d': [ '5d5a41222ac33bd433f736e2', '5d5a41222ac33bd433f736e3' ], // Fit By valen Spanish
                                                }
                                                var sort_arr = plan_sort_arr[trainer_id] || false;
                                                if(sort_arr) {

                                                    nutritionplans = nutritionplans.filter(function(item) {
                                                      return sort_arr.indexOf(item._id.toString()) >= 0;
                                                    })

                                                    nutritionplans.sort(function(a,b){
                                                        var ia = sort_arr.indexOf(a._id.toString());
                                                        var ib = sort_arr.indexOf(b._id.toString());
                                                        return ia > ib? 1 : (ia<ib ? -1 : 0);
                                                    });
                                                }
                                                sendSuccess(res, {
                                                    plans: nutritionplans
                                                });
                                            }

                                        });

                                    });
                                } else {
                                    sendSuccess(res, {
                                        plans: nutritionplans
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    });

    router.get('/nutrition_plan_status/:id', function(req, res, next) {
        sendSuccess(res, {
            changed: true
        });
    });

    router.get('/nutrition_plan/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var app_version = req.query.app_version || 0;
        var webapp = req.query.webapp || 0;

        var without_workout = req.query.without_workout || false;

        var model_tp = Model.load("nutritionplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_tp.find(conds).limit(1).next(function(err, nutritionplan) {
                    if (err) {
                        sendError(res, "Failed to retrieve nutrition plan: " + err);
                    } else if (!nutritionplan) {
                        sendError(res, "Not found");
                    } else {

                        var model_nw = Model.load("nutritionweek", {}, function(err, model_nw) {
                            if (err) {
                                sendError(res, "Failed to access db: " + err);
                            } else {
                                var nutritionplan_id = nutritionplan._id;

                                var conds2 = {
                                    nutritionplan_id: nutritionplan_id.toString()
                                };
                                if (trainer_id) {
                                    conds2.trainer_id = trainer_id;
                                }
                                model_nw.find(conds2).toArray(function(err, nutritionplan_weeks) {
                                    if (err) {
                                        sendError(res, err);
                                    } else if (nutritionplan_weeks.length < 0) {
                                        sendSuccess(res, {
                                            plan: nutritionplan
                                        });
                                    } else {
                                        nutritionplan_weeks.sort(function(a, b) {
                                            var ia = a.week_number;
                                            var ib = b.week_number;
                                            return ia > ib ? 1 : (ia < ib ? -1 : 0);
                                        });
                                        nutritionplan.nutritionplan_weeks = nutritionplan_weeks;
                                        sendSuccess(res, {
                                            plan: nutritionplan
                                        });

                                    }

                                });
                            }
                        });

                    }
                });
            }
        });
    });

    router.post('/nutrition_plan/:id', function(req, res, next) {
        var exer = req.body.plan;

        var removeImages = req.body.removeImages || [];
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this nutrition plan");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        var model_plan = Model.load('nutritionplan', {}, function(err, model_plan) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_plan.find(conds).limit(1).next(function(err, nutritionplan) {
                    if (err) {
                        sendError(res, "Failed to retrieve nutrition plan: " + err);
                    } else if (!nutritionplan) {
                        sendError(res, "Not found");
                    } else {
                        if (!replace) {
                            _.defaults(exer, nutritionplan);
                            delete exer._id;
                        }

                        if (model_plan.verify(exer)) {

                            if (req.files && req.files.length) {

                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/nutritionplans/");

                                Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.label).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                    if (!succeeded.length) {
                                        sendError(res, "Failed to upload all file(s)");
                                    } else {
                                        if (typeof fields.image != 'undefined') {
                                            exer.image = fields.image.shift();
                                        }

                                        if (typeof fields.images != 'undefined') {
                                            exer.images = fields.images;
                                        } else {
                                            exer.images = [];
                                        }

                                        if (typeof fields.video != 'undefined') {
                                            exer.video = fields.video.shift();
                                        }

                                        if (typeof fields.videos != 'undefined') {
                                            exer.videos = fields.videos;
                                        } else {
                                            exer.videos = [];
                                        }


                                        if (replace) {

                                            if (!exer.image && exer.images && exer.images.length) {
                                                exer.image = exer.images.shift();
                                            }

                                            if (!exer.video && exer.videos && exer.videos.length) {
                                                exer.video = exer.videos.shift();
                                            }

                                            model_plan.replaceOne(conds, exer, {}, function(err, plan) {
                                                if (err) {
                                                    sendError(res, "Failed to replace record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: plan,
                                                        plan: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        } else {

                                            if (removeImages.length) {
                                                for (var i = 0; i < removeImages.length; i++) {
                                                    nutritionplan.images.splice(nutritionplan.images.indexOf(removeImages[i]), 1);
                                                }
                                            }

                                            if (nutritionplan.images.length) {
                                                exer.images = exer.images || [];
                                                for (var i = 0; i < nutritionplan.images.length; i++) {
                                                    exer.images.push(nutritionplan.images[i]);
                                                }
                                            }

                                            model_plan.updateOne(conds, {
                                                $set: exer
                                            }, {}, function(err, plan) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: plan,
                                                        plan: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });

                            } else {
                                if (replace) {
                                    model_plan.replaceOne(conds, exer, {}, function(err, plan) {
                                        if (err) {
                                            sendError(res, "Failed to replace record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: plan,
                                                plan: exer
                                            });
                                        }
                                    });
                                } else {
                                    if (removeImages.length) {
                                        for (var i = 0; i < removeImages.length; i++) {
                                            nutritionplan.images.splice(nutritionplan.images.indexOf(removeImages[i]), 1);
                                        }
                                    }
                                    var _saveWeek = function(callback) {
                                        var model_week = Model.load('nutritionweek', {}, function(err, model_week) {
                                            if (err) {
                                                callback("Failed to insert record: " + err);
                                            } else {
                                                var model_day = Model.load('nutritionday', {}, function(err, model_day) {
                                                    if (err) {
                                                        callback("Failed to insert record: " + err);
                                                    } else {
                                                        var week_length = parseInt(exer.weeks - nutritionplan.weeks);
                                                        var week_data_array = [];
                                                        for (var i = 1; i <= week_length; i++) {

                                                            (function(index) {

                                                                var day_data_array = [];
                                                                var week_number = index + parseInt(nutritionplan.weeks);
                                                                for (var w = 1; w <= 7; w++) {
                                                                    var day_data = {};
                                                                    day_data.shopping = "";
                                                                    day_data.image = "";
                                                                    day_data.trainer_id = exer.trainer_id;
                                                                    day_data.meal_prep = "";
                                                                    day_data.meal1 = "";
                                                                    day_data.meal2 = "";
                                                                    day_data.meal3 = "";
                                                                    day_data.meal4 = "";
                                                                    day_data.meal5 = "";
                                                                    day_data_array.push(day_data);
                                                                }

                                                                model_day.insertMany(day_data_array, {}, function(err, nutritionday) {

                                                                    if (err) {
                                                                        callback("Failed to insert record: " + err);
                                                                    } else {

                                                                        var week_data = {};
                                                                        week_data.grocery = "";
                                                                        week_data.meal_prep = "";
                                                                        week_data.macros = "";
                                                                        week_data.nutritionplan_id = id;
                                                                        week_data.trainer_id = exer.trainer_id;
                                                                        week_data.week_number = week_number;
                                                                        week_data.day1 = nutritionday.insertedIds[0].toString();
                                                                        week_data.day2 = nutritionday.insertedIds[1].toString();
                                                                        week_data.day3 = nutritionday.insertedIds[2].toString();
                                                                        week_data.day4 = nutritionday.insertedIds[3].toString();
                                                                        week_data.day5 = nutritionday.insertedIds[4].toString();
                                                                        week_data.day6 = nutritionday.insertedIds[5].toString();
                                                                        week_data.day7 = nutritionday.insertedIds[6].toString();
                                                                        week_data_array.push(week_data);

                                                                        if (week_data_array.length == week_length) {
                                                                            model_week.insertMany(week_data_array, {}, function(err, nutritionweek) {

                                                                                if (err) {
                                                                                    callback("Failed to insert record: " + err);
                                                                                } else {
                                                                                    callback(undefined, week_data_array);
                                                                                }
                                                                            });
                                                                        }

                                                                    }
                                                                });

                                                            })(i);

                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    };

                                    model_plan.updateOne(conds, {
                                        $set: exer
                                    }, {}, function(err, plan) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {

                                            if(!nutritionplan.weeks) nutritionplan.weeks = 0;

                                            if (parseInt(exer.weeks) > parseInt(nutritionplan.weeks)) {
                                                _saveWeek(function(err, results) {
                                                    if (err) {
                                                        sendError(res, "Failed to update record: " + err);
                                                    } else {
                                                        sendSuccess(res, {
                                                            res: plan,
                                                            plan: exer,
                                                            week: results
                                                        });
                                                    }
                                                });
                                            } else {
                                                sendSuccess(res, {
                                                    res: plan,
                                                    plan: exer
                                                });
                                            }

                                        }
                                    });
                                }
                            }
                        } else {
                            sendError(res, "Invalid data for nutrition plan");
                        }
                    }
                });
            }
        });
    });

    router.post('/nutrition_plan_week/:id', function(req, res, next) {
        var exer = req.body.week;
        var id = req.params.id;
        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this nutrition plan");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        var model_week = Model.load('nutritionweek', {}, function(err, model_week) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_week.find(conds).limit(1).next(function(err, week) {
                    if (err) {
                        sendError(res, "Failed to retrieve nutrition plan week: " + err);
                    } else if (!week) {
                        sendError(res, "Not found");
                    } else {

                        if (model_week.verify(exer)) {

                            model_week.updateOne(conds, {
                                $set: exer
                            }, {}, function(err, week_updated) {
                                if (err) {
                                    sendError(res, "Failed to update record: " + err);
                                } else {
                                    sendSuccess(res, {
                                        res: week_updated,
                                        week: exer
                                    });
                                }
                            });
                        } else {
                            sendError(res, "Invalid data for nutrition plan week");
                        }
                    }
                });
            }
        });
    });

    router.delete('/nutrition_plan/:id', function(req, res, next) {
        var id = req.params.id;
        var model_np = Model.load('nutritionplan', {}, function(err, model_np) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                model_np.find(conds).limit(1).next(function(err, plan) {
                    if (err) {
                        sendError(res, err);
                    } else if (!plan) {
                        sendError(res, "Not found");
                    } else {
                        // var baseFolder = path.join(path.dirname(require.main.filename), "uploads/nutritionplans/");
                        // var files = [plan.image].concat(plan.images, [plan.video], plan.videos);

                        // Model.removeFiles(files, baseFolder);

                        model_np.deleteOne(conds, {}, function(err, plan) {
                            if (err) {
                                sendError(res, err);
                            } else {
                                var model_nw = Model.load('nutritionweek', {}, function(err, model_nw) {
                                    var conds2 = {
                                        nutritionplan_id: id
                                    };
                                    if (req.trainer_id) {
                                        conds2.trainer_id = req.trainer_id;
                                    }
                                    model_nw.remove(conds2, {}, function(err, week) {
                                        if (err) {
                                            sendError(res, err);
                                        } else {
                                            sendSuccess(res, {
                                                res: week
                                            });
                                        }
                                    })

                                });
                            }
                        });
                    }
                });
            }
        });
    });

    router.get('/nutrition_plan_week/:id', function(req, res, next) {
        var id = req.params.id;
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var load_meal = req.query.load_meal;
        var model_nw = Model.load("nutritionweek", {}, function(err, model_nw) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_nw.find(conds).limit(1).next(function(err, nutritionweek) {
                    if (err) {
                        sendError(res, "Failed to retrieve nutrition week: " + err);
                    } else {
                        var model_nd = Model.load('nutritionday', {}, function(err, model_nd) {
                            if (err) {
                                sendError(res, "Failed to retrieve nutrition day: " + err);
                            } else {
                                var day_data = [];
                                for (var i = 1; i <= 7; i++) {
                                    (function(index) {
                                        var day_id = nutritionweek['day' + index];
                                        var day_conds = {
                                            _id: new Model.ObjectID(day_id)
                                        };
                                        if (req.trainer_id) {
                                            day_conds.trainer_id = req.trainer_id;
                                        }
                                        model_nd.find(day_conds).limit(1).next(function(err, day) {
                                            if (err) {
                                                console.error(err);
                                            } else if (!day) {
                                                console.warn("Day not found.");
                                            } else {
                                                if (typeof load_meal != 'undefined') {
                                                    var model_meal = Model.load('nutritionmeal', {}, function(err, model_meal) {
                                                        if (err) {
                                                            return sendError(res, "DB connection failed: " + err);
                                                        }
                                                        var succeeded_meal = [];
                                                        var failed_meal = [];
                                                        for (var nmi = 1; nmi <= 5; nmi++) {
                                                            (function(ind) {
                                                                if (day['meal' + ind]) {
                                                                    model_meal.loadMeal(day['meal' + ind], function(err, nm) {
                                                                        if (err) {
                                                                            failed_meal.push('meal' + ind);
                                                                        } else {
                                                                            succeeded_meal.push(nm);
                                                                            day['meal' + ind] = nm;
                                                                        }
                                                                        if ((succeeded_meal.length + failed_meal.length) >= 5) {
                                                                            day_data.push(day);
                                                                            if (day_data.length >= 7) {
                                                                                nutritionweek.nutrition_days = day_data;
                                                                                sendSuccess(res, {
                                                                                    week: nutritionweek
                                                                                });
                                                                            }
                                                                        }
                                                                    });
                                                                } else {
                                                                    failed_meal.push('meal' + ind);
                                                                    day['meal' + ind] = "";
                                                                    if ((succeeded_meal.length + failed_meal.length) >= 5) {
                                                                        day_data.push(day);
                                                                        if (day_data.length >= 7) {
                                                                            nutritionweek.nutrition_days = day_data;
                                                                            sendSuccess(res, {
                                                                                week: nutritionweek
                                                                            });
                                                                        }
                                                                    }
                                                                }

                                                            })(nmi);
                                                        }
                                                    });
                                                } else {
                                                    day_data.push(day);
                                                    if (day_data.length >= 7) {
                                                        nutritionweek.nutrition_days = day_data;
                                                        sendSuccess(res, {
                                                            week: nutritionweek
                                                        });
                                                    }
                                                }


                                            }


                                        });

                                    })(i);
                                }
                            }

                        });

                    }
                });
            }
        });
    });

    router.delete('/nutrition_plan_week/:id', function(req, res, next) {
        var id = req.params.id;
        var model_nw = Model.load('nutritionweek', {}, function(err, model_nw) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                model_nw.find(conds).limit(1).next(function(err, week) {
                    if (err) {
                        sendError(res, err);
                    } else if (!week) {
                        sendError(res, "Not found");
                    } else {

                        model_nw.deleteOne(conds, {}, function(err, deleted_week) {
                            if (err) {
                                sendError(res, err);
                            } else {

                                var model_nd = Model.load('nutritionday', {}, function(err, model_nd) {
                                    if (err) {
                                        console.error(err);
                                    } else {
                                        for (var i = 1; i <= 7; i++) {
                                            (function(index) {
                                                var day_id = week['day' + index];
                                                var day_conds = {
                                                    _id: new Model.ObjectID(day_id)
                                                };
                                                if (req.trainer_id) {
                                                    day_conds.trainer_id = req.trainer_id;
                                                }
                                                model_nd.find(day_conds).limit(1).next(function(err, day) {
                                                    if (err) {
                                                        console.error(err);
                                                    } else if (!day) {
                                                        console.warn("Day not found");
                                                    } else {
                                                        model_nd.remove(day_conds, {}, function(err, deleted_day) {
                                                            var model_nm = Model.load('nutritionmeal', {}, function(err, model_nm) {
                                                                if (err) {
                                                                    console.error(err);
                                                                } else {
                                                                    for (var m = 1; m <= 5; m++) {

                                                                        (function(ind) {
                                                                            var meal_id = day['meal' + ind];
                                                                            if (meal_id) {
                                                                                var meal_conds = {
                                                                                    _id: new Model.ObjectID(meal_id)
                                                                                };
                                                                                if (req.trainer_id) {
                                                                                    meal_conds.trainer_id = req.trainer_id;
                                                                                }
                                                                                model_nm.find(meal_conds).limit(1).next(function(err, meal) {
                                                                                    if (err) {
                                                                                        console.warn(err);
                                                                                    } else if (!meal) {
                                                                                        console.warn("Not meal found");
                                                                                    } else {
                                                                                        model_nm.remove(meal_conds, {}, function(err, deleted_meal) {
                                                                                            // var baseFolder = path.join(path.dirname(require.main.filename), "uploads/nutritionplans/");
                                                                                            // var files = [meal.image].concat(meal.images, [meal.video]);
                                                                                            // Model.removeFiles(files, baseFolder);
                                                                                        });
                                                                                    }
                                                                                });
                                                                            } else {
                                                                                console.warn("no meal for: day" + index + "-meal" + ind);
                                                                            }
                                                                        })(m);
                                                                    }
                                                                }
                                                            });

                                                        });
                                                    }
                                                });
                                            })(i);
                                        }
                                    }

                                });
                                var model_plan = Model.load('nutritionplan', {}, function(err, model_plan) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {
                                        var conds2 = {
                                            _id: new Model.ObjectID(week.nutritionplan_id)
                                        };
                                        if (req.trainer_id) {
                                            conds2.trainer_id = req.trainer_id;
                                        }
                                        model_plan.find(conds2).limit(1).next(function(err, nutritionplan) {
                                            if (err) {
                                                sendError(res, "Failed to retrieve nutrition plan: " + err);
                                            } else if (!nutritionplan) {
                                                sendError(res, "Not found");
                                            } else {
                                                var exer = {};
                                                exer.weeks = parseInt(nutritionplan.weeks) - 1;
                                                model_plan.updateOne(conds2, {
                                                    $set: exer
                                                }, {}, function(err, plan) {
                                                    if (err) {
                                                        sendError(res, "Failed to update record: " + err);
                                                    } else {
                                                        sendSuccess(res, {
                                                            res: deleted_week,
                                                            nutritionplan: plan
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
            }
        });
    });

    router.get('/nutrition_plan_day/:id', function(req, res, next) {
        var id = req.params.id;
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_nd = Model.load("nutritionday", {}, function(err, model_nd) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_nd.find(conds).limit(1).next(function(err, nutritionday) {
                    if (err) {
                        sendError(res, "Failed to retrieve nutrition day: " + err);
                    } else {
                        var model_meal = Model.load('nutritionmeal', {}, function(err, model_meal) {
                            if (err) {
                                return sendError(res, "DB connection failed: " + err);
                            }
                            var loadedMeals = 1;
                            var succeeded_meal = [];
                            var failed_meal = [];
                            for (var nmi = 1; nmi <= 5; nmi++) {
                                (function(nmi) {
                                    if (nutritionday['meal' + nmi]) {
                                        model_meal.loadMeal(nutritionday['meal' + nmi], function(err, nm) {
                                            if (err) {
                                                failed_meal.push('meal' + nmi);
                                            } else {
                                                succeeded_meal.push(nm);
                                                nutritionday['meal' + nmi] = nm;
                                            }
                                            if ((succeeded_meal.length + failed_meal.length) >= 5) {
                                                sendSuccess(res, {
                                                    day: nutritionday
                                                });
                                            }
                                        });
                                    } else {
                                        failed_meal.push('meal' + nmi);
                                        nutritionday['meal' + nmi] = "";
                                        if ((succeeded_meal.length + failed_meal.length) >= 5) {
                                            sendSuccess(res, {
                                                day: nutritionday
                                            });
                                        }
                                    }

                                })(nmi);
                            }
                        });
                    }
                });
            }
        });
    });

    router.post('/nutrition_plan_day/:id', function(req, res, next) {
        var id = req.params.id;
        var day = req.body.day;
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_nd = Model.load("nutritionday", {}, function(err, model_nd) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_nd.find(conds).limit(1).next(function(err, nutritionday) {
                    if (err) {
                        sendError(res, "Failed to retrieve nutrition day: " + err);
                    } else if (!nutritionday) {
                        sendError(res, "Not found");
                    } else {

                        if (model_nd.verify(day)) {

                            if (req.files && req.files.length) {

                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/nutritionplans/");

                                Model.uploadFiles(req, baseFolder, req.trainer_id + "_" + (id).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, succeeded_images, succeeded_videos) {
                                    if (!succeeded_images.length) {
                                        sendError(res, "Failed to upload all file(s)");
                                    } else {
                                        day.image = succeeded_images.shift();
                                        model_nd.updateOne(conds, {
                                            $set: day
                                        }, {}, function(err, day_updated) {
                                            if (err) {
                                                sendError(res, "Failed to update record: " + err);
                                            } else {
                                                sendSuccess(res, {
                                                    res: day_updated,
                                                    day: day
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                model_nd.updateOne(conds, {
                                    $set: day
                                }, {}, function(err, day_updated) {
                                    if (err) {
                                        sendError(res, "Failed to update record: " + err);
                                    } else {
                                        sendSuccess(res, {
                                            res: day_updated,
                                            day: day
                                        });
                                    }
                                });
                            }
                        } else {
                            sendError(res, "Invalid data for nutrition plan day");
                        }
                    }
                });
            }
        });
    });

    router.put('/nutrition_plan_meal', function(req, res, next) {
        var exer = req.body.meal;
        var day_id = req.body.day_id || 0;
        var meal_number = req.body.meal_number || "";
        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to save this meal");
        }

        if (!meal_number || !day_id) {
            return sendError(res, "Either missing day or meal number");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }


        var model_meal = Model.load('nutritionmeal', {}, function(err, model_meal) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_meal.verify(exer)) {


                    if (req.files && req.files.length) {

                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/nutritionplans/");

                        Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.name).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                            if (!succeeded.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {

                                if (typeof fields.image != 'undefined') {
                                    exer.image = fields.image.shift();
                                }

                                if (typeof fields.images != 'undefined') {
                                    exer.images = fields.images;
                                } else {
                                    exer.images = [];
                                }

                                if (typeof fields.video != 'undefined') {
                                    var v = fields.video.shift();
                                    exer.video = v.path;
                                    exer.video_mime = v.mime;
                                    exer.video_thumbnail = v.video_thumbnail;
                                    exer.local_video = true;
                                    exer.uncompressed = true;
                                }

                                if (typeof fields.videos != 'undefined') {
                                    exer.videos = fields.videos;
                                    exer.local_video = true;
                                    exer.uncompressed = true;
                                } else {
                                    exer.videos = [];
                                }
                                if (typeof fields.video_thumbnail != "undefined") {
                                    exer.video_thumbnail = fields.video_thumbnail.shift();
                                }

                                model_meal.insertOne(exer, {}, function(err, nutritionmeal) {
                                    if (err) {
                                        sendError(res, "Failed to insert record: " + err);
                                    } else {
                                        var model_nd = Model.load("nutritionday", {}, function(err, model_nd) {
                                            if (err) {
                                                sendError(res, "Failed to access db: " + err);
                                            } else {
                                                var day_meal = {};
                                                day_meal[meal_number] = exer._id.toString();
                                                var conds = {
                                                    _id: new Model.ObjectID(day_id)
                                                };
                                                model_nd.updateOne(conds, {
                                                    $set: day_meal
                                                }, {}, function(err, day_updated) {
                                                    if (err) {
                                                        sendError(res, "Failed to update record: " + err);
                                                    } else {
                                                        sendSuccess(res, {
                                                            res: nutritionmeal,
                                                            meal: exer,
                                                            day_updated: day_updated,
                                                            failed_files: failed
                                                        });
                                                    }
                                                });

                                            }

                                        });
                                    }
                                });
                            }
                        }, function(err, fieldname, eventtype, newvalue) {
                            var id = exer._id;
                            //pd 1
                            if (!err) {
                                if (fieldname == "video") {
                                    var o = {};

                                    if (eventtype == "converted") {
                                        o.uncompressed = false;
                                    }
                                    if (eventtype == "uploaded") {
                                        o.local_video = false;
                                        o.video_mime = '';
                                    }
                                    if (newvalue) {
                                        o.video = newvalue;
                                    }


                                    model_meal.updateOne({
                                        _id: id
                                    }, {
                                        "$set": o
                                    }, {}, function(err, workout) {
                                        // TODO: error handling
                                        console.error("update2", err, workout);
                                    });

                                }
                            }

                        }, exer.trainer_id);
                    } else {
                        if (exer.selected_image) exer.image = exer.selected_image;
                        if (exer.selected_video) exer.video = exer.selected_video;
                        exer.image = exer.image || "";

                        exer.video = exer.video || "";

                        model_meal.insertOne(exer, {}, function(err, nutritionmeal) {
                            if (err) {
                                sendError(res, "Failed to insert record: " + err);
                            } else {
                                var model_nd = Model.load("nutritionday", {}, function(err, model_nd) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {
                                        var day_meal = {};
                                        day_meal[meal_number] = exer._id.toString();
                                        var conds = {
                                            _id: new Model.ObjectID(day_id)
                                        };
                                        model_nd.updateOne(conds, {
                                            $set: day_meal
                                        }, {}, function(err, day_updated) {
                                            if (err) {
                                                sendError(res, "Failed to update record: " + err);
                                            } else {
                                                sendSuccess(res, {
                                                    res: nutritionmeal,
                                                    meal: exer,
                                                    day_updated: day_updated
                                                });
                                            }
                                        });

                                    }

                                });
                            }
                        });
                    }
                } else {
                    sendError(res, "Invalid data for nutrition meal");
                }
            }
        });
    });

    router.get('/nutrition_plan_meal/:id', function(req, res, next) {
        var id = req.params.id;
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_nm = Model.load("nutritionmeal", {}, function(err, model_nm) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_nm.find(conds).limit(1).next(function(err, nutritionmeal) {
                    if (err) {
                        sendError(res, "Failed to retrieve nutrition day: " + err);
                    } else {
                        sendSuccess(res, {
                            meal: nutritionmeal
                        });
                    }
                });
            }
        });
    });

    /*  popup search meal pd   */

    router.get('/nutrition_plan_meal', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var keyword_filter = req.query.name || '';
        var conds = {};
        var model_nm = Model.load("nutritionmeal", {}, function(err, model_nm) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                if (keyword_filter) {
                    conds.name = new RegExp('.*' + keyword_filter + '.*', "i");

                }
            }
            model_nm.find(conds).toArray(function(err, nutritionmeal) {
                if (err) {
                    sendError(res, "Failed to retrieve nutrition day: " + err);
                } else {
                    sendSuccess(res, {
                        meal: nutritionmeal
                    });
                }
            });
        })
    });

    /*  end */


    router.post('/nutrition_plan_meal/:id', function(req, res, next) {
        var exer = req.body.meal;
        var removeImages = req.body.removeImages || [];
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this plan");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        var model_meal = Model.load('nutritionmeal', {}, function(err, model_meal) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_meal.find(conds).limit(1).next(function(err, nutritionmeal) {
                    if (err) {
                        sendError(res, "Failed to retrieve nutrition meal: " + err);
                    } else if (!nutritionmeal) {
                        sendError(res, "Not found");
                    } else {
                        if (!replace) {
                            _.defaults(exer, nutritionmeal);
                            delete exer._id;
                        }
                        if (model_meal.verify(exer)) {

                            if (req.files && req.files.length) {

                                var baseFolder = path.join(path.dirname(require.main.filename), "uploads/nutritionplans/");

                                Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + (exer.photo ? exer.photo : exer.name).replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                    if (!succeeded.length) {
                                        sendError(res, "Failed to upload all file(s)");
                                    } else {
                                        if (typeof fields.image != 'undefined') {
                                            exer.image = fields.image.shift();
                                        }

                                        if (typeof fields.images != 'undefined') {
                                            exer.images = fields.images;
                                        } else {
                                            exer.images = [];
                                        }

                                        if (typeof fields.video != 'undefined') {
                                            var v = fields.video.shift();
                                            exer.video = v.path;
                                            exer.video_mime = v.mime;
                                            exer.video_thumbnail = v.video_thumbnail;

                                            exer.local_video = true;
                                            exer.uncompressed = true;
                                        }

                                        if (typeof fields.videos != 'undefined') {
                                            exer.videos = fields.videos;
                                            exer.local_video = true;
                                            exer.uncompressed = true;
                                        } else {
                                            exer.videos = [];
                                        }
                                        if (typeof fields.video_thumbnail != "undefined") {
                                            exer.video_thumbnail = fields.video_thumbnail.shift();
                                        }
                                        if (replace) {

                                            if (!exer.image && exer.images && exer.images.length) {
                                                exer.image = exer.images.shift();
                                            }

                                            if (!exer.video && exer.videos && exer.videos.length) {
                                                exer.video = exer.videos.shift();
                                            }

                                            model_meal.replaceOne(conds, exer, {}, function(err, meal) {
                                                if (err) {
                                                    sendError(res, "Failed to replace record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: meal,
                                                        meal: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        } else {

                                            if (removeImages.length) {
                                                for (var i = 0; i < removeImages.length; i++) {
                                                    nutritionmeal.images.splice(nutritionmeal.images.indexOf(removeImages[i]), 1);
                                                }
                                            }

                                            if (nutritionmeal.images && nutritionmeal.images.length) {
                                                exer.images = exer.images || [];
                                                for (var i = 0; i < nutritionmeal.images.length; i++) {
                                                    exer.images.push(nutritionmeal.images[i]);
                                                }
                                            }

                                            model_meal.updateOne(conds, {
                                                $set: exer
                                            }, {}, function(err, meal) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: meal,
                                                        meal: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });
                                        }
                                    }
                                }, function(err, fieldname, eventtype, newvalue) {
                                    // use conds obj
                                    //pd 3
                                    if (!err) {
                                        if (fieldname == "video") {
                                            var o = {};

                                            if (eventtype == "converted") {
                                                o.uncompressed = false;
                                            }
                                            if (eventtype == "uploaded") {
                                                o.local_video = false;
                                                o.video_mime = '';
                                            }
                                            if (newvalue) {
                                                o.video = newvalue;
                                            }


                                            model_meal.updateOne(conds, {
                                                "$set": o
                                            }, {}, function(err, workout) {
                                                // TODO: error handling
                                                console.error   ("update2", err, workout);
                                            });

                                        }
                                    }


                                }, exer.trainer_id);

                            } else {
                                if (replace) {
                                    model_meal.replaceOne(conds, exer, {}, function(err, meal) {
                                        if (err) {
                                            sendError(res, "Failed to replace record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: meal,
                                                meal: exer
                                            });
                                        }
                                    });
                                } else {
                                    if (removeImages.length) {
                                        for (var i = 0; i < removeImages.length; i++) {
                                            nutritionmeal.images.splice(nutritionmeal.images.indexOf(removeImages[i]), 1);
                                        }
                                    }

                                    model_meal.updateOne(conds, {
                                        $set: exer
                                    }, {}, function(err, meal) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: meal,
                                                meal: exer
                                            });
                                        }
                                    });
                                }
                            }
                        } else {
                            sendError(res, "Invalid data for meal");
                        }
                    }
                });
            }
        });
    });

    router.delete('/nutrition_plan_meal/:id/:meal_number/:day_id', function(req, res, next) {
        var id = req.params.id;
        var meal_number = req.params.meal_number || "";
        var day_id = req.params.day_id || "";
        var model_nm = Model.load('nutritionmeal', {}, function(err, model_nm) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                model_nm.find(conds).limit(1).next(function(err, meal) {
                    if (err) {
                        sendError(res, err);
                    } else if (!meal) {
                        sendError(res, "Not found");
                    } else {
                        // var baseFolder = path.join(path.dirname(require.main.filename), "uploads/nutritionplans/");
                        // var files = [meal.image].concat(meal.images, [meal.video], meal.videos);

                        // Model.removeFiles(files, baseFolder);

                        model_nm.deleteOne(conds, {}, function(err, deleted_meal) {
                            if (err) {
                                sendError(res, err);
                            } else {
                                var model_nd = Model.load("nutritionday", {}, function(err, model_nd) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {
                                        var day_meal = {};
                                        day_meal[meal_number] = "";
                                        var conds2 = {
                                            _id: new Model.ObjectID(day_id)
                                        };
                                        model_nd.updateOne(conds2, {
                                            $set: day_meal
                                        }, {}, function(err, day_updated) {
                                            if (err) {
                                                sendError(res, "Failed to update record: " + err);
                                            } else {
                                                sendSuccess(res, {
                                                    res: deleted_meal,
                                                    day_updated: day_updated
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
    });

    var toDate = function(time) {
        if (time) return (new Date(parseInt(time))).toJSON().substring(0, 10);
    };
    var todaytimestamp = function() {
        return new Date().getTime();
    };
    var thirtyDaysBefore = function() {
        return new Date().getTime() - (24 * 30 * 60 * 60 * 1000);
    };
    var sevendaysafterjoined = function(time) {
        return time + (24 * 7 * 60 * 60 * 1000);
    };
    var joiningMonth = function(time) {
        return (new Date(time)).getMonth();
    };
    var currMonth = function() {
        return (new Date()).getMonth();
    };
    var toDateAndTime = function(time) {
        if (typeof time != "undefined" && time) return (new Date(parseInt(time))).toJSON().substring(0, 19).replace(/T/, ' ');
        else return "" ;
    };

    /**
    	@@script to Export All Users
    	@@ Get All Users
    	@@
	**/

    router.get('/export_users', function(req, res, next) {

        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;

        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conditions = {
                    // excluding wegile emails...
                    //email: /^((?!wegile).)*$/i
                };

                if (trainer_id) {
                    conditions.trainer_id = trainer_id;
                }

                var fields = {
                    "profile.name": 1,
                    "profile.image": 1,
                    "email": 1,
                    "facebook_id": 1,
                    "google_id": 1,
                    "nutrition_subscription": 1,
                    "profile.fitness_level": 1,
                    "profile.paid": 1,
                    "profile.subscribed_plan": 1,
                    "profile.device_type": 1,
                    "profile.startPlan_date": 1,
                    "profile.endPlan_date": 1,
                    "profile.expire_date": 1,
                    "joined_on": 1,
                    "profile.last_seen": 1,
                    "profile.join_now": 1,
                    "profile.subscription_plan_type": 1,
                    "subscription": 1,
                    "os_type": 1
                }
                var deviceTypeObj = {
                    "iOS": "Apple",
                    "Android": "Google",
                    "web": "Web"
                }
                model_user.find(conditions, fields).sort({
                    'joined_on': -1
                }).toArray(function(err, all_users) {
                    if (err) {
                        sendError(res, "Failed to retrieve users: " + err);
                    } else {

                        var csv = require("fast-csv");
                        var fs = require("fs");
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/users/");
                        var imgDest = "Users-" + trainer_id + ".csv";
                        var filename = path.join(baseFolder, imgDest)
                        var ws = fs.createWriteStream(filename);
                        csv
                            .write(all_users, {
                                headers: true,
                                transform: function(row) {
                                    row.facebook_id = (typeof row.facebook_id != "undefined") ? row.facebook_id : "";
                                    row.google_id = (typeof row.google_id != "undefined") ? row.google_id : "";
                                    row.joined_on = toDate(row.joined_on);
                                    row.last_seen = (typeof row.profile.last_seen != "undefined") ? toDateAndTime(row.profile.last_seen) : "N/A";
                                    row.join_now = (typeof row.profile.join_now != "undefined") ? "Yes" : "No";
                                    row.device_type = (typeof row.profile.device_type != "undefined") ? row.profile.device_type : "N/A";
                                    row.nutrition_subscription = (typeof row.nutrition_subscription != "undefined" && row.nutrition_subscription) ? "Yes" : "No";
                                    if (typeof row.profile.startPlan_date != "undefined" || typeof row.profile.expire_date != "undefined" || typeof row.profile.subscription_plan_type != "undefined") {
                                        if (row.profile.paid) {
                                            if (row.profile.paid == "2" && row.profile.device_type!="web") {
                                                row.startPlan_date = row.profile.startPlan_date;
                                                row.endPlan_date = row.profile.expire_date?row.profile.expire_date.substring(0, 10):"";
                                                //row.plan_period = "Paid (From: " + row.profile.startPlan_date + " To: " + row.profile.expire_date.substring(0, 10) + ")";
                                            } else if (row.profile.paid == "1") {
                                                row.startPlan_date = row.profile.startPlan_date;
                                                row.endPlan_date = row.profile.expire_date.substring(0, 10);
                                                //row.plan_period = "Free Trial";
                                            } else {
                                                //row.plan_period = "Inactive";
                                            }
                                        } else if (row.profile.device_type == "Android") {
                                            if (row.profile.subscribed_plan == "1") {
                                                row.startPlan_date = row.profile.startPlan_date;
                                                row.endPlan_date = row.profile.endPlan_date || "";
                                                //row.plan_period = "Paid (From: " + row.profile.startPlan_date + " To: " + row.profile.endPlan_date + ")";
                                            } else if (row.profile.subscribed_plan == "0") {
                                                row.startPlan_date = row.profile.startPlan_date;
                                                row.endPlan_date = row.profile.endPlan_date || "";
                                                //row.plan_period = "Free Trial";
                                            }
                                        } else {
                                            // for web users and old APP users those doesn't have new keys
                                            if (row.profile.subscribed_plan == "1") {
                                                row.startPlan_date = row.profile.startPlan_date;
                                                row.endPlan_date = row.profile.endPlan_date;
                                                //row.plan_period = "Paid (From: " + row.profile.startPlan_date + " To: " + row.profile.endPlan_date + ")";
                                            } else if (row.profile.subscribed_plan == "0") {
                                                row.startPlan_date = row.profile.startPlan_date || "";
                                                row.endPlan_date = row.profile.endPlan_date || "";
                                                //row.plan_period = "Free Trial";
                                            }
                                        }
                                    } else {
                                        row.plan_period = "Inactive";
                                    }
                                    if (row.profile.device_type == "web" && row.subscription) {

                                        var toCheckMonth = /1month/i.test(row.subscription.interval_count + row.subscription.interval);
                                        var toCheckQuarter = /3month/i.test(row.subscription.interval_count+row.subscription.interval);
                                        var toCheckYear1 = /1year/i.test(row.subscription.interval_count+row.subscription.interval);
                                        var toCheckYear2 = /annual/i.test(row.subscription.interval_count+row.subscription.interval);
                                        if(toCheckMonth) { row.subscription_type = "Monthly" || "None"; }
                                        else if(toCheckQuarter) { row.subscription_type = "Quarterly" || "None"; }
                                        else if(toCheckYear1 || toCheckYear2 ) { row.subscription_type = "Annually" || "None"; }
                                        else{ row.subscription_type = row.subscription.interval_count + row.subscription.interval || "None"; }

                                    }else{

                                        row.subscription_type = row.profile.subscription_plan_type || "None";
                                    }

                                    return {
                                        "Photo": row.profile.image,
                                        "Name": row.profile.name,
                                        "Email": row.email,
                                        "Facebook Id": row.facebook_id,
                                        "Google Id": row.google_id,
                                        "Device Type": row.os_type || "N/A",
                                        "Subscription Type": deviceTypeObj[row.device_type],
                                        "Subscription Plan" : row.subscription_type,
                                        "Paid Start Date": row.startPlan_date || "None",
                                        "Paid End Date": row.endPlan_date || "None",
                                        "Nutrition Subscription": row.nutrition_subscription,
                                        "Fitness Level" : row.profile.fitness_level || "",
                                        "Joined": row.join_now,
                                        "Joined On": row.joined_on,
                                        "Last Login": row.last_seen
                                    };
                                }
                            })
                            .pipe(ws);
                        ws.on('close', function() {
                            //res.setHeader('Content-Type', 'text/csv');
                            //res.setHeader("Content-Disposition", 'attachment; filename='+imgDest);
                            sendSuccess(res, {
                                filename: imgDest
                            });

                        });
                    }
                });

            }
        });

    });


    /**
    	@@script to fetch All Users
    	@@ Get Fifty records each time
    	@@
	**/

    router.get('/get_users', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;

        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var $total = 0;
                var $recordsFiltered = 0;
                var conditions = {
                    // excluding Custom Training Users
                    course_type: { $ne: "custom" }
                    // excluding wegile emails...
                    //email: /^((?!wegile).)*$/i
                };
                if (req.query.search.value) {
                    conditions.$or = [{
                        "profile.name": new RegExp('^' + req.query.search.value + '.*$', "i")
                    }, {
                        email: new RegExp('^' + req.query.search.value + '.*$', "i")
                    }, {
                        facebook_id: new RegExp('^' + req.query.search.value + '.*$', "i")
                    }, {
                        google_id: new RegExp('^' + req.query.search.value + '.*$', "i")
                    }];
                }
                if (req.query.columns[5].search.value) // here filter processing
                {
                    if (conditions.$or) {
                        conditions.$and = [{
                            $or: conditions.$or
                        }];
                    }
                    //FREE TRIAL
                    if (req.query.columns[5].search.value == '1') {
                        if (conditions.$and) {
                            conditions.$and.push({
                                $or: [{
                                    "profile.paid": "1"
                                }, {
                                    "profile.paid": {
                                        $not: {
                                            "$exists": true
                                        }
                                    },
                                    "profile.subscribed_plan": "0"
                                }]
                            }, {
                                $or: [{
                                    "profile.startPlan_date": {
                                        "$exists": true
                                    }
                                }, {
                                    "profile.expire_date": {
                                        "$exists": true
                                    }
                                }, {
                                    "profile.subscription_plan_type": {
                                        "$exists": true
                                    }
                                }]
                            });
                        } else {
                            conditions.$or = [{
                                "profile.paid": "1",
                                $or: [{
                                    "profile.startPlan_date": {
                                        "$exists": true
                                    }
                                }, {
                                    "profile.expire_date": {
                                        "$exists": true
                                    }
                                }]
                            }, {
                                "profile.paid": {
                                    $not: {
                                        "$exists": true
                                    }
                                },
                                "profile.subscribed_plan": "0",
                                $or: [{
                                    "profile.subscription_plan_type": {
                                        "$exists": true
                                    }
                                }, {
                                    "profile.startPlan_date": {
                                        "$exists": true
                                    }
                                }]
                            }];
                        }

                    }
                    //PAID USERS
                    if (req.query.columns[5].search.value == '2') {
                        if (conditions.$and) {
                            conditions.$and.push({
                                $or: [{
                                    "profile.paid": "2"
                                }, {
                                    "profile.paid": {
                                        $not: {
                                            "$exists": true
                                        }
                                    },
                                    "profile.subscribed_plan": "1"
                                }]
                            }, {
                                $or: [{
                                    "profile.startPlan_date": {
                                        "$exists": true
                                    }
                                }, {
                                    "profile.expire_date": {
                                        "$exists": true
                                    }
                                }, {
                                    "profile.subscription_plan_type": {
                                        "$exists": true
                                    }
                                }]
                            });
                        } else {
                            conditions.$or = [{
                                "profile.paid": "2",
                                $or: [{
                                    "profile.startPlan_date": {
                                        "$exists": true
                                    }
                                }, {
                                    "profile.expire_date": {
                                        "$exists": true
                                    }
                                }]
                            }, {
                                "profile.paid": {
                                    $not: {
                                        "$exists": true
                                    }
                                },
                                "profile.subscribed_plan": "1",
                                $or: [{
                                    "profile.startPlan_date": {
                                        "$exists": true
                                    }
                                }, {
                                    "profile.subscription_plan_type": {
                                        "$exists": true
                                    }
                                }]
                            }];
                        }

                    }
                    //INACTIVE USERS
                    if (req.query.columns[5].search.value == '0') {
                        if (conditions.$and) {
                            conditions.$and.push({
                                $or: [{
                                    "profile.startPlan_date": {
                                        $not: {
                                            "$exists": true
                                        }
                                    },
                                    "profile.expire_date": {
                                        $not: {
                                            "$exists": true
                                        }
                                    },
                                    "profile.subscription_plan_type": {
                                        $not: {
                                            "$exists": true
                                        }
                                    }
                                }, {
                                    "profile.paid": "0"
                                }]
                            });
                        } else {
                            conditions.$or = [{
                                "profile.startPlan_date": {
                                    $not: {
                                        "$exists": true
                                    }
                                },
                                "profile.expire_date": {
                                    $not: {
                                        "$exists": true
                                    }
                                },
                                "profile.subscription_plan_type": {
                                    $not: {
                                        "$exists": true
                                    }
                                }
                            }, {
                                "profile.paid": "0"
                            }];
                        }

                    }

                }

                if (trainer_id) {
                    conditions.trainer_id = trainer_id;
                }

                var fields = {
                    "profile.name": 1,
                    "profile.image": 1,
                    "email": 1,
                    "facebook_id": 1,
                    "google_id": 1,
                    "progress_pics": 1,
                    "nutrition_subscription": 1,
                    "profile.paid": 1,
                    "profile.subscribed_plan": 1,
                    "profile.device_type": 1,
                    "profile.expire_date": 1,
                    "profile.startPlan_date": 1,
                    "profile.endPlan_date": 1,
                    "profile.subscription_plan_type": 1,
                    "profile.savedData": 1,
                    "joined_on": 1,
                    "profile.last_seen": 1,
                    "profile.join_now": 1
                };
                var loadUserCount = function(callback) {
                    model_user.find(conditions)
                        .count(callback)
                };

                loadUserCount(function(err, users_count) {
                    $total = users_count;
                    var $recordsFiltered = $total;
                    var start = parseInt(req.query.start);
                    var limit = parseInt(req.query.length);
                    var draw = parseInt(req.query.draw);
                    model_user.find(conditions, fields).skip(start).limit(limit).sort({
                        'joined_on': -1
                    }).toArray(function(err, all_users) {
                        if (err) {
                            sendError(res, "Failed to retrieve users: " + err);
                        } else {
                            if (all_users && all_users.length) {

                                all_users.forEach(function(user, ind) {
                                    var workout_completed = 0;
                                    var progress_pics = 0;
                                    user.facebook_id = (typeof user.facebook_id != "undefined") ? user.facebook_id : "";
                                    user.google_id = (typeof user.google_id != "undefined") ? user.google_id : "";
                                    user.joined_on = toDate(user.joined_on);
                                    user.last_seen = (typeof user.profile.last_seen != "undefined") ? toDateAndTime(user.profile.last_seen) : "N/A";
                                    user.join_now = (typeof user.profile.join_now != "undefined") ? "Yes" : "No";
                                    user.nutrition_subscription = (typeof user.nutrition_subscription != "undefined" && user.nutrition_subscription) ? "Yes" : "No";
                                    if (typeof user.profile.startPlan_date != "undefined" || typeof user.profile.expire_date != "undefined" || typeof user.profile.subscription_plan_type != "undefined") {
                                        // user.uSubscribed = "No";
                                        if (user.profile.paid && user.profile.device_type!="web") {
                                            user.pay_type = "APPLE";
                                            if (user.profile.paid == "2" && user.profile.expire_date) {
                                                user.plan_period = "Paid (From: " + user.profile.startPlan_date + " To: " + user.profile.expire_date.substring(0, 10) + ")";
                                                // var expires_date = user.profile.expire_date.substring(0, 10);
                                                // var timeSubscribed = new Date(expires_date).getTime();
                                                // if( timeSubscribed >= (new Date()).getTime() ) user.uSubscribed = "Yes";

                                            } else if ( user.profile.paid == "1" && user.profile.expire_date ) {
                                                user.plan_period = "Free Trial";
                                                // var expires_date = user.profile.expire_date.substring(0, 10);
                                                // var timeSubscribed = new Date(expires_date).getTime();
                                                // if( timeSubscribed >= (new Date()).getTime() ) user.uSubscribed = "Yes";

                                            } else {
                                                user.plan_period = "Inactive";
                                            }
                                        } else if (user.profile.device_type == "Android") {
                                            user.pay_type = "GOOGLE";
                                            if (user.profile.subscribed_plan == "1") {
                                                user.plan_period = "Paid (From: " + user.profile.startPlan_date + " To: " + user.profile.endPlan_date + ")";
                                            } else if (user.profile.subscribed_plan == "0") {
                                                user.plan_period = "Free Trial";
                                            }
                                        } else {
                                            user.pay_type = "WEB";
                                            // for web users and old APP users those doesn't have new keys
                                            if (user.profile.subscribed_plan == "1") {
                                                user.plan_period = "Paid (From: " + user.profile.startPlan_date + " To: " + user.profile.endPlan_date + ")";
                                            } else if (user.profile.subscribed_plan == "0") {
                                                user.plan_period = "Free Trial";
                                            }
                                        }
                                    } else {
                                        user.plan_period = "Inactive";
                                    }
                                    user.user_id = user._id+"";

                                });
                            }
                            sendSuccess(res, {
                                data: all_users,
                                draw: draw,
                                recordsTotal: $total,
                                recordsFiltered: $recordsFiltered
                            });
                        }
                    });

                });

            }
        });
    });

    /**
        @@ Calculate Last Completed Workout
        @@ Function
    **/

    var _getLastCompletedWorkout  = function(user){

        var active_plan_key = user.profile.active_plan_key;

        var saved_user_data = [];

        if(active_plan_key && active_plan_key.length == 24 && user.profile['savedData_' + active_plan_key] && typeof user.profile['savedData_' + active_plan_key] !="undefined"){
            saved_user_data = JSON.parse(user.profile['savedData_' + active_plan_key]) || []
        }

        var sorted_array = [];
        if( saved_user_data && saved_user_data.length ) {
            if(Array.isArray(saved_user_data[0])==false ){
                // for ANDROID users
                var date = new Date();
                var current_date = prev_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0,0);

                //filter those dates <= currentdate
                sorted_array = saved_user_data.filter(function(item){
                    return ( new Date(item.dateWithYear).getTime() <= current_date.getTime() ) && item.workoutComplete.toLowerCase() == 'yes';
                })

                // sort them in descending order of date
                sorted_array.sort(function(a,b) {
                    return (new Date(a.dateWithYear).getTime() < new Date(b.dateWithYear).getTime()) ? 1 : ((new Date(b.dateWithYear).getTime() < new Date(a.dateWithYear).getTime()) ? -1 : 0);
                })

                return sorted_array.shift();
            }else{
                return;
            }
        }else{
            return;
        }
    }

    /**
        @@ Script to fetch All Custom Training Users
        @@ Get Fifty records each time
        @@
    **/

    router.get('/get_custom_training_users', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;

        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var $total = 0;
                var $recordsFiltered = 0;
                var conditions = {
                    course_type: "custom"
                    // excluding wegile emails...
                    //email: /^((?!wegile).)*$/i
                };
                if (req.query.search.value) {
                    conditions.$or = [{
                        "profile.name": new RegExp('^' + req.query.search.value + '.*$', "i")
                    }, {
                        email: new RegExp('^' + req.query.search.value + '.*$', "i")
                    }, {
                        facebook_id: new RegExp('^' + req.query.search.value + '.*$', "i")
                    }, {
                        google_id: new RegExp('^' + req.query.search.value + '.*$', "i")
                    }];
                }
                if (req.query.columns[5] && req.query.columns[5].search.value) // here filter processing
                {
                    if (conditions.$or) {
                        conditions.$and = [{
                            $or: conditions.$or
                        }];
                    }
                    //FREE TRIAL
                    if (req.query.columns[5].search.value == '1') {
                        if (conditions.$and) {
                            conditions.$and.push({
                                "profile.user_custom_plan_assigned": true
                            });
                        } else {
                            conditions['profile.user_custom_plan_assigned'] = true;
                        }

                    }

                }

                if (trainer_id) {
                    conditions.trainer_id = trainer_id;
                }

                var fields = {
                    "profile.name": 1,
                    "profile.image": 1,
                    "email": 1,
                    "facebook_id": 1,
                    "google_id": 1,
                    "progress_pics": 1,
                    "nutrition_subscription": 1,
                    "profile.paid": 1,
                    "profile.subscribed_plan": 1,
                    "profile.device_type": 1,
                    "profile.expire_date": 1,
                    "profile.startPlan_date": 1,
                    "profile.endPlan_date": 1,
                    "profile.subscription_plan_type": 1,
                    "profile.savedData": 1,
                    "joined_on": 1,
                    "profile.last_seen": 1,
                    "profile.join_now": 1
                };
                var loadUserCount = function(callback) {
                    model_user.find(conditions)
                        .count(callback)
                };

                loadUserCount(function(err, users_count) {
                    $total = users_count;
                    var $recordsFiltered = $total;
                    var start = parseInt(req.query.start);
                    var limit = parseInt(req.query.length);
                    var draw = parseInt(req.query.draw);
                    model_user.find(conditions, {}).skip(start).limit(limit).sort({
                        'joined_on': -1
                    }).toArray(function(err, all_users) {
                        if (err) {
                            sendError(res, "Failed to retrieve users: " + err);
                        } else {
                            if (all_users && all_users.length) {

                                all_users.forEach(function(user, ind) {
                                    var workout_completed = 0;
                                    var progress_pics = 0;
                                    user.facebook_id = (typeof user.facebook_id != "undefined") ? user.facebook_id : "";
                                    user.google_id = (typeof user.google_id != "undefined") ? user.google_id : "";
                                    user.joined_on = toDate(user.joined_on);
                                    user.last_seen = (typeof user.profile.last_seen != "undefined") ? toDateAndTime(user.profile.last_seen) : "N/A";
                                    user.workout_plan = (typeof user.profile.user_custom_plan_assigned != "undefined" && user.profile.user_custom_plan_assigned) ? "Yes" : "No";

                                    var last_completed_workout = _getLastCompletedWorkout(user); // Get Last Completed Workout
                                    if(last_completed_workout && last_completed_workout.workoutComplete.toLowerCase() == 'yes') {
                                        user.last_completed_workout = last_completed_workout?("Week"+last_completed_workout.week+" Day"+last_completed_workout.weekday + ' <i  class="ion-arrow-up-c" style="color: lime;"></i>'):"No Workout";
                                    }else{
                                        user.last_completed_workout = last_completed_workout?("Week"+last_completed_workout.week+" Day"+last_completed_workout.weekday + ' <i  class="ion-arrow-down-c" style="color: rgb(255, 0, 0);"></i>'):"No Workout";
                                    }

                                    user.nutrition_subscription = (typeof user.nutrition_subscription != "undefined" && user.nutrition_subscription) ? "Yes" : "No";
                                    user.plan_period = "Inactive";
                                    user.profile_name = (user.profile.name?user.profile.name:"Unnamed")+user._id+"";
                                    user.user_id = user._id+"";

                                });
                            }
                            sendSuccess(res, {
                                data: all_users,
                                draw: draw,
                                recordsTotal: $total,
                                recordsFiltered: $recordsFiltered
                            })
                        }
                    })
                })
            }
        })
    })

    /**
        @@Change Password
        @@input-user_id
    **/

    router.post("/changeUserPassword", function(req, res, next){
        var user_id = req.body.user_id;
        if(!req.body){
            return sendError(res, "Required parameters are missing!");
        }

        var current_pass = req.body.current_pass || '';
        var new_pass = req.body.new_pass || generatePassword(6);

        var all_trainers_subdomain= {

            "586f341b1cfef774222b1821": "", // DFG
            "591c8094da9386315f51787e": "workoutsbygabriela", // Gabriela
            "59177d25980aa43e2715a8fe": "nikkiricafit", // Nikki
            "58f66e596e288005867db979": "minneninja", //MN
            "584fbe1dadbdd05d535cddae": "twlapp", //TWL
            "59177e86980aa43e2715a8ff": "", // Byrne
            "57c5310521bbac1d01aa75db": "fitandthick",//FnT
            "597b8a331b54472074c2dd1a": "sugarysixpack", // SSP
            "5822bfb2b86828570dd90899": "mytrainercarmen", //MTC
            "59b174cfab77c775bae7c6a2": "fitwithwhit", //Fit with Whit
            "59b9ad9e446c6d65794a9bc9": "travbeachboy",//Trav Beach Boy
            "59c02f07b271d505358da0bf": "arianny", //Arianny
            "59bc29ff25d96c751aa76b3d": "mikechabot", // Mike Chabot French
            "59cd5272c1dc8268c5818cf0": "caitlin", //Caitlin Rice Fit
            "59d52803ee5c705abefacc11": "ooohbabybeast", //OBB
            "59e4ea0878c2ed3818c7c0de": "laisdeleon", //Lais DeLeon
            "59e7a30ce1705864cc7cf355": "cdcbody", //Caroline de Campos
            "59791200cc447310747e731d": "mikechabot", // Mike Chabot English,
            "5a270b18731edd456cb56f3b": "ashleykfit", //Ashley K Fit
            "5a8c7aff14d55f7ad445a6f3": "boothcamp", //Boothcamp
            "5a848f72c3b5c3530a8d05f1": "zbody", // Z Body
            "5aa6e4c527d727022ed0a9a8": "cass", // Lift With Cass
            "5a690da90379ce6d1fed04ac": "tianna", // Tianna G
            "5a3c25bf34d092539e01b020": "holly", // Holly Barker
            "5a60de980379ce6d1fecfec0": "lynsee", // Body By Lynsee
            "5a31715fea9bfe01e569a79e": "nienna", // Nienna Jade
            "5aea2440a87c277c2e2bf738": "curvyandcut", // Curvy & Cut
            "5ae1efea5058a545907d5f61": "janna", // Janna Breslin
            "5a5e36168887535a6f78b521": "jessie", // Jessies Girls
            "5acd3eb90780015c1e9cc568": "koya", // Get Loved Up
            "5a9d7d110a4ae17da220a43e": "valen", // Fit By Valen
            "5ababddaecc1ec1ffbd08c30": "bikiniboss", // Bikini Boss
            "5b5746db5c3f964e6408b507": "bodymaze", //Bodymaze
            "5b3fac6ebb2b53737d1fe6cc": "anita", // Body By Anita
            "5b0d7e8f97e2f515d56b7fa3": "mariza", // Mariza
            "5b32b29430f0493180099e60": "kirsty", // Kirsty Dunne
            "5ba3dad956d38558c5e5fbd7": "warriorathlete", // Warrior Athelete
            "5bad15caa6cb337a0a6d0656": "james", // James Ellisfit
            "5ad4dd4cc1ce3e3463753b50": "callie", // Callie Bundy
            "5b917a71b29b997460999b8f": "tanya", // Train With Tanya
            "5bd9de9ada6a6b3a240de595": "mandy", // Mandy,
            "5bd9e069da6a6b3a240de6dd": "aliengains", // Bakhar Nabieva
            "5ccc64cfd17f9f5d70b9b227": "massy", // Massy
            "5c3cc5c8ba2d490d720aca9e": "samib", // Sami
            "5da625b54eca18246d33be28": "erin" // Erin Oprea

        }
        var fs = require("fs");
        var model_user = Model.load('user', {}, function(err, model_user){
            if(err){
                return sendError(res, "Failed to access db: "+err);
            }

            model_user.find({_id: Model.ObjectID(user_id)}, {"email":1, "trainer_id":1, "password":1, "profile.name":1}).limit(1).next(function(err, user){
                if(err){
                    return sendError(res, "Something went wrong!");
                }

                if(!user){
                    return sendError(res, "Wrong current password!");
                }

                model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: {password: Model.password(new_pass)}}, {}, function(err, r){
                    if(err){
                        return sendError(res, "Failed to update password: "+err);
                    }
                    // update password for Web Users

                    if(all_trainers_subdomain[user.trainer_id]) {
                        __updatePasswordForWebUsers( all_trainers_subdomain[user.trainer_id], user.email, new_pass, user.trainer_id );
                    }

                    if(user.trainer_id == "57c5310521bbac1d01aa75db"){
                        var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'FnT_password_update.html'));
                        msg = (msg+"").replace('{{PASSWORD}}', new_pass);
                        mailer.sendMail({to:user.email, subject: "Password Changed", html: msg});
                    }else{
                        mailer.sendMail({to:user.email, subject: "Password Changed", html: "New password: "+new_pass});
                    }
                    sendSuccess(res, "Successfully updated password");
                });

            });
        });

    });

    function getCommunityPost(filter_type,labels,trainer_id,start_time,end_time,callback){
        var model_cpost = Model.load('post', {}, function(err, model_cpost) {
            if (err) {
                callback({status:false,message:err});
            }else{
                var cond = {};
                var counter = 1;
                cond.trainer_id = trainer_id;
                cond.created_at = {$lte:end_time,$gte:start_time}
                var total_cp = {};
                var hrsmin_array = [];
                var daily_cp = {};
                var cpArray = [];
                var cpArray1 = [];
                var moment = require('moment');
                model_cpost.find(cond).toArray(function(error,data){
                    if(error){
                        callback({status:false,message:error});
                    }else{
                        if(data && data.length){
                            data.forEach(function(item,ind){
                                var date_name = new Date(moment(new Date(item.created_at)).format('MMM,DD')).getTime();
                                var hrsmin = moment(new Date(item.created_at)).format('h:mm a');
                                hrsmin_array[hrsmin] = hrsmin;
                                if(!total_cp[date_name])
                                total_cp[date_name] = []
                                total_cp[date_name].push(item._id);



                                if(!daily_cp[hrsmin])
                                daily_cp[hrsmin] = []
                                daily_cp[hrsmin].push(item._id);


                                if(++counter == data.length){
                                    var total_cp_new = [];
                                    for(var kk in labels){
                                        var strtime = new Date(labels[kk]).getTime();
                                        if(typeof total_cp[labels[kk]]=='undefined'){
                                            total_cp[labels[kk]] = [];
                                        }else{
                                            total_cp[labels[kk]] = total_cp[labels[kk]];
                                        }
                                    }


                                    // if(filter_type=='daily'){
                                    //     cpArray[date_name] = [{label: 'Community post',data:daily_cp}];
                                    // }else{
                                    //     cpArray[date_name] = [{label: 'Community post',data:total_cp}];
                                    // }
                                    var ordered = {};
                                    Object.keys(total_cp).sort().forEach(function(key) {
                                      ordered[key] = total_cp[key];
                                    });

                                    if(filter_type=='daily'){
                                        cpArray1 = Object.keys(daily_cp).map(function(kk, ind) {

                                            var user_length = daily_cp[kk].length;
                                            return [{label: 'Community_post',data:user_length}]
                                        })
                                    }else{
                                        cpArray1 = Object.keys(ordered).map(function(kk, ind) {
                                            var user_length = ordered[kk].length;
                                            return [{label: 'Community_post',data:user_length}]
                                        })
                                    }

                                    var group_to_values = cpArray1.reduce(function (obj, item) {
                                        var label = item[0].label;
                                        var count = item[0].data;
                                        obj[label] = obj[label] || []
                                        obj[label].push(count)
                                        return obj
                                    }, {})
                                    callback({status:true,data:group_to_values});
                                }
                            });
                        }else{
                            callback({status:true,data: []});
                        }
                    }
                })
            }
        });
    }

     /*   GRAPH API'S START HERE */
    router.get('/get_devicetype_numerical_analytics',function(req,res,next){
        var trainer_id      = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var moment = require('moment');
        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            }else{
                var conditions = {};
                var current_date = new Date() // get current date
                conditions.trainer_id = trainer_id;

               if(req.query.start !='' && req.query.end !=''){
                    var firstDay = moment(new Date(parseInt(req.query.start))).format('YYYY-MM-DD');
                    var lastDay = moment(new Date(parseInt(req.query.end))).format('YYYY-MM-DD');
                    var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                    var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                    var start_time = new Date(firstDay).getTime();
                    var end_time = new Date(lastDay).getTime();
                }else{
                    var current_date = current_date; //new Date(current_date.getFullYear(), current_date.getMonth(), -36);
                    var firstDay = moment(new Date(current_date.getFullYear(), current_date.getMonth(), 1)).format('YYYY-MM-DD');
                    var lastDay = moment(new Date(current_date.getFullYear(), current_date.getMonth() + 1, 0)).format('YYYY-MM-DD');
                    var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                    var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                    var start_time = new Date(firstDay).getTime();
                    var end_time = new Date(lastDay).getTime();
                }
                conditions.joined_on = {$lte:end_time}

                var fields = {
                    "_": 1,
                    "joined_on":1,
                    "os_type":1,
                };
                model_user.find(conditions,fields).sort({joined_on:1}).toArray(function(err, analytics_data) {
                     if(err){
                        sendError(res, err);
                    }else if(!analytics_data) {
                        sendError(res, "Not found");
                    }else{

                        if(analytics_data.length > 0){
                            var counter = 1;
                            var labels              = {};
                            var filtered_labels     = [];
                            var device_type         = [];
                            var mainData            = [];
                            var showUserData        = [];
                            analytics_data.forEach(function(item,ind){
                                // DEVICE TYPE
                                if(item.os_type){
                                    filtered_labels[item.os_type] = filtered_labels[item.os_type] || [];
                                    filtered_labels[item.os_type].push(item);
                                }
                            })

                            var data_setValue = Object.keys(filtered_labels).map(function (key) {
                                var object1 = filtered_labels[key].length
                                return object1;
                            })
                            //group_to_values_subs1['Subscription plan'] = filtered_subscribed;
                            var backgroundColor = Object.keys(filtered_labels).map(function (key) {

                                var color = '#';
                                if(key == 'Android'){
                                    color += 'FAD000';
                                }
                                if(key == 'iOS'){
                                    color += '000000';
                                }
                                if(key == 'web'){
                                    color += '808080';
                                }
                               return color ;
                            });
                            sendSuccess(res, {
                                data: data_setValue,
                                labels: Object.keys(filtered_labels),
                                backgroundColor: backgroundColor,
                                date_range :{endDate:endDate}
                            });
                        }else{
                            var filtered_labels = [];
                            var group2 = [];
                            var backgroundColor = [];
                            sendSuccess(res, {
                                data:group2,
                                labels: filtered_labels,
                                backgroundColor: backgroundColor,
                                date_range :{endDate:endDate}
                            });
                        }
                    }
                })
            }
        })
    })
/*   GRAPH API'S START HERE */
    router.get('/get_usertype_numerical_analytics',function(req,res,next){
        var trainer_id      = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var moment = require('moment');
        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            }else{
                var conditions = {};
                var current_date = new Date() // get current date
                conditions.trainer_id = trainer_id;

               if(req.query.start !='' && req.query.end !=''){
                    var firstDay = moment(new Date(parseInt(req.query.start))).format('YYYY-MM-DD');
                    var lastDay = moment(new Date(parseInt(req.query.end))).format('YYYY-MM-DD');
                    var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                    var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                    var start_time = new Date(firstDay).getTime();
                    var end_time = new Date(lastDay).getTime();
                }else{
                    var current_date = current_date; //new Date(current_date.getFullYear(), current_date.getMonth(), -36);
                    var firstDay = moment(new Date(current_date.getFullYear(), current_date.getMonth(), 1)).format('YYYY-MM-DD');
                    var lastDay = moment(new Date(current_date.getFullYear(), current_date.getMonth() + 1, 0)).format('YYYY-MM-DD');
                    var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                    var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                    var start_time = new Date(firstDay).getTime();
                    var end_time = new Date(lastDay).getTime();
                }
                //conditions.joined_on = {$lte:end_time,$gte:start_time}
                conditions.joined_on = {$lte:end_time}

                var fields = {
                    "_": 1,
                    "joined_on":1,
                    "profile.device_type":1,
                    "profile.subscribed_plan":1,
                };
                model_user.find(conditions,fields).sort({joined_on:1}).toArray(function(err, analytics_data) {
                     if(err){
                        sendError(res, err);
                    }else if(!analytics_data) {
                        sendError(res, "Not found");
                    }else{

                        if(analytics_data.length > 0){
                            var counter = 1;
                            var labels              = {};
                            var time_array          = [];
                            var subscription_type   = {};
                            var subscription_type1  = {};
                            var filtered_labels     = [];
                            var filtered_labels1    = [];
                            var subscribed_plan     = {};
                            var device_type         = [];
                            analytics_data.forEach(function(item,ind){
                                var date_name = moment(new Date(item.joined_on)).format('MMM,DD');
                                var date_name1 = moment(new Date(item.joined_on)).format('YYYY-MM-DD');

                                labels[item.joined_on] =  item.joined_on;
                                var datetime1 = new Date(date_name1).getTime();
                                var datetime = new Date(date_name1).getTime();
                                time_array[datetime1] = {date:new Date(date_name1).getTime()};

                                // DEVICE TYPE
                                if(typeof item.profile.device_type !='undefined'){
                                    if(!subscription_type[datetime])
                                    subscription_type[datetime] = []
                                    device_type[item.profile.device_type] = item.profile.device_type;
                                    subscription_type[datetime].push(item.profile.device_type);

                                }
                                // SUBSCRIBED PLAN
                                if(typeof item.profile.subscribed_plan !='undefined' || typeof item.profile.paid !='undefined'){
                                    if(!subscribed_plan[datetime])
                                    subscribed_plan[datetime] = []
                                    if(item.profile.subscribed_plan==1 || item.profile.paid==2){
                                        subscribed_plan[datetime].push(parseInt(item.profile.subscribed_plan));
                                    }
                                }
                                if(counter ==analytics_data.length){
                                    var result = Object.keys(time_array).map(function(key) {
                                      return [Number(key), time_array[key]];
                                    });
                                    //SUBSCRIBED PAID COUNT

                                    device_type1 = Object.keys(device_type).map(function(kk, ind) {
                                        return kk
                                    })


                                    var subscribed_plan1 = {};
                                    var subscription_type3 = []
                                    for(var i = 0; i<result.length;i++){
                                        var pic_sum = subscribed_plan[result[i][0]];
                                        var timekey = result[i][0];

                                        if(!subscribed_plan1[timekey])
                                        subscribed_plan1[timekey] = []
                                        if(typeof pic_sum !='undefined' && pic_sum.length > 0){
                                           var data_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                            var pic_len = pic_sum.length;
                                            //var avg = Math.round(data_sum/pic_len);
                                            subscribed_plan1[timekey].push(data_sum);
                                        }else{
                                             subscribed_plan1[timekey].push(0);
                                        }


                                        // DEVICE TYPE COUNTING
                                        var pic_sum = subscription_type[result[i][0]];
                                        var timekey = result[i][0];
                                        if(!subscription_type1[timekey])
                                        subscription_type1[timekey] = []
                                        if(typeof pic_sum !='undefined'){
                                           subscription_type1[timekey] = pic_sum.reduce(function (obj, item) {
                                                var count = item;
                                                obj[count] = obj[count] || 0
                                                obj[count] = parseInt(obj[count])+1;
                                                return obj
                                            }, {})

                                        }
                                    }


                                    // // DEVICE TYPE COUNTING
                                    // for(var i = 0; i<result.length;i++){
                                    //     // var pic_sum = subscription_type[result[i][0]];
                                    //     // var timekey = result[i][0];
                                    //     // if(!subscription_type1[timekey])
                                    //     // subscription_type1[timekey] = []
                                    //     // if(typeof pic_sum !='undefined'){
                                    //     //    subscription_type1[timekey] = pic_sum.reduce(function (obj, item) {
                                    //     //         var count = item;
                                    //     //         obj[count] = obj[count] || 0
                                    //     //         obj[count] = parseInt(obj[count])+1;
                                    //     //         return obj
                                    //     //     }, {})

                                    //     // }
                                    // }
                                    for(var kk in subscription_type1){
                                        device_type1.forEach(function(item,index){
                                            if(typeof subscription_type1[kk][item]=='undefined'){
                                                subscription_type1[kk][item] = 0;
                                            }
                                        })
                                    }
                                    var subscription_type2 = {}
                                    for(var kk in subscription_type1){
                                        for(var propt in subscription_type1[kk]){

                                            if(!subscription_type2[kk])
                                            subscription_type2[kk] = [];
                                            subscription_type2[kk].push({label:propt,data:[subscription_type1[kk][propt]]});
                                        }
                                    }


                                    for(var i = 0; i<result.length;i++){
                                        var pic_sum = subscription_type2[result[i][0]];

                                        var timekey = result[i][0];
                                        if(typeof pic_sum !='undefined'){
                                            pic_sum.forEach(function(item,index){
                                                var data = item.data;
                                                var label = item.label;
                                                var pic_len = item.data.length;
                                                var data_sum = data.reduce(function(a, b) { return a + b; });
                                                var avg = Math.round(data_sum/pic_len);
                                                if(!subscription_type3[label])
                                                subscription_type3[label] = subscription_type3[label] || []
                                                subscription_type3[label].push(data_sum);
                                            })
                                        }

                                    }

                                    var group_to_values_subs1 = {}
                                    var group_to_values_subs = Object.keys(subscription_type3).map(function(kk, ind) {
                                        var label = kk;
                                        var data  = subscription_type3[kk];
                                        var test = {};
                                        test[label] = test[label] || []
                                        test[label] = data;
                                        return test;
                                    })

                                    for(var kk in group_to_values_subs){
                                        for(var kk1 in group_to_values_subs[kk]){
                                            group_to_values_subs1[kk1] = group_to_values_subs[kk][kk1];
                                        }
                                    }

                                    //converting time to date

                                    filtered_labels = Object.keys(labels).map(function(kk, ind) {
                                        return moment(new Date(labels[kk])).format('MMM,DD')
                                    })

                                    //making unique to date
                                    var uniqueIds = filtered_labels.reduce(function (obj, item) {
                                        obj[item] = item;
                                        return obj;
                                    }, {});

                                    //creating  array of dates as per graph format
                                    filtered_subscribed = Object.keys(subscribed_plan1).map(function(kk, ind) {
                                        return subscribed_plan1[kk][0];
                                    })

                                    filtered_labels1 = Object.keys(uniqueIds).map(function(kk, ind) {
                                        return kk
                                    })

                                    //group_to_values_subs1['Subscription plan'] = filtered_subscribed;

                                    var group2 = Object.keys(group_to_values_subs1).map(function (key) {

                                        var label = key;
                                        /*GENERATE RANDOM COLOR */
                                        var letters = '0123456789ABCDEF';
                                        var color = '#';
                                        // for (var i = 0; i < 6; i++) {
                                        //     color += letters[Math.floor(Math.random() * 16)];
                                        // }

                                        var mainLabel;
                                        if(label=='Android'){
                                            mainLabel = 'Google';
                                            color += 'FAD000';
                                        }
                                        if(label=='iOS'){
                                            mainLabel = 'Apple';
                                            color += '000000';
                                        }
                                        if(label=='web'){
                                            mainLabel = 'Web'
                                            color += '808080';
                                        }
                                        // if(label=='Subscription plan'){
                                        //     color += 'D3D3D3';
                                        // }
                                        return {label: mainLabel, data: group_to_values_subs1[key],fill: false,backgroundColor: color,borderColor:color};

                                    });

                                    var group3 = Object.keys(group_to_values_subs1).map(function (key) {

                                        var label = key;
                                        var color = '#';

                                        if(label=='Android'){
                                            color += 'FAD000';
                                        }
                                        if(label=='iOS'){
                                            color += '000000';
                                        }
                                        if(label=='web'){
                                            color += '808080';
                                        }

                                        return color

                                    });

                                    var labelMain = Object.keys(group_to_values_subs1).map(function (key) {

                                        var label = key;
                                        var keyMain;

                                        if(label=='Android'){
                                            keyMain = 'Google';
                                        }
                                        if(label=='iOS'){
                                            keyMain = 'Apple';
                                        }
                                        if(label=='web'){
                                            keyMain = 'Web';
                                        }

                                        return keyMain

                                    });


                                    // addition work for Pie Chart
                                    var group4 = [];
                                    if(group2 && group2.length){
                                        var sum = 0;
                                        group2.forEach(function(g, index){
                                            sum = g['data'].reduce((a, b)=>{
                                                return a+b;
                                            })
                                            group4.push(sum);
                                        })
                                    }

                                    sendSuccess(res, {
                                        data: group4,
                                        labels: labelMain,
                                        backgroundColor: group3,
                                        //labels:filtered_labels1,
                                        subscription_type:group2,
                                        //date_range :{startDate:startDate,endDate:endDate}
                                        date_range :{endDate:endDate}
                                    });
                                }
                                counter++;
                            })
                        }else{
                            var filtered_labels1 = [];
                            var group2 = [];
                            var data_setValue = [];
                            sendSuccess(res, {
                                data:data_setValue,
                                labels:filtered_labels1,
                                backgroundColor: group2,
                                subscription_type:group2,
                                //date_range :{startDate:startDate,endDate:endDate}
                                date_range :{endDate:endDate}
                            });
                        }
                    }
                })
            }
        })
    })
    router.get('/get_subscription_numerical_analytics',function(req,res,next){

        var trainer_id      = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var moment = require('moment');
        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            }else{
                var conditions = {};
                var current_date = new Date() // get current date
                conditions.trainer_id = trainer_id;

                if(req.query.start !='' && req.query.end !=''){
                    var firstDay = moment(new Date(parseInt(req.query.start))).format('YYYY-MM-DD');
                    var lastDay = moment(new Date(parseInt(req.query.end))).format('YYYY-MM-DD');

                    var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                    var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');

                    var start_time = new Date(firstDay).getTime();
                    var end_time = new Date(lastDay).getTime();
                }else{
                    var current_date = current_date; //new Date(current_date.getFullYear(), current_date.getMonth(), -36);
                    var firstDay = moment(new Date(current_date.getFullYear(), current_date.getMonth(), 1)).format('YYYY-MM-DD');
                    var lastDay = moment(new Date(current_date.getFullYear(), current_date.getMonth() + 1, 0)).format('YYYY-MM-DD');
                    var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                    var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');

                    var start_time = new Date(firstDay).getTime();
                    var end_time = new Date(lastDay).getTime();
                }

               conditions.joined_on = {$lte:end_time,$gte:start_time}

                var fields = {
                    "_": 1,
                    "joined_on":1,
                    "profile.subscription_plan_type":1,
                    // "profile.device_type":1,
                    // "profile.subscribed_plan":1,
                    // "profile.paid":1,
                    // "profile.expire_date":1,
                    // "profile.endPlan_date":1
                };
                model_user.find(conditions,fields).sort({joined_on:1}).toArray(function(err, analytics_data) {
                    if(err){
                        sendError(res, err);
                    }else if(!analytics_data) {
                        sendError(res, "Not found");
                    }else{
                        if(analytics_data.length > 0){
                            var counter = 1;
                            var labels              = {};
                            var sub_plan_type       = {};
                            var sub_plan_type1      = {};
                            var sub_plan_type2      = {};
                            var time_array          = [];
                            var type_array          = {};
                            analytics_data.forEach(function(item,ind){
                                var date_name = moment(new Date(item.joined_on)).format('MMM,DD');
                                var date_name1 = moment(new Date(item.joined_on)).format('YYYY-MM-DD');

                                labels[item.joined_on] =  item.joined_on;
                                var datetime1 = new Date(date_name1).getTime();
                                time_array[datetime1] = {date:new Date(date_name1).getTime()};
                                var pic_array = item.progress_pictures;
                                var datetime = new Date(date_name1).getTime();
                                // SUBCCRIPTION PLAN TYPE
                                if(typeof item.profile.subscription_plan_type !='undefined'){
                                    if(!sub_plan_type[datetime])
                                    sub_plan_type[datetime] = []
                                    var subs_plan = item.profile.subscription_plan_type;
                                    type_array[subs_plan] = subs_plan;

                                    sub_plan_type[datetime].push(item.profile.subscription_plan_type);
                                }

                                if(counter ==analytics_data.length){
                                    var result = Object.keys(time_array).map(function(key) {
                                      return [Number(key), time_array[key]];
                                    });
                                    for(var i = 0; i<result.length;i++){
                                        var pic_sum = sub_plan_type[result[i][0]];
                                        var timekey = result[i][0];
                                        if(!sub_plan_type1[timekey])
                                        sub_plan_type1[timekey] = []
                                        if(typeof pic_sum !='undefined'){
                                           sub_plan_type1[timekey] = pic_sum.reduce(function (obj, item) {
                                                var count = item;
                                                obj[count] = obj[count] || 0
                                                obj[count] = parseInt(obj[count])+1;
                                                return obj
                                            }, {})

                                        }
                                    }
                                    for(var item in sub_plan_type1){
                                        for(var type_key in type_array){
                                            if(!sub_plan_type1[item][type_key]){
                                                sub_plan_type1[item][type_key] = '0';
                                            }
                                        }

                                    }
                                    var test = [];
                                    var filtered_subs_plan = {}
                                    var filtered_subs_plan_label = []
                                    for(var kk in sub_plan_type1){
                                        if(sub_plan_type1[kk]){
                                            for(var propt in sub_plan_type1[kk]){
                                                if(sub_plan_type1[kk][propt]){
                                                    filtered_subs_plan[propt] = filtered_subs_plan[propt] || []
                                                    filtered_subs_plan[propt].push(parseInt(sub_plan_type1[kk][propt]));
                                                }
                                            }
                                        }
                                    }
                                    var group_to_values_sub_plan = [];
                                    for(var kk in filtered_subs_plan){
                                        group_to_values_sub_plan.push({label:kk,data:filtered_subs_plan[kk]});
                                        filtered_subs_plan_label[kk] = filtered_subs_plan_label[kk] || []
                                        filtered_subs_plan_label[kk] = kk;
                                    }
                                    filtered_labels2 = Object.keys(filtered_subs_plan_label).map(function(kk, ind) {
                                        return kk
                                    })

                                    filtered_labels = Object.keys(labels).map(function(kk, ind) {
                                        return moment(new Date(labels[kk])).format('MMM,DD')
                                    })

                                    var uniqueIds = filtered_labels.reduce(function (obj, item) {
                                        obj[item] = item;
                                        return obj;
                                    }, {});

                                    filtered_labels1 = Object.keys(uniqueIds).map(function(kk, ind) {
                                        return kk
                                    })


                                    var group1 = Object.keys(group_to_values_sub_plan).map(function (key) {
                                        var label1 = group_to_values_sub_plan[key].label;
                                        if(label1 == 'null'){
                                            var label = '';
                                        }else if(label1 == 'annually'){
                                            var label = 'Yearly';
                                        }else{
                                            var label = label1.charAt(0).toUpperCase() + label1.slice(1)
                                        }

                                        /*GENERATE RANDOM COLOR */
                                        var letters = '0123456789ABCDEF';
                                        var color1 = '#';
                                        // for (var i = 0; i < 6; i++) {
                                        //     color += letters[Math.floor(Math.random() * 16)];
                                        // }

                                        if(label=='Monthly'){
                                            color1 += 'FAD000';
                                        }
                                        if(label=='Quarterly'){
                                            color1 += '808080';
                                        }
                                        if(label=='Yearly'){
                                            color1 += '000000';
                                        }

                                        if(color1 == '#'){
                                            var color2 = '';
                                        }else{
                                            var color2 = color1;
                                        }
                                        if(color2 !='' || color2 !='undefined'){
                                            var color = color2;
                                        }
                                       return {label: label?label:'', data: group_to_values_sub_plan[key].data,fill: false,backgroundColor: color?color:'',borderColor:color?color:''};

                                    });

                                    sendSuccess(res, {
                                        //labels_subs_plan :filtered_labels2,
                                        labels:filtered_labels1,
                                        subscription_plan :group1,
                                        date_range :{startDate:startDate,endDate:endDate}
                                    });
                                }
                                counter++;
                            })
                        }else{
                            var final_array = [];
                            sendSuccess(res, {
                                final_array:final_array,
                                date_range :{startDate:startDate,endDate:endDate}
                            });
                        }
                    }
                })

            }
        })
    })

    router.get('/get_active_numerical_analytics',function(req,res,next){

        var trainer_id      = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var moment = require('moment');
        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            }else{
                var current_date = new Date() // get current date


              var conditions = {};

                conditions.trainer_id = trainer_id;

                if(req.query.filter_type=='monthly'){
                    if(req.query.start !='' && req.query.end !=''){
                        var firstDay = moment(new Date(parseInt(req.query.start))).format('YYYY-MM-DD');
                        var lastDay = moment(new Date(parseInt(req.query.end))).format('YYYY-MM-DD');
                        var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                        var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');

                        var start_time = new Date(firstDay).getTime();
                        var end_time = new Date(lastDay).getTime();
                    }else{
                        var current_date = current_date;//new Date(current_date.getFullYear(), current_date.getMonth(), -36);
                        var firstDay = new Date(current_date.setDate(current_date.getDate() -31)); //moment(new Date(current_date.getFullYear(), current_date.getMonth(), 1)).format('YYYY-MM-DD');
                        var lastDay = new Date(new Date().setDate(new Date().getDate())); //moment(new Date(current_date.getFullYear(), current_date.getMonth() + 1, 0)).format('YYYY-MM-DD');
                        var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                        var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                        var start_time = new Date(firstDay).getTime();
                        var end_time = new Date(lastDay).getTime();
                    }
                    conditions.joined_on = {$lte:end_time,$gte:start_time}
                }else if(req.query.filter_type=='weekly'){
                    if(req.query.start !='' && req.query.end !=''){
                        var firstDay = moment(new Date(parseInt(req.query.start))).format('YYYY-MM-DD');
                        var lastDay = moment(new Date(parseInt(req.query.end))).format('YYYY-MM-DD');
                        var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                        var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                        var start_time = new Date(firstDay).getTime();
                        var end_time = new Date(lastDay).getTime();
                    }else{
                        //var curr = new Date;
                        var curr = current_date; //new Date(current_date.getFullYear(), current_date.getMonth(), -36);
                        var firstDay = new Date(curr.setDate(curr.getDate() -8));
                        var lastDay = new Date(new Date().setDate(new Date().getDate() -1));
                        var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                        var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                        var start_time = new Date(firstDay).getTime();
                        var end_time = new Date(lastDay).getTime();
                    }
                    conditions.joined_on = {$lte:end_time,$gte:start_time}
                }else{
                    if(req.query.start !='' && req.query.end !=''){
                        var firstDay = moment(new Date(parseInt(req.query.start))).format('YYYY-MM-DD');
                        var lastDay = moment(new Date(parseInt(req.query.end))).format('YYYY-MM-DD');
                        var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                        var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                        var start_time = new Date(firstDay).getTime();
                        var end_time = new Date(lastDay).getTime();
                    }else{

                        var preDate = new Date(current_date.setDate(current_date.getDate() -1));

                        var firstDay = preDate ; //current_datemoment(new Date(current_date.getFullYear(), current_date.getMonth(), +0)).format('YYYY-MM-DD');
                        var lastDay = new Date(); //moment(new Date(current_date.getFullYear(), current_date.getMonth(), -35)).format('YYYY-MM-DD');
                        var start_time = new Date(firstDay).getTime();
                        var end_time = new Date(lastDay).getTime();
                        var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                        var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                    }
                    conditions.joined_on = {$lte:end_time,$gte:start_time}
                }

                conditions.active = true;

                var fields = {
                    "_": 1,
                    "joined_on":1,
                    "progress_pictures":1,
                    "progress_pics":1,
                    "profile.analytics.workouts_completed_count":1,

                };
                model_user.find(conditions,fields).sort({joined_on:1}).toArray(function(err, analytics_data) {
                    if(err){
                        sendError(res, err);
                    }else if(!analytics_data) {
                        sendError(res, "Not found");
                    }else{

                        if(analytics_data.length > 0){
                            var counter = 1;

                            var labels              = {};
                            var filtered_labels     = [];
                            var filtered_labels1    = [];
                            var group_to_values     = [];
                            var analyticsArray      = [];
                            var analyticsArray1     = [];

                            var total_users         = {};
                            var active_users        = {};

                            var time_array          = [];
                            var wc_cunt             = [];
                            var progress_pics       = {};
                            var progress_pics1      = {};

                            var progress_picsold     = {};
                            var progress_pics1old    = {};
                            var wc_cunt1            = {};
                            var hrsmin_array        = {};
                            var labels_cp           = {};
                            analytics_data.forEach(function(item,ind){
                                var date_name = moment(new Date(item.joined_on)).format('MMM,DD');
                                var date_name1 = moment(new Date(item.joined_on)).format('YYYY-MM-DD');

                                labels[item.joined_on] =  item.joined_on;
                                var datetime1 = new Date(date_name1).getTime();
                                var cptime = new Date(date_name).getTime();
                                labels_cp[cptime] = cptime;
                                time_array[datetime1] = {date:new Date(date_name1).getTime()};

                                var datetime = new Date(date_name1).getTime();

                                var joined_on= item.joined_on;

                                //merging users list joining date wise
                                if(!total_users[date_name])
                                total_users[date_name] = []
                                total_users[date_name].push(item._id);

                                var hrsmin = moment(new Date(joined_on)).format('h:mm a');
                                hrsmin_array[hrsmin] = hrsmin;
                                if(!active_users[hrsmin])
                                active_users[hrsmin] = []
                                active_users[hrsmin].push(item._id);
                                if(req.query.filter_type=='daily'){
                                    analyticsArray[date_name] = [{label: 'Active users',data:active_users}];
                                }else{
                                    analyticsArray[date_name] = [{label: 'Active users',data:total_users}];
                                }


                                var pic_array       = item.progress_pictures;
                                var pic_arrayold    = item.progress_pics;

                                // WC COUNT TYPE
                                if(typeof item.profile.analytics !='undefined'){
                                    if(req.query.filter_type=='daily'){
                                        if(!wc_cunt[hrsmin])
                                        wc_cunt[hrsmin] = []
                                        wc_cunt[hrsmin].push(item.profile.analytics.workouts_completed_count);
                                    }else{
                                        if(!wc_cunt[datetime])
                                        wc_cunt[datetime] = []
                                        wc_cunt[datetime].push(item.profile.analytics.workouts_completed_count);
                                    }

                                }

                                /* CODE FOR SHARED PROGRESS PICS */
                                if(typeof pic_array !='undefined' && pic_array.length > 0){
                                    var datetime = new Date(date_name1).getTime();
                                    if(req.query.filter_type=='daily'){
                                        if(!progress_pics[hrsmin])
                                        progress_pics[hrsmin] = []
                                        //progress_pics[hrsmin].push(pic_array.reduce(function(a, b) { return a + b; }));
                                        progress_pics[hrsmin].push(pic_array.length);
                                    }else{
                                        if(!progress_pics[datetime])
                                        progress_pics[datetime] = []
                                        progress_pics[datetime].push(pic_array.length);
                                    }

                                }

                                /* OLD PROGRESS PICTURES*/

                                if(typeof pic_arrayold !='undefined'){
                                    var old_pics_length = Object.keys(pic_arrayold).length;
                                    var datetime = new Date(date_name1).getTime();
                                    if(req.query.filter_type=='daily'){
                                        if(!progress_picsold[hrsmin])
                                        progress_picsold[hrsmin] = []
                                        progress_picsold[hrsmin].push(old_pics_length);
                                    }else{
                                        if(!progress_picsold[datetime])
                                        progress_picsold[datetime] = []
                                        progress_picsold[datetime].push(old_pics_length);
                                    }

                                }

                                if(counter ==analytics_data.length){
                                   if(req.query.filter_type=='daily'){
                                        var result = Object.keys(hrsmin_array).map(function(key) {
                                          return [key, key];
                                        });
                                    }else{
                                        var result = Object.keys(time_array).map(function(key) {
                                          return [Number(key), time_array[key]];
                                        });
                                    }


                                    for(var i = 0; i<result.length;i++){
                                        var pic_sum = progress_pics[result[i][0]];
                                        var timekey = result[i][0];
                                        if(!progress_pics1[timekey])
                                        progress_pics1[timekey] = []
                                        if(typeof pic_sum !='undefined'){
                                            var pic_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                            var pic_len = progress_pics[result[i][0]].length;
                                            var avg = Math.round(pic_sum/pic_len);

                                            progress_pics1[timekey].push(pic_sum);
                                        }else{
                                            progress_pics1[timekey].push(0);
                                        }

                                        var pic_sum = progress_picsold[result[i][0]];
                                        var timekey = result[i][0];
                                        if(typeof pic_sum !='undefined'){
                                            var pic_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                            var pic_len = progress_picsold[result[i][0]].length;
                                            var avg = Math.round(pic_sum/pic_len);

                                            progress_pics1[timekey].push(pic_sum);
                                        }else{
                                            progress_pics1[timekey].push(0);
                                        }



                                    }

                                    // for(var i = 0; i<result.length;i++){
                                    //     var pic_sum = progress_picsold[result[i][0]];
                                    //     var timekey = result[i][0];
                                    //     if(typeof pic_sum !='undefined'){
                                    //         var pic_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                    //         var pic_len = progress_picsold[result[i][0]].length;
                                    //         var avg = Math.round(pic_sum/pic_len);

                                    //         progress_pics1[timekey].push(pic_sum);
                                    //     }else{
                                    //         progress_pics1[timekey].push(0);
                                    //     }
                                    //}

                                    for(var i = 0; i<result.length;i++){
                                        var pic_sum = progress_pics1[result[i][0]];
                                        var timekey = result[i][0];
                                        var pic_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                        if(!progress_pics1old[timekey])
                                        progress_pics1old[timekey] = []
                                        progress_pics1old[timekey].push(pic_sum);

                                        // WC COUNT TYPE

                                        var pic_sum = wc_cunt[result[i][0]];
                                        var timekey = result[i][0];
                                        if(!wc_cunt1[timekey])
                                        wc_cunt1[timekey] = []
                                        if(typeof pic_sum !='undefined'){
                                            var pic_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                            var pic_len = wc_cunt[result[i][0]].length;
                                            var avg = Math.round(pic_sum/pic_len);

                                            wc_cunt1[timekey].push(pic_sum);
                                        }else{
                                            wc_cunt1[timekey].push(0);
                                        }
                                    }




                                    // for(var i = 0; i<result.length;i++){
                                    //     var pic_sum = wc_cunt[result[i][0]];
                                    //     var timekey = result[i][0];
                                    //     if(!wc_cunt1[timekey])
                                    //     wc_cunt1[timekey] = []
                                    //     if(typeof pic_sum !='undefined'){
                                    //         var pic_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                    //         var pic_len = wc_cunt[result[i][0]].length;
                                    //         var avg = Math.round(pic_sum/pic_len);

                                    //         wc_cunt1[timekey].push(pic_sum);
                                    //     }else{
                                    //         wc_cunt1[timekey].push(0);
                                    //     }
                                    // }

                                    filtered_pic = Object.keys(progress_pics1old).map(function(kk, ind) {
                                        return progress_pics1old[kk][0];
                                    })

                                    filtered_wc = Object.keys(wc_cunt1).map(function(kk, ind) {
                                        return wc_cunt1[kk][0];
                                    })


                                   /* CODE FOR SHARED PROGRESS PICS */
                                    if(req.query.filter_type=='daily'){
                                        analyticsArray1 = Object.keys(active_users).map(function(kk, ind) {

                                            var user_length = active_users[kk].length;
                                            return [{label: 'Active users',data:user_length}]
                                        })
                                    }else{
                                        analyticsArray1 = Object.keys(analyticsArray).map(function(kk, ind) {
                                            var user_length = analyticsArray[kk][0]['data'][kk].length;
                                            return [{label: 'Active users',data:user_length}]
                                        })
                                    }

                                    //converting time to date
                                    if(req.query.filter_type=='daily'){
                                        filtered_labels = Object.keys(active_users).map(function(kk, ind) {
                                            return kk; //moment(new Date([kk])).format('MMM,DD')
                                        })
                                    }else{
                                         filtered_labels = Object.keys(labels).map(function(kk, ind) {
                                            return moment(new Date(labels[kk])).format('MMM,DD')
                                        })
                                    }

                                    //making unique to date
                                    var uniqueIds = filtered_labels.reduce(function (obj, item) {
                                        obj[item] = item;
                                        return obj;
                                    }, {});

                                    //creating  array of dates as per graph format

                                    filtered_labels1 = Object.keys(uniqueIds).map(function(kk, ind) {
                                        return kk
                                    })

                                    //grouping data
                                    var group_to_values = analyticsArray1.reduce(function (obj, item) {
                                        var label = item[0].label;
                                        var count = item[0].data;
                                        obj[label] = obj[label] || []
                                        obj[label].push(count)
                                        return obj
                                    }, {})


                                    group_to_values['Progress pics'] = filtered_pic;
                                    group_to_values['Completed count'] = filtered_wc;

                                    getCommunityPost(req.query.filter_type,labels_cp,trainer_id,start_time,end_time,function(CommunityPostResponse){
                                        if(CommunityPostResponse.status==true){
                                            group_to_values['Community post'] = CommunityPostResponse.data.Community_post;
                                        }else{
                                            group_to_values['Community post'] = [];
                                        }
                                        var groups = Object.keys(group_to_values).map(function (key) {
                                        /*GENERATE RANDOM COLOR */
                                        var letters = '0123456789ABCDEF';
                                        var color = '#';
                                        // for (var i = 0; i < 6; i++) {
                                        //     color += letters[Math.floor(Math.random() * 16)];
                                        // }
                                        if(key=='Active users'){
                                            color += 'FAD000';
                                        }
                                        if(key=='Progress pics'){
                                            color += '000000';
                                        }
                                        if(key=='Completed count'){
                                            color += '808080';
                                        }
                                        // if(key=='Completed count'){
                                        //     color += '808080';
                                        // }
                                        if(key=='Community post'){
                                            color += '006400';
                                        }

                                       return {label: key, data: group_to_values[key],fill: false,backgroundColor: color,borderColor:color};

                                    });
                                    sendSuccess(res, {
                                        labels:filtered_labels1,
                                        final_array:groups,
                                        date_range :{startDate:startDate,endDate:endDate}
                                    });

                                    })

                                }
                                counter++;
                            })
                        }else{
                            var final_array = [];
                            sendSuccess(res, {
                                final_array:final_array,
                                date_range :{startDate:startDate,endDate:endDate}
                            });
                        }
                    }
                })
            }
        })
    })
    router.get('/get_subscribed_plan_numerical_analytics',function(req,res,next){
        var trainer_id      = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var moment = require('moment');
        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            }else{
              var current_date = new Date() // get current date


              var conditions = {};

                conditions.trainer_id = trainer_id;
                if(req.query.start !='' && req.query.end !=''){
                    var firstDay = moment(new Date(parseInt(req.query.start))).format('YYYY-MM-DD');
                    var lastDay = moment(new Date(parseInt(req.query.end))).format('YYYY-MM-DD');
                    var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                    var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                    var start_time = new Date(firstDay).getTime();
                    var end_time = new Date(lastDay).getTime();
                }else{
                    var current_date = current_date; //new Date(current_date.getFullYear(), current_date.getMonth(), -36);
                    var firstDay = moment(new Date(current_date.getFullYear(), current_date.getMonth(), 1)).format('YYYY-MM-DD');
                    var lastDay = moment(new Date(current_date.getFullYear(), current_date.getMonth() + 1, 0)).format('YYYY-MM-DD');
                    var startDate = moment(new Date(firstDay)).format('YYYY-MM-DD');
                    var endDate = moment(new Date(lastDay)).format('YYYY-MM-DD');
                    var start_time = new Date(firstDay).getTime();
                    var end_time = new Date(lastDay).getTime();
                }

                conditions.joined_on = {$lte:end_time,$gte:start_time}

                if(req.query.new_type && typeof req.query.new_type !='undefined'){
                    var new_type = req.query.new_type
                }
                if(typeof req.query.recurring_type !='undefined'){
                    var recurring_type = req.query.recurring_type
                }

                var fields = {
                    "_": 1,
                    "joined_on":1,
                    "progress_pictures":1,
                    "profile.analytics.workouts_completed_count":1,
                    "profile.subscription_plan_type":1,
                    "profile.device_type":1,
                    "profile.subscribed_plan":1,
                    "profile.paid":1,
                    "profile.expire_date":1,
                    "profile.endPlan_date":1,
                    "profile.startPlan_date":1
                };
                model_user.find(conditions,fields).sort({joined_on:1}).toArray(function(err, analytics_data) {
                    if(err){
                        sendError(res, err);
                    }else if(!analytics_data) {
                        sendError(res, "Not found");
                    }else{
                        var filtered_labels1    = [];
                        if(analytics_data.length > 0){

                            var counter = 1;
                            var final_array         = [];
                            var labels              = {};


                            var total_users         = {};
                            var dwnld_users         = {};
                            var time_array          = [];

                            var filtered_subs_plan_label = {};
                            var subscribed_plan     = {};
                            var trail_data          = {};
                            var over_time           = {};
                            var subscription_type         = [];
                            var subscription_type1 = [];
                            var device_type = [];
                            analytics_data.forEach(function(item,ind){
                                var date_name = moment(new Date(item.joined_on)).format('MMM,DD');
                                var date_name1 = moment(new Date(item.joined_on)).format('YYYY-MM-DD');

                                labels[item.joined_on] =  item.joined_on;
                                var datetime1 = new Date(date_name1).getTime();
                                var datetime = new Date(date_name1).getTime();
                                time_array[datetime1] = {date:new Date(date_name1).getTime()};



                                // DEVICE TYPE
                                if(typeof item.profile.device_type !='undefined'){
                                    if(!subscription_type[datetime])
                                    subscription_type[datetime] = []


                                    if(item.profile.subscription_plan_type=='monthly' || item.profile.subscription_plan_type=='monthly_combo' || item.profile.subscription_plan_type=='monthly_exclusive'){
                                         var NumberofMonth = 1;
                                    }else if(item.profile.subscription_plan_type=='annually' || item.profile.subscription_plan_type=='annually_combo'){
                                         var NumberofMonth = 12;
                                    }else if(item.profile.subscription_plan_type=='quarterly' || item.profile.subscription_plan_type=='quaterly'){
                                         var NumberofMonth = 3;
                                    }else{
                                        var NumberofMonth = 1;
                                    }

                                    var startPlan_date = new Date(item.profile.startPlan_date);

                                    var new_end_date = moment(startPlan_date.setMonth( startPlan_date.getMonth() + NumberofMonth)).format('YYYY-MM-DD');

                                    if(item.profile.device_type=='web'){
                                        var endPlan_date = item.profile.endPlan_date
                                    }else if(item.profile.device_type=='Android'){
                                        if(item.profile.expire_date !='undefined'){
                                            var endPlan_date = item.profile.expire_date
                                        }else{
                                            var endPlan_date = new_end_date;
                                        }
                                   }else{
                                        if(item.profile.paid==2){
                                            var endPlan_date = item.profile.expire_date?item.profile.expire_date.substring(0, 10):"";
                                        }else{
                                            var endPlan_date = item.profile.endPlan_date
                                        }

                                    }
                                    if(endPlan_date > new_end_date){
                                        var subs_type = 'Recurring';
                                    }else{
                                        var subs_type = 'New';
                                    }
                                    device_type[item.profile.device_type] = item.profile.device_type;

                                    if(new_type== 'true' && recurring_type=='true'){
                                        subscription_type[datetime].push(item.profile.device_type);

                                    }else if(new_type == 'true' && (recurring_type=='false' || recurring_type=='')){
                                        //New
                                        if(endPlan_date <= new_end_date){
                                            subscription_type[datetime].push(item.profile.device_type);
                                        }
                                    }else if((new_type=='false' || new_type=='') && recurring_type=='true' ){
                                        //Recurring
                                        if(endPlan_date > new_end_date){
                                            subscription_type[datetime].push(item.profile.device_type);
                                        }
                                    }else{
                                        //New
                                        if(endPlan_date <= new_end_date){
                                            subscription_type[datetime].push(item.profile.device_type);
                                        }
                                    }
                                }

                                // OVERTIME DATA
                                if(!over_time[datetime1])
                                over_time[datetime1] = [];
                                if(item.profile.device_type != 'undefined'){
                                    if(item.profile.device_type=='iOS'){
                                        if(item.profile.endPlan_date !='undefined'){
                                            var overtime = new Date(item.profile.endPlan_date).getTime();
                                            var currenttm = new Date(current_date).getTime();
                                            if(overtime > currenttm){
                                                over_time[datetime1].push(1);
                                            }
                                        }
                                     }else if(item.profile.device_type=='Android' || item.profile.device_type=='web'){
                                        if(item.profile.expire_date !='undefined'){
                                            var overtime = new Date(item.profile.expire_date).getTime();
                                            var currenttm = new Date(current_date).getTime();
                                            if(overtime > currenttm){
                                                over_time[datetime1].push(1);
                                            }
                                        }
                                     }
                                }



                                //merging users list joining date wise
                                if(!total_users[date_name])
                                total_users[date_name] = []
                                total_users[date_name].push(item._id);


                                if(!dwnld_users[datetime1])
                                dwnld_users[datetime1] = []
                                dwnld_users[datetime1].push(item._id);

                                //analyticsArray[date_name] = [{label: 'Active users',data:total_users}];
                                var pic_array = item.progress_pictures;
                                var datetime = new Date(date_name1).getTime();



                                // SUBSCRIBED PLAN
                                if(typeof item.profile.subscribed_plan !='undefined' || typeof item.profile.paid !='undefined'){
                                    if(!subscribed_plan[datetime])
                                    subscribed_plan[datetime] = []
                                    if(item.profile.subscribed_plan==1 || item.profile.paid==2){
                                        subscribed_plan[datetime].push(parseInt(item.profile.subscribed_plan));
                                    }
                                }

                                //TRAIL DATA

                                if(typeof item.profile.paid !='undefined'){
                                    if(!trail_data[datetime])
                                    trail_data[datetime] = []
                                    if(item.profile.paid==1){
                                        trail_data[datetime].push(parseInt(item.profile.paid));
                                    }
                                }


                                if(counter ==analytics_data.length){


                                    var result = Object.keys(time_array).map(function(key) {
                                      return [Number(key), time_array[key]];
                                    });


                                    // DEVICE TYPE COUNTING
                                    for(var i = 0; i<result.length;i++){
                                        var pic_sum = subscription_type[result[i][0]];
                                        var timekey = result[i][0];
                                        if(!subscription_type1[timekey])
                                        subscription_type1[timekey] = []
                                        if(typeof pic_sum !='undefined'){
                                           subscription_type1[timekey] = pic_sum.reduce(function (obj, item) {
                                                var count = item;
                                                obj[count] = obj[count] || 0
                                                obj[count] = parseInt(obj[count])+1;
                                                return obj
                                            }, {})

                                        }




                                    }

                                    for(var kk in subscription_type1){
                                        subscription_type1.forEach(function(item,index){
                                            if(typeof subscription_type1[kk][item]=='undefined'){
                                                subscription_type1[kk][item] = 0;
                                            }
                                        })
                                    }
                                    var subscription_type2 = {}
                                    for(var kk in subscription_type1){
                                        for(var propt in subscription_type1[kk]){

                                            if(!subscription_type2[kk])
                                            subscription_type2[kk] = [];
                                            subscription_type2[kk].push({label:propt,data:[subscription_type1[kk][propt]]});
                                        }
                                    }

                                    var subscription_type3 = []
                                    var subscribed_plan1 = {};
                                    var trail_plan = {}; //trail_data
                                    var overtime = {}; //trail_data
                                    var total_dwnld = {}; //trail_data
                                    for(var i = 0; i<result.length;i++){
                                        var pic_sum = subscription_type2[result[i][0]];

                                        var timekey = result[i][0];
                                        if(typeof pic_sum !='undefined'){
                                            pic_sum.forEach(function(item,index){
                                                var data = item.data;
                                                var label = item.label;
                                                var pic_len = item.data.length;
                                                var data_sum = data.reduce(function(a, b) { return a + b; });
                                                var avg = Math.round(data_sum/pic_len);

                                                if(!subscription_type3[label])
                                                subscription_type3[label] = subscription_type3[label] || []
                                                subscription_type3[label].push(data_sum);
                                            })
                                        }

                                        //SUBSCRIBED PAID COUNT

                                        var pic_sum = subscribed_plan[result[i][0]];
                                        var timekey = result[i][0];

                                        if(!subscribed_plan1[timekey])
                                        subscribed_plan1[timekey] = []
                                        if(typeof pic_sum !='undefined' && pic_sum.length > 0){
                                           var data_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                            var pic_len = pic_sum.length;
                                            //var avg = Math.round(data_sum/pic_len);
                                            subscribed_plan1[timekey].push(data_sum);
                                        }else{
                                             subscribed_plan1[timekey].push(0);
                                        }
                                        //TRAIL COUNT

                                        var pic_sum = trail_data[result[i][0]];
                                        var timekey = result[i][0];

                                        if(!trail_plan[timekey])
                                        trail_plan[timekey] = []
                                        if(typeof pic_sum !='undefined' && pic_sum.length > 0){
                                           var data_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                            var pic_len = pic_sum.length;
                                            //var avg = Math.round(data_sum/pic_len);
                                            trail_plan[timekey].push(data_sum);
                                        }else{
                                             trail_plan[timekey].push(0);
                                        }

                                        var pic_sum = over_time[result[i][0]];
                                        var timekey = result[i][0];
                                        if(!overtime[timekey])
                                        overtime[timekey] = []
                                        if(typeof pic_sum !='undefined' && pic_sum.length > 0){
                                            //var data_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                            var pic_len = pic_sum.length;
                                            overtime[timekey].push(pic_len);
                                        }else{
                                            overtime[timekey].push(0);
                                        }

                                        //TOTAL DOWNLOADS COUNT

                                        var pic_sum = dwnld_users[result[i][0]];
                                        var timekey = result[i][0];
                                        if(!total_dwnld[timekey])
                                        total_dwnld[timekey] = []
                                        if(typeof pic_sum !='undefined' && pic_sum.length > 0){
                                            //var data_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                            var pic_len = pic_sum.length;
                                            total_dwnld[timekey].push(pic_len);
                                        }else{
                                            total_dwnld[timekey].push(0);
                                        }

                                    }


                                    var group_to_values_subs1 = {}
                                    var group_to_values_subs = Object.keys(subscription_type3).map(function(kk, ind) {
                                        var label = kk;
                                        var data  = subscription_type3[kk];
                                        var test = {};
                                        test[label] = test[label] || []
                                        test[label] = data;
                                        return test;
                                    })

                                    for(var kk in group_to_values_subs){
                                        for(var kk1 in group_to_values_subs[kk]){
                                            group_to_values_subs1[kk1] = group_to_values_subs[kk][kk1];
                                        }
                                    }





                                    // for(var i = 0; i<result.length;i++){
                                    //     var pic_sum = subscribed_plan[result[i][0]];
                                    //     var timekey = result[i][0];

                                    //     if(!subscribed_plan1[timekey])
                                    //     subscribed_plan1[timekey] = []
                                    //     if(typeof pic_sum !='undefined' && pic_sum.length > 0){
                                    //        var data_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                    //         var pic_len = pic_sum.length;
                                    //         //var avg = Math.round(data_sum/pic_len);
                                    //         subscribed_plan1[timekey].push(data_sum);
                                    //     }else{
                                    //          subscribed_plan1[timekey].push(0);
                                    //     }
                                    // }



                                    // for(var i = 0; i<result.length;i++){
                                    //     var pic_sum = trail_data[result[i][0]];
                                    //     var timekey = result[i][0];

                                    //     if(!trail_plan[timekey])
                                    //     trail_plan[timekey] = []
                                    //     if(typeof pic_sum !='undefined' && pic_sum.length > 0){
                                    //        var data_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                    //         var pic_len = pic_sum.length;
                                    //         //var avg = Math.round(data_sum/pic_len);
                                    //         trail_plan[timekey].push(data_sum);
                                    //     }else{
                                    //          trail_plan[timekey].push(0);
                                    //     }
                                    // }
                                    //OVERTIME COUNT


                                    // for(var i = 0; i<result.length;i++){
                                    //     var pic_sum = over_time[result[i][0]];
                                    //     var timekey = result[i][0];
                                    //     if(!overtime[timekey])
                                    //     overtime[timekey] = []
                                    //     if(typeof pic_sum !='undefined' && pic_sum.length > 0){
                                    //         //var data_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                    //         var pic_len = pic_sum.length;
                                    //         overtime[timekey].push(pic_len);
                                    //     }else{
                                    //         overtime[timekey].push(0);
                                    //     }
                                    // }



                                    // for(var i = 0; i<result.length;i++){
                                    //     var pic_sum = dwnld_users[result[i][0]];
                                    //     var timekey = result[i][0];
                                    //     if(!total_dwnld[timekey])
                                    //     total_dwnld[timekey] = []
                                    //     if(typeof pic_sum !='undefined' && pic_sum.length > 0){
                                    //         //var data_sum = pic_sum.reduce(function(a, b) { return a + b; });
                                    //         var pic_len = pic_sum.length;
                                    //         total_dwnld[timekey].push(pic_len);
                                    //     }else{
                                    //         total_dwnld[timekey].push(0);
                                    //     }
                                    // }


                                    filtered_subscribed = Object.keys(subscribed_plan1).map(function(kk, ind) {
                                        return subscribed_plan1[kk][0];
                                    })


                                    filtered_trail = Object.keys(trail_plan).map(function(kk, ind) {
                                        return trail_plan[kk][0];
                                    })
                                    filtered_dwnld = Object.keys(total_dwnld).map(function(kk, ind) {
                                        return total_dwnld[kk][0];
                                    })
                                    filtered_overtime = Object.keys(overtime).map(function(kk, ind) {
                                        return overtime[kk][0];
                                    })


                                    filtered_labels = Object.keys(labels).map(function(kk, ind) {
                                        return moment(new Date(labels[kk])).format('MMM,DD')
                                    })

                                    //making unique to date
                                    var uniqueIds = filtered_labels.reduce(function (obj, item) {
                                        obj[item] = item;
                                        return obj;
                                    }, {});

                                    //creating  array of dates as per graph format

                                    filtered_labels1 = Object.keys(uniqueIds).map(function(kk, ind) {
                                        return kk
                                    })




                                   filtered_labels2 = Object.keys(filtered_subs_plan_label).map(function(kk, ind) {
                                        return kk
                                    })



                                    var chart_data = {};
                                    chart_data['Trials'] = filtered_trail;
                                    chart_data['Usernames'] = filtered_dwnld;
                                    //chart_data['Overtime'] = filtered_overtime;
                                    var subsData = [];
                                    if(typeof group_to_values_subs1.iOS !='undefined'){
                                        var subscriber_array = group_to_values_subs1.iOS;

                                        for(var i=0;i<subscriber_array.length;i++){
                                            var iosval = parseInt(subscriber_array[i]);
                                            if(typeof group_to_values_subs1.Android =='undefined'){
                                                var andval = 0;
                                            }else{
                                                var andval = parseInt(group_to_values_subs1.Android[i]);
                                            }
                                            if(typeof group_to_values_subs1.web =='undefined'){
                                                var webval = 0;
                                            }else{
                                                var webval = parseInt(group_to_values_subs1.web[i]);
                                            }

                                            var subsval = (iosval+andval+webval);
                                            subsData[i] = subsval;
                                        }
                                    }

                                    chart_data['Subscribers'] = subsData;

                                    var group3 = Object.keys(chart_data).map(function (key) {

                                        var label = key;
                                        /*GENERATE RANDOM COLOR */
                                        var letters = '0123456789ABCDEF';
                                        var color = '#';
                                        // for (var i = 0; i < 6; i++) {
                                        //     color += letters[Math.floor(Math.random() * 16)];
                                        // }

                                        if(label=='Trials'){
                                            color += 'FAD000';
                                        }
                                        if(label=='Usernames'){
                                            color += '000000';
                                        }
                                        /*if(label=='Overtime'){
                                            color += '808080';
                                        }*/
                                        if(label=='Subscribers'){
                                            color += 'D3D3D3';
                                        }


                                       return {label: label, data: chart_data[key],fill: false,backgroundColor: color,borderColor:color};

                                    });
                                    if(recurring_type=='undefined' || typeof recurring_type==undefined){
                                        recurring_type = false;
                                    }else{
                                        recurring_type = recurring_type
                                    }

                                    sendSuccess(res, {
                                        labels:filtered_labels1,
                                        new_type:new_type,
                                        recurring_type:recurring_type,
                                        chart_3data:group3,
                                        date_range :{startDate:startDate,endDate:endDate}
                                    });
                                }
                                counter++;
                            })
                        }else{
                            var chart_3data = [];
                            if(recurring_type=='undefined' || typeof recurring_type==undefined){
                                recurring_type = false;
                            }else{
                                recurring_type = recurring_type
                            }
                            sendSuccess(res, {
                                labels:filtered_labels1,
                                chart_3data:chart_3data,
                                new_type:new_type,
                                recurring_type:recurring_type,
                                date_range :{startDate:startDate,endDate:endDate}
                            });
                        }
                    }
                })
            }
        })
    })
    /**
        ** CUSTOM CHART
    **/
    function getTotalFollower(user_id,callback){
        var model_follow = Model.load('userfollow', {}, function(err, model_follow){
            if(err){
                callback({status:false,message: "Failed to access db: " + err});
            }else{
                model_follow.find({following: user_id+"",status:1}).count(function(err,followerCount){
                     if (err) {
                        callback({status:false, message:"Failed to access db: " + err});
                    }else{
                        callback({status:true, message:"Success", totalFollower: followerCount});
                    }
                })
            }
        })
    }
    function getTotalFollowing(user_id,callback){
        var model_follow = Model.load('userfollow', {}, function(err, model_follow){
            if(err){
                callback({status:false,message:"Failed to access db: " + err});
            }else{
                model_follow.find({follower: user_id+"",status:1}).count(function(err,followingCount){
                    if (err) {
                        callback({status:false, message:"Failed to access db: " + err});
                    }else{
                        callback({status:true, message: "Success", totalFollowing: followingCount});
                    }
                })
            }
        })
    }
    function getTotalNotification(user_id,callback){

        var cond = {type:"push",sub_type:"new_challenge",read_status:'y',user_id:user_id};
        var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification) {
             if (err) {
                callback({status:false,message:"Failed to access db: " + err});
            }else{
                model_get_notification.find(cond).count(function(err,notificationCount){
                    if (err) {
                        callback({status:false,message:"Failed to access db: " + err});
                    }else{
                        callback({status:true,message:"Success",totalPushNotification:notificationCount});
                    }
                })
            }

        });
    }

    router.get('/get_custom_chart',function(req,res,next){
        var trainer_id      = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var moment = require('moment');
        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            }else{
                var current_date = new Date() // get current date
                // var thirtydaysbeforeDate = new Date().setDate(current_date.getDate()- 1000)
                // var todayDate = current_date.setDate(current_date.getDate() - 1)
                var thirtydaysbeforeDate = moment(new Date(current_date.getFullYear(), current_date.getMonth(), 1)).format('YYYY-MM-DD');
                var todayDate = moment(new Date(current_date.getFullYear(), current_date.getMonth() + 1, 0)).format('YYYY-MM-DD');

                /**************PAGING CONDITIONS ********/
                var perpage = parseInt(req.query.perpage) || 10;
                var page_no = parseInt(req.query.page_no) || 1;

                var pagequery = {}
                pagequery.skip = perpage * (page_no - 1)
                pagequery.limit = perpage



                var start = parseInt(req.query.start);
                var limit = parseInt(req.query.length);
                var draw = parseInt(req.query.draw);

                if(typeof req.query.order !='undefined'){
                    if(req.query.order[0]['column']==0){
                        var order = req.query.order[0]['dir']=='asc'?-1:1;
                        var sortby = {'email':order}
                    }else if(req.query.order[0]['column']==5){
                        var order = req.query.order[0]['dir']=='asc'?-1:1;
                        var sortby = {'usercommunity_screen_count':order}

                    }
                }else{
                    var sortby = {'email': -1}
                }


                /**************PAGING CONDITIONS ********/
                var date_range = req.query.columns[3].search.value.split(" - ");


                if(req.query.columns[3].search.value !='' && date_range.length==2){
                    var sdate = date_range[0];
                    var edate = date_range[1];

                    var startDate   = new Date(sdate).getTime()+"";
                    var endDate     = new Date(edate).getTime()+"";
                }else{
                    var startDate   = new Date(thirtydaysbeforeDate).getTime()+"";
                    var endDate     = new Date(todayDate).getTime()+"";
                }
                var conditions = {};

                if(req.query.columns[4].search.value !=''){
                    var filter_type = req.query.columns[4].search.value;
                    if(filter_type.slice(-4)=='date'){
                        conditions["profile.analytics."+filter_type] = {$gte: startDate,$lte: endDate}
                    }else{
                        conditions["profile.analytics."+filter_type] = {$gt:0}
                    }

                }else {
                    conditions.$or = [
                    {'profile.analytics.circuit_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.overview_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.beforeAfter_Shared_AppCommunity_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.progress_screen_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.exit_workout_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.usercommunity_screen_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.exercise_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.appcommunity_screen_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.share_button_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.single_Shared_UserCommunity_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.overview_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.beforeAfter_Shared_UserCommunity_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.skip_circuit_date': { $gte: startDate,$lte: endDate}
                    },
                    {'profile.analytics.complete_screen_date': { $gte: startDate,$lte: endDate}
                    },
                    {"profile.analytics.subscription_screen_lastviewed_date": { $gte: startDate,$lte: endDate}
                    }
                ]
                }
                if (req.query.search.value) {
                    conditions.$or = [{
                        "profile.name": new RegExp('^' + req.query.search.value + '.*$', "i")
                    }, {
                        email: new RegExp('^' + req.query.search.value + '.*$', "i")
                    }];
                }
                conditions.trainer_id = trainer_id;


                var fields = {
                    "profile.name": 1,
                    "email":1,
                    "profile.analytics": 1,
                    "progress_pictures":1
                };
                model_user.find(conditions).count(function(err,totalusers){
                    if(err){
                        sendError(res, "Failed to access db: " + err);
                    }else{
                        //return false;
                        model_user.find(conditions,fields).skip(start).limit(limit).sort(sortby).toArray(function(err, analytics_data) {
                            if(err){
                                sendError(res, err);
                            }else if(!analytics_data) {
                                sendError(res, "Not found");
                            }else{
                                if(analytics_data.length > 0){
                                    var counter = 1;
                                    var analyticsArray      = []
                                    var final_array = {};
                                    var progress_pictures_array = {};
                                    var total_follower_array = {};
                                    var total_following_array = {};
                                    var total_push_notification_array = {};
                                    /* total follower and following */
                                    analytics_data.forEach(function(item,ind){
                                        var analyticsData = item;
                                        getTotalFollower(item._id,function(ResponseFollower){
                                            getTotalFollowing(item._id,function(ResponseFollowing){
                                                getTotalNotification(item._id,function(ResponseNotification){
                                                    var totalFollower = ResponseFollower.totalFollower;
                                                    var totalFollowing = ResponseFollowing.totalFollowing;
                                                    var user_name = item.email;

                                                    total_follower_array[user_name] = totalFollower;
                                                    total_following_array[user_name] = totalFollowing;
                                                    total_push_notification_array[user_name] = ResponseNotification.totalPushNotification;

                                                    var progress_pictures = item.progress_pictures.length;


                                                    //final_array[user_name] = analyticsArray;
                                                    progress_pictures_array[user_name] = progress_pictures;
                                                    if(counter ==analytics_data.length){
                                                        var data  = []

                                                        sendSuccess(res, {
                                                            data:analytics_data,
                                                            user_name:user_name,
                                                            progress_pictures_array:progress_pictures_array,
                                                            recordsTotal:totalusers,
                                                            recordsFiltered:totalusers,
                                                            draw:draw,
                                                            total_follower_array:total_follower_array,
                                                            total_following_array:total_following_array,
                                                            total_push_notification:total_push_notification_array,
                                                            date_range :{startDate:startDate,endDate:endDate}
                                                        });
                                                    }
                                                    counter++
                                                })
                                            })
                                        });
                                    })
                                }else{

                                    var final_array = [];
                                    sendSuccess(res, {
                                        data:final_array,
                                        recordsTotal:totalusers,
                                        recordsFiltered:totalusers,
                                        draw:draw,
                                        date_range :{startDate:startDate,endDate:endDate}
                                    });
                                }

                            }
                        })
                    }
                })
            }
        })

    })

    /*   GRAPH API'S END HERE */

    /**
        ** App Analytics
    **/
    router.get('/get_app_analytics',function(req,res,next){

        var trainer_id      = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var moment = require('moment');

        var DateArray = new Array();
        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var analyticsArray      = []
                var DateArray1          = []

                var current_date = new Date() // get current date
                var thirtydaysbeforeDate = new Date().setDate(current_date.getDate()-120)
                var todayDate = current_date.setDate(current_date.getDate() - 1)

                var startDate   = moment(new Date(thirtydaysbeforeDate)).format('MMMM DD, YYYY')
                var endDate     = moment(new Date(todayDate)).format('MMMM DD, YYYY')

                var conditions = { "profile.analytics.circuit_date" : {$lte: endDate} }

                conditions.trainer_id = trainer_id;


                var fields = {
                    "profile.name": 1,
                    "profile.analytics": 1
                };

                model_user.find(conditions,fields).toArray(function(err, analytics_data) {
                    if (err) {
                        sendError(res, err);
                    } else if (!analytics_data) {
                        sendError(res, "Not found");
                    } else {
                        var filtered_labels = [];
                        var grouped_data = [];

                        analytics_data.forEach(function(item,ind){
                            var analyticsData = item.profile.analytics;
                            for(var key in analyticsData) {
                                if(typeof analyticsData[key]==='string' && analyticsData[key] !='WEEK 1 | DAY 5'){

                                    DateArray.push(new Date(analyticsData[key]).getTime())
                                    DateArray1.push(analyticsData[key])
                                }

                                var date_fields = key.replace("_count", "_date");
                                if((typeof analyticsData[key]==='number' && analyticsData[key] > 0) ){
                                    if(analyticsData[date_fields] !==undefined){
                                        var last_visit_date  = analyticsData[date_fields];
                                        var strtotime = new Date(last_visit_date).getTime()
                                        analyticsArray.push({label: key,strtotime:strtotime,last_visit_date:last_visit_date,data:analyticsData[key]})
                                    }
                                }
                            }

                            /* MAKING UNIQUE ARRAY */
                            var uniqueArray = DateArray.filter(function(elem, pos) {
                                return DateArray.indexOf(elem) == pos;
                            })

                            /* MAKING ARRAY SORTING */
                            uniqueArray.sort();

                            filtered_labels = Object.keys(uniqueArray).map(function(kk, ind) {
                                return moment(new Date(uniqueArray[kk])).format('MMM,DD')
                            })

                            sorted_dates = Object.keys(uniqueArray).map(function(kk, ind) {
                                return moment(new Date(uniqueArray[kk])).format('MMMM DD, YYYY')
                            })

                        })
                        var matched_data = analyticsArray.reduce(function (obj, item) {
                            obj[item.label] = obj[item.label] || []
                            obj[item.label].push(item.data)
                            return obj
                        }, {})

                        /* AYYAY DIFFERENCE*/
                        Array.prototype.diff = function(a) {
                            return this.filter(function(i) {return a.indexOf(i) < 0;})
                        }
                        /* push defaul data*/
                        var diff_arr = Object.keys(matched_data).map(function (key) {
                            arr1 = matched_data[key];
                            var difference = sorted_dates.diff( arr1 );

                            difference.forEach(function(item,ind){
                                var strtotime = new Date(item).getTime()
                                analyticsArray.push({label: key,strtotime:strtotime,last_visit_date:item,data: 0})
                            })
                        })
                        /* final array sort by date*/
                        analyticsArray.sort(function(a, b){
                            var keyA = new Date(a.strtotime),
                                keyB = new Date(b.strtotime);
                            // Compare the 2 dates
                            if(keyA < keyB) return -1
                            if(keyA > keyB) return 1
                            return 0
                        })


                        var group_to_values = analyticsArray.reduce(function (obj, item) {
                            obj[item.label] = obj[item.label] || []
                            obj[item.label].push(item.data)
                            return obj
                        }, {})

                        var incr = 0;
                        var groups = Object.keys(group_to_values).map(function (key) {
                            /*GENERATE RANDOM COLOR */
                            var letters = '0123456789ABCDEF';
                            var color = '#';
                            for (var i = 0; i < 6; i++) {
                                color += letters[Math.floor(Math.random() * 16)];
                            }

                            return {label: key, data: group_to_values[key],fill: false,backgroundColor: color,borderColor:color};

                        });

                        sendSuccess(res, {
                            analytics: groups,
                            labels:filtered_labels,
                            analytics_data:analytics_data,
                            date_range :{startDate:startDate,endDate:endDate}
                        });
                    }
                })
            }
        })
    })

    router.get('/get_userz', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var start = req.query.start || '';
        var end = req.query.end || '';
        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    // excluding wegile emails...
                    //email: /^((?!wegile).)*$/i
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                conds.joined_on = {
                    $lte: todaytimestamp(),
                    $gte: thirtyDaysBefore()
                };

                if (start && end) {
                    conds.joined_on = {
                        $lte: parseInt(end),
                        $gte: parseInt(start)
                    };
                }
                var fields = {
                    "profile.name": 1,
                    "joined_on": 1,
                    "profile.longitude":1,
                    "profile.latitude":1
                };
                model_user.find(conds, fields).sort({
                    'joined_on': 1
                }).toArray(function(err, all_users) {
                    if (err) {
                        sendError(res, "Failed to retrieve users: " + err);
                    } else {
                        var grouped_data = {};
                        var positions_array = [];
                        all_users.forEach(function(user, ind) {
                            if (user.profile.latitude && user.profile.longitude) {
                                var positions = [ parseFloat(user.profile.latitude), parseFloat(user.profile.longitude) ];
                                positions_array.push(positions);
                            }
                            grouped_data[toDate(user.joined_on)] = typeof grouped_data[toDate(user.joined_on)] != 'undefined' ? grouped_data[toDate(user.joined_on)] + 1 : 1;
                        });
                        var filtered_labels = Object.keys(grouped_data).map(function(kk, ind) {
                            return (new Date(kk)).toJSON().substring(0, 10);
                        });
                        var filtered_data = Object.keys(grouped_data).map(function(kk, ind) {
                            return grouped_data[kk];
                        });
                        sendSuccess(res, {
                            labels: filtered_labels,
                            users: filtered_data,
                            all_users: all_users.length,
                            positions: positions_array
                        });
                    }
                });
            }
        });
    });

    /**
    	@@ All User Count
    	@@ available in the database
    **/

    router.get('/all_users', function(req, res, next) {
        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    // excluding wegile emails...
                    //email: /^((?!wegile).)*$/i
                }
                var conditions = {}
                conditions.$or = [{
                    "profile.paid": "2",
                    $or: [{
                        "profile.startPlan_date": {
                            "$exists": true
                        }
                    }, {
                        "profile.expire_date": {
                            "$exists": true
                        }
                    }]
                }, {
                    "profile.paid": {
                        $not: {
                            "$exists": true
                        }
                    },
                    "profile.subscribed_plan": "1",
                    $or: [{
                        "profile.startPlan_date": {
                            "$exists": true
                        }
                    }, {
                        "profile.subscription_plan_type": {
                            "$exists": true
                        }
                    }]
                }];
                var _loadSubscribedUsers = function(callback){
                    model_user.find(conditions)
                                .count(callback)
                }
                model_user.find(conds).count(function(err, users) {
                    if (err) {
                        sendError(res, "Failed to retrieve users: " + err)
                    } else {
                        _loadSubscribedUsers(function(err, subscribed) {
                            if(err) sendError(res, "Failed to retrieve users: " + err)
                            else sendSuccess(res, {users: users, subscribed: subscribed})
                        })
                    }
                });
            }
        });
    });

    /**
    	@@ Email Templates
    	@@ input trainer_id
    **/

    router.get('/email_templates', function(req, res, next) {

        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;

        var model_email_template = Model.load('traineremailtemplate', {}, function(err, model_email_template) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_email_template.find(conds).sort({
                    'created_at': -1
                }).toArray(function(err, email_templates) {
                    if (err) {
                        sendError(res, "Failed to retrieve email templates: " + err);
                    } else {
                        sendSuccess(res, {
                            email_templates: email_templates
                        });
                    }
                });
            }
        });
    });

    router.post('/email_template/:id', function(req, res, next) {
        var et = req.body.email_template;
        var id = req.params.id;
        var replace = req.body.replace || false;

        if (req.trainer_id && et.trainer_id && req.trainer_id != et.trainer_id) {
            return sendError(res, "Not authorized to update this email template");
        }

        if (!et.trainer_id && req.trainer_id) {
            et.trainer_id = req.trainer_id;
        }
        var model_email_template = Model.load('traineremailtemplate', {}, function(err, model_email_template) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_email_template.find(conds).limit(1).next(function(err, email_template) {
                    if (err) {
                        sendError(res, err);
                    } else if (!email_template) {
                        sendError(res, "Not found");
                    } else {

                        if (!replace) {
                            _.defaults(et, email_template);
                            delete et._id;
                        }

                        if (model_email_template.verify(et)) {
                            model_email_template.updateOne(conds, {
                                $set: et
                            }, {}, function(err, updated_email_template) {
                                if (err) {
                                    sendError(res, "Failed to update record: " + err);
                                } else {
                                    sendSuccess(res, {
                                        res: updated_email_template,
                                        email_template: et
                                    });
                                }
                            });
                        } else {
                            sendError(res, "Invalid email template");
                        }
                    }
                });

            }
        });
    });

    /**
    	@@Send EMail to Inactive Users
    	@@Send EMail after 48 hours when user signs up
    	@@Send EMail for Last Month Inactive or Trial Users
    **/

    var __sendEmailToUsers = function(user_type, trainer_id, subject, message) {

        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                console.error("Failed to access db: " + err);
            } else {

                var conditions = {
                    // excluding wegile emails...
                    email: /^((?!wegile).)*$/i
                };

                if (trainer_id) {
                    conditions.trainer_id = trainer_id;
                }

                if (user_type == "inactive") { // All Inactive users

                    conditions.$or = [{
                        "profile.startPlan_date": {
                            $not: {
                                "$exists": true
                            }
                        },
                        "profile.expire_date": {
                            $not: {
                                "$exists": true
                            }
                        },
                        "profile.subscription_plan_type": {
                            $not: {
                                "$exists": true
                            }
                        }
                    }, {
                        "profile.paid": "0"
                    }];

                } else if (user_type == "after_48hours") { // after 48 hours when user signs up

                    var start = (new Date()).getTime() - (72 * 60 * 60 * 1000);
                    var end = (new Date()).getTime() - (48 * 60 * 60 * 1000);
                    conditions.joined_on = {
                        "$lte": end,
                        "$gt": start
                    };

                } else if (user_type == "last_month_inactive") { // Last Month Inactive or Trial Users
                    var sixtyDaysBefore = (new Date()).getTime() - (60 * 24 * 60 * 60 * 1000);
                    conditions.joined_on = {
                        $lte: thirtyDaysBefore(),
                        $gte: sixtyDaysBefore
                    };
                    conditions.$or = [{
                        "profile.paid": "1",
                        $or: [{
                            "profile.startPlan_date": {
                                "$exists": true
                            }
                        }, {
                            "profile.expire_date": {
                                "$exists": true
                            }
                        }]
                    }, {
                        "profile.paid": {
                            $not: {
                                "$exists": true
                            }
                        },
                        "profile.subscribed_plan": "0",
                        $or: [{
                            "profile.subscription_plan_type": {
                                "$exists": true
                            }
                        }, {
                            "profile.startPlan_date": {
                                "$exists": true
                            }
                        }]
                    }];
                }

                var fields = {
                    "profile.name": 1,
                    "email": 1,
                };

                model_user.find(conditions, fields).sort({
                    'joined_on': -1
                }).toArray(function(err, all_users) {
                    if (err) {
                        console.error("Failed to retrieve users: " + err);
                    } else {
                        if (all_users && all_users.length) {
                            all_users.forEach(function(user) {

                                mailer.sendMail({
                                    to: user.email,
                                    subject: subject,
                                    html: message
                                });

                            });

                        }
                    }

                });

            }
        });

    };


    /**
        @@ Custom Coaching Module
    **/
    /** ---------------------------------------**/

    // View User Detail

    function convertToHumanate(timestamp){

         // Months array
         var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

         // Convert timestamp to milliseconds
         var date = new Date(timestamp);

         // Year
         var year = date.getFullYear();

         // Month
         var month = months_arr[date.getMonth()];

         // Day
         var day = date.getDate();

        // Display date time in MM-dd-yyyy h:m:s format
        var convdataTime = month+'-'+day+'-'+year;

        return convdataTime;

    }

    router.get('/user_detail/:user_id', function(req, res, next) {
        var model_user = Model.load('user', {}, function(err, model_user) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var fields = {
                    "profile": 1,
                    "email": 1,
                    "facebook_id": 1,
                    "google_id": 1,
                    "nutrition_subscription": 1,
                    "joined_on": 1,
                    "subscription": 1,
                    "os_type": 1
                }
                model_user.find({
                    _id: Model.ObjectID(req.params.user_id)
                }, fields).limit(1).next(function(err, user_detail) {
                    if (err) {
                        sendError(res, "Failed to retrieve user_detail: " + err);
                    } else if (!user_detail) {
                        sendError(res, "Not found");
                    } else {

                        user_detail.last_seen = (typeof user_detail.profile.last_seen != "undefined") ? toDateAndTime(user_detail.profile.last_seen) : "N/A";
                        var last_completed_workout = _getLastCompletedWorkout(user_detail); // Get Last Completed Workout
                        user_detail.last_completed_workout = last_completed_workout?("Week"+last_completed_workout.week+" Day"+last_completed_workout.weekday):"No Workout";

                        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
                        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
                            if (err) {
                                sendError(res, "Failed to access db: " + err);
                            } else {
                                var conds = { type: { $ne: 'custom'} };
                                if (trainer_id) {
                                    conds.trainer_id = trainer_id;
                                }
                                var user_id = Model.ObjectID(req.params.user_id);
                                var conditions = { type: "custom", trainer_id: trainer_id, user_id: user_id }
                                model_tp.find(conditions).sort({sort_order: 1}).toArray(function(err, customplans) {
                                    if (err) {
                                        sendError(res, "Failed to retrieve custom plans: " + err);
                                    } else {
                                        var model_workout_notes = Model.load('workoutnotes', {}, function(err, model_workout_notes) {
                                            if (err) {
                                                sendError(res, "Failed to access db: " + err);
                                            } else {
                                                var model_workout = Model.load('workout', {}, function(err, model_workout) {
                                                    model_workout.find({user_id: user_id, user_reps_tracking: {$exists: true}}).sort({"user_reps_tracking.changed_on": -1}).limit(1).next(function(err, user_reps_tracking) {
                                                        model_workout.find({user_id: user_id, user_weight_tracking: {$exists: true}}).sort({"user_weight_tracking.changed_on": -1}).limit(1).next(function(err, workout_weight_tracking) {
                                                            model_workout_notes.find({user_id: req.params.user_id, posted_by: 'user'}).sort({created_at: -1}).limit(1).next(function(err, workout_notes) {
                                                                var all_events_notifications = [];

                                                                var lastItem1 = "";
                                                                var lastItem2 = "";
                                                                if(workout_weight_tracking && workout_weight_tracking.user_weight_tracking && workout_weight_tracking.user_weight_tracking.length){
                                                                    lastItem1 = workout_weight_tracking.user_weight_tracking[workout_weight_tracking.user_weight_tracking.length -1];
                                                                    if(lastItem1) {
                                                                        lastItem1.created_at = lastItem1.changed_on;
                                                                        lastItem1.date_time = convertToHumanate(lastItem1.created_at);
                                                                        lastItem1.workout_name = workout_weight_tracking.label;
                                                                        lastItem1.type = "weight";
                                                                        // lastItem1.message = lastItem1.date_time + " added new weight to exercise "+workout_weight_tracking.label+ ": "+lastItem1.user_weight;
                                                                        all_events_notifications.push(lastItem1);
                                                                    }
                                                                }
                                                                if(user_reps_tracking && user_reps_tracking.user_reps_tracking && user_reps_tracking.user_reps_tracking.length){
                                                                    lastItem2 = user_reps_tracking.user_reps_tracking.pop();
                                                                    if(lastItem2) {
                                                                        lastItem2.created_at = lastItem2.changed_on;
                                                                        lastItem2.date_time = convertToHumanate(lastItem2.created_at);
                                                                        lastItem2.workout_name = user_reps_tracking.label;
                                                                        lastItem2.type = "reps";
                                                                        // lastItem2.message = lastItem2.date_time + " added new reps to exercise "+user_reps_tracking.label+ ": "+lastItem2.user_repeat;
                                                                        all_events_notifications.push(lastItem2);
                                                                    }
                                                                }
                                                                if(workout_notes) {
                                                                    workout_notes.date_time = convertToHumanate(workout_notes.created_at);
                                                                    workout_notes.message = workout_notes.date_time + " added new note to exercise :'"+workout_notes.notes+"'";
                                                                    workout_notes.type= "notes";
                                                                    all_events_notifications.push(workout_notes);
                                                                }

                                                                all_events_notifications.sort(function(a,b) {
                                                                    return (a.created_at < b.created_at) ? 1 : ((b.created_at < a.created_at) ? -1 : 0);
                                                                });

                                                                var model_question = Model.load('question', {}, function(err, model_question) {
                                                                    if (err) {
                                                                        sendError(res, "Failed to access db: " + err);
                                                                    } else {
                                                                        var model_user_question_answer = Model.load('user_question_answer', {}, function(err, model_user_question_answer) {
                                                                            if (err) {
                                                                                sendError(res, "Failed to access db: " + err);
                                                                            } else {
                                                                                var model_questioncategory = Model.load('questioncategory', {}, function(err, model_questioncategory) {
                                                                                    if (err) {
                                                                                        sendError(res, "Failed to access db: " + err);
                                                                                    } else {

                                                                                        var __loadQuestionTag = function(condition, callback){
                                                                                            model_questioncategory.findOne(condition, {"label":1}, function(err, dbres) {
                                                                                                if (err) {
                                                                                                    callback(err)
                                                                                                } else {
                                                                                                    callback(undefined, dbres)
                                                                                                }
                                                                                            });
                                                                                        }

                                                                                        var conds = {};

                                                                                        if (trainer_id) {
                                                                                            conds.trainer_id = trainer_id;
                                                                                        }

                                                                                        var sortOrder = { 'index': 1 }

                                                                                        model_question.find(conds).sort(sortOrder).toArray(function(err, dbres) {
                                                                                            if (err) {
                                                                                                sendError(res, "Failed to retrieve data for question : " + err)
                                                                                            } else {
                                                                                                var failed_user_answer = [], succeeded_user_answer = [];
                                                                                                var questionTagDone = 0
                                                                                                if(dbres && dbres.length) {
                                                                                                    dbres.forEach(function(question, ind){
                                                                                                        var conditions = { question_id: question._id, user_id: Model.ObjectID(user_id) }
                                                                                                        model_user_question_answer.find(conditions).limit(1).next(function(err, useranswer) {
                                                                                                            if(err) {
                                                                                                                failed_user_answer.push(err)
                                                                                                            }else{
                                                                                                                succeeded_user_answer.push("success");
                                                                                                                dbres[ind].user_answer = useranswer?useranswer.user_answer:"";
                                                                                                                if(typeof question.question_tag!='undefined' && question.question_tag) {
                                                                                                                    var conditions2 = {_id: new Model.ObjectID(question.question_tag) }
                                                                                                                    __loadQuestionTag(conditions2, function(error, response){
                                                                                                                        questionTagDone++;
                                                                                                                        dbres[ind].question_tag = response?response:"";
                                                                                                                        if((failed_user_answer.length + succeeded_user_answer.length) >= dbres.length &&  questionTagDone == dbres.length ){
                                                                                                                            sendSuccess(res, {
                                                                                                                                questions: dbres,
                                                                                                                                customplans: customplans,
                                                                                                                                user_detail: user_detail,
                                                                                                                                all_events_notifications: all_events_notifications
                                                                                                                            })
                                                                                                                        }
                                                                                                                    })
                                                                                                                }else{
                                                                                                                    questionTagDone++;
                                                                                                                    dbres[ind].question_tag = "";
                                                                                                                    if((failed_user_answer.length + succeeded_user_answer.length) >= dbres.length &&  questionTagDone == dbres.length ){
                                                                                                                        sendSuccess(res, {
                                                                                                                            questions: dbres,
                                                                                                                            customplans: customplans,
                                                                                                                            user_detail: user_detail,
                                                                                                                            all_events_notifications: all_events_notifications
                                                                                                                        })
                                                                                                                    }
                                                                                                                }
                                                                                                            }

                                                                                                        })
                                                                                                    })
                                                                                                }else{
                                                                                                    sendSuccess(res, {
                                                                                                        questions: dbres,
                                                                                                        customplans: customplans,
                                                                                                        user_detail: user_detail,
                                                                                                        all_events_notifications: all_events_notifications
                                                                                                    })
                                                                                                }
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                })
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })

    /**
        @@ Copy Custom Plan
    **/

    router.put('/custom_plan', function(req, res, next) {
        var exer = req.body.plan;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this plan")
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id
        }


        var model_plan = Model.load('trainerplan', {}, function(err, model_plan) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conditions = { _id: Model.ObjectID(exer.copyFrom), trainer_id: exer.trainer_id };

                model_plan.find(conditions).limit(1).next(function(err, trainerplanInfo) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plan: " + err);
                    } else if (!trainerplanInfo) {
                        sendError(res, "Not found");
                    } else {
                        delete trainerplanInfo._id;
                        trainerplanInfo.type = "custom";
                        trainerplanInfo.assigned = false;
                        trainerplanInfo.user_id = Model.ObjectID(exer.user_id);
                        trainerplanInfo.start_date = new Date(exer.start_date).getTime()
                        trainerplanInfo.end_date = new Date(exer.end_date).getTime()

                        model_plan.insertOne(trainerplanInfo, {}, function(err, saved_plan) {
                            if (err) {
                                sendError(res, "Failed to insert record: " + err);
                            } else {

                                // now copy all workoutdays from existing plan
                                var model_workout = Model.load('workout', {}, function(err, model_workout) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {

                                        var copyExercise0 = function(w, callback) {
                                            delete w._id;
                                            w.label = w.label.replace(/\s+$/, '');
                                            if(w.type=="exercise") w.sets = "0"; // don't copy set if workout is exercise
                                            w.user_id = Model.ObjectID(exer.user_id);
                                            w.created_at = (new Date()).getTime();
                                            w.updated_at = (new Date()).getTime();
                                            //if (typeof exer.is_alternate != "undefined") w.is_alternate = exer.is_alternate;
                                            model_workout.insert(w, function(err, res) {
                                                if (err) {
                                                    callback(err);
                                                } else {

                                                    callback(undefined, w);
                                                }
                                            });
                                        };

                                        var copyExercise = function(workout, callback) {
                                            if (workout.alternates && workout.alternates.length) {
                                                var alternatesIds = [];
                                                var invalidalternates = [];
                                                workout.alternates.forEach(function(wc) {
                                                    if (!wc || wc.length != 24) {
                                                        invalidalternates.push(wc);
                                                        if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                                            workout.alternates = alternatesIds;
                                                            copyExercise0(workout, callback);
                                                        }
                                                    } else {

                                                        copyWorkout(wc, function(err, nW) {
                                                            if (err) {
                                                                //callback(err);
                                                                invalidalternates.push(wc);
                                                            } else {
                                                                alternatesIds.push(nW._id + "");
                                                            }
                                                            if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                                                workout.alternates = alternatesIds;
                                                                copyExercise0(workout, callback);
                                                            }
                                                        });
                                                    }

                                                });
                                            } else {
                                                copyExercise0(workout, callback);
                                            }
                                        };

                                        var copyWorkout = function(w, callback) {
                                            model_workout.findOne({
                                                "_id": Model.ObjectID(w)
                                            }, {}, function(err, workout) {
                                                if (err) {
                                                    callback(err);
                                                    return;
                                                } else if (!workout) {
                                                    return callback("Not found");
                                                }
                                                if (workout.type == 'group' && workout.children && workout.children.length) {
                                                    var childrenIds = [];
                                                    var invalidChildren = [];
                                                    var _saveChildren = function(i){
                                                        if(i>=workout.children.length){
                                                            workout.children = childrenIds;
                                                            copyExercise(workout, callback);
                                                        }else{
                                                            if(!workout.children[i] || workout.children[i].length != 24){
                                                                invalidChildren.push(workout.children[i]);
                                                                _saveChildren(i+1);
                                                            }else{
                                                                copyWorkout(workout.children[i], function(err, nW){
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
                                                    copyExercise(workout, callback);
                                                }
                                            });

                                        };

                                        var copyWorkoutday = function(wday, WorkoutDay, callback){
                                            copyWorkout(wday.workout, function(err, newWorkout){
                                                if(newWorkout){
                                                    delete wday._id;
                                                    wday.workout = newWorkout._id+"";
                                                    wday.plan_id = trainerplanInfo._id+"";
                                                    wday.plan_type = "custom";
                                                    wday.user_id = Model.ObjectID(exer.user_id);
                                                    WorkoutDay.insert(wday, function(err, res) {
                                                        if (err) {
                                                            callback(err);
                                                        } else {
                                                            callback(undefined, wday);
                                                        }
                                                    })
                                                }else{
                                                    callback("Failed copying workout day: "+wday._id+", "+err);
                                                }
                                            })
                                        }

                                        Model.load('workoutday', {}, function(err, model_workoutday){

                                            if(err){
                                               sendError(res, "Error: "+err);
                                            }

                                            if(model_workoutday){
                                                var conditions2 = { plan_id: exer.copyFrom, trainer_id: exer.trainer_id };
                                                // Now fetch copyFrom week
                                                model_workoutday.find(conditions2).toArray(function(err, workoutdays) {
                                                    var savedWorkoutdays = 0;
                                                    var savedDayData = [];
                                                    var invalidSavedDayData = [];
                                                    if(err){
                                                        sendError(res, "An error occured in workout day: " +err);
                                                    }
                                                    if(workoutdays && workoutdays.length)
                                                    {
                                                        workoutdays.forEach(function(wday){

                                                            copyWorkoutday(wday, model_workoutday, function(err, newwday){
                                                                if(newwday){
                                                                    savedDayData.push(newwday._id);
                                                                }else{
                                                                    invalidSavedDayData.push(wday._id);
                                                                }

                                                                if (++savedWorkoutdays >= workoutdays.length) {

                                                                        sendSuccess(res, { success_days: savedDayData, failed:invalidSavedDayData, new_plan: trainerplanInfo   });
                                                                    }
                                                            })
                                                        })
                                                    }else{
                                                        sendSuccess(res, { success_days: [], failed:[], new_plan: trainerplanInfo   });
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })

    // Get Custom Plan Data

    router.get('/customplan/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var app_version = req.query.app_version || 0;
        var webapp = req.query.webapp || 0;
        var without_workout = req.query.without_workout || false;
        var user_id = req.query.user_id || false;
        if(!user_id) {
            sendError(res, "Failed to retrieve trainer plan" );
        }
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conditions.trainer_id = trainer_id;
                }
                conditions.user_id= Model.ObjectID(user_id);
                conditions.type = "custom";
                model_tp.find(conditions).limit(1).next(function(err, trainerplan) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plan: " + err);
                    } else if (!trainerplan) {
                        sendError(res, "Not found");
                    } else {

                        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
                            if (err) {
                                sendError(res, "Failed to access db: " + err);
                            } else {
                                var conds2 = {
                                    plan_id: trainerplan._id + ""
                                };
                                if (!webapp) {

                                }

                                model_workoutday.find(conds2).sort({
                                    week: 1,
                                    weekday: 1,
                                    sort_order: 1
                                }).toArray(function(err, workoutdays) {
                                    if (err) {
                                        sendError(res, "Failed to retrieve workout days: " + err);
                                    } else {
                                        if (workoutdays.length) {
                                            if (without_workout) {
                                                trainerplan.workoutdays = workoutdays;
                                                return sendSuccess(res, {
                                                    plan: trainerplan,
                                                });
                                            }
                                            var model_workout = Model.load('workout', {}, function(err, model_workout) {
                                                if (err) {
                                                    return sendError(res, "DB connection failed: " + err);
                                                }
                                                var loadedWorkouts = 0;
                                                for (var wdi = 0; wdi < workoutdays.length; wdi++) {
                                                    (function(wdi) {
                                                        model_workout.loadWorkout(workoutdays[wdi].workout, function(err, w) {
                                                            if (err) {
                                                                return sendError(res, "Failed to retrieve workout details: " + err);
                                                            }
                                                            workoutdays[wdi].workout = w;
                                                            if (++loadedWorkouts >= workoutdays.length) {
                                                                trainerplan.workoutdays = workoutdays;
                                                                sendSuccess(res, {
                                                                    plan: trainerplan
                                                                });
                                                            }
                                                        });
                                                    })(wdi);
                                                }
                                            });
                                        } else {
                                            trainerplan.workoutdays = workoutdays;
                                            sendSuccess(res, {
                                                plan: trainerplan
                                            });
                                        }

                                    }
                                });
                            }
                        });

                    }
                })
            }
        })
    })

    // Assign to User Plan

    router.post('/assign_custom_plan_to_user/:id', function(req, res, next){
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var posted_data = req.body;

        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = { _id: Model.ObjectID(posted_data.plan_id), type: 'custom', user_id: Model.ObjectID(posted_data.user_id) };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                var model_user = Model.load('user', {}, function(err, model_user) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err);
                    } else {
                        model_tp.find(conds).sort({sort_order: 1}).limit(1).next(function(err, trainerplan) {
                            if (err) {
                                sendError(res, "Failed to retrieve trainer plans: " + err);
                            } else {
                                var updated_data = { "assigned": true, "modified_date" : (new Date()).getTime() + "" };
                                 _.defaults(updated_data, trainerplan)
                                model_tp.updateOne({_id: Model.ObjectID(posted_data.plan_id)}, {
                                    $set: { "assigned": true, "modified_date" : (new Date()).getTime() + "" }
                                }, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, "Failed to update record: " + err)
                                    } else {
                                        var updatedUserData = { "profile.user_custom_plan_assigned": true };
                                        model_user.updateOne({_id: Model.ObjectID(posted_data.user_id)}, {$set: updatedUserData }, {}, function(err, r){
                                            if(err){
                                                return sendError(res, "Failed to update user data: "+err);
                                            }
                                            sendSuccess(res, {
                                                message: trainerplan.label+ " has been assigned successfully",
                                                plan: updated_data
                                            });
                                        });
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })

    // Deny Custom Trainer Plan
    // Remove Custom Plan from User

    router.post('/deny_custom_plan_to_user/:id', function(req, res, next){
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var posted_data = req.body;
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = { _id: Model.ObjectID(posted_data.plan_id), type: 'custom', user_id: Model.ObjectID(posted_data.user_id) };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                var model_user = Model.load('user', {}, function(err, model_user) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err);
                    } else {
                        model_tp.find(conds).sort({sort_order: 1}).limit(1).next(function(err, trainerplan) {
                            if (err) {
                                sendError(res, "Failed to retrieve trainer plans: " + err);
                            } else {
                                var updated_data = { "assigned": false, "modified_date" : (new Date()).getTime() + "" };
                                _.defaults(updated_data, trainerplan);
                                model_tp.updateOne({_id: Model.ObjectID(posted_data.plan_id)}, {
                                    $set: { "assigned": false, "modified_date" : (new Date()).getTime() + "" }
                                }, {}, function(err, dbres) {
                                    if (err) {
                                        sendError(res, "Failed to update record: " + err)
                                    } else {
                                        var updatedUserData = { "profile.user_custom_plan_assigned": false };
                                        model_user.updateOne({_id: Model.ObjectID(posted_data.user_id)}, {$set: updatedUserData }, {}, function(err, r){
                                            if(err){
                                                return sendError(res, "Failed to update user data: "+err);
                                            }
                                            sendSuccess(res, {
                                                message: trainerplan.label+ " has been denied successfully",
                                                plan: updated_data
                                            });
                                        });
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })

    /**
        @@ Add notes to Workout/Exercise
        @@ input trainer_id
        @@ input user_id
    **/


    router.post('/exercise_notes', function(req, res, next) {
        var posted_data = req.body;
        if (
            typeof(posted_data.workout_id)==='undefined' ||
            typeof(posted_data.user_id)==='undefined' ||
            typeof(posted_data.notes)==='undefined' ||
            typeof(posted_data.posted_by)==='undefined' ||
            typeof(posted_data.trainer_id)==='undefined'

        ) {
            sendError(res, "Invalid parameters");
        } else if (
            posted_data.workout_id === '' ||
            posted_data.user_id === '' ||
            posted_data.notes === '' ||
            posted_data.posted_by === '' ||
            posted_data.trainer_id === ''
        ) {
            sendError(res, "Empty parameters \n खाली पैरामीटर");
        }else{
            var model_workout_notes = Model.load('workoutnotes', {}, function(err, model_workout_notes) {
                if (err) {
                    sendError(res, "Failed to access db: " + err);
                } else {
                    posted_data['created_at'] = (new Date()).getTime();
                    posted_data['updated_at'] = (new Date()).getTime();
                    if (model_workout_notes.verify(posted_data)) {
                        model_workout_notes.insertOne(posted_data, {}, function(err, dbres) {
                            if (err) {
                                sendError(res, "Failed to insert record: " + err);
                            } else {
                                sendSuccess(res, {
                                    res: dbres,
                                    workout_notes: posted_data
                                });
                            }
                        })
                    } else {
                        sendError(res, "Invalid data for workout notes!");
                    }
                }
            })
        }
    })

    /**
        @@ Delete Workout/Exercise Notes
        @@ Input Workout Notes Id
    **/

    router.delete('/exercise_notes/:id', function(req, res, next) {
        var workout_notes_id = req.params.id;
        if(!workout_notes_id){
            return sendError(res, "To perform this action you need to send workout notes id", 400);
        }
        try {
            var model_workout_notes = Model.load('workoutnotes', {}, function(err, model_workout_notes) {
                if (err) {
                    sendError(res, "Failed to access db: " + err);
                } else {
                    var conditions = { _id: Model.ObjectID(workout_notes_id) }
                    model_workout_notes.deleteOne(conditions, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, err);
                        } else {
                            sendSuccess(res, {
                                res: dbres
                            }, 200);
                        }
                    })
                }
            })
        }catch (e) {
            sendError(res, `API error - ${e.message} `, 500);
        }
    })


    /**
        @@ Add notes to Workoutday
        @@ input trainer_id
        @@ input user_id
    **/


    router.post('/workoutday_notes', function(req, res, next) {
        var posted_data = req.body;
        if (
            typeof(posted_data.workoutday_id)==='undefined' ||
            typeof(posted_data.user_id)==='undefined' ||
            typeof(posted_data.notes)==='undefined' ||
            typeof(posted_data.posted_by)==='undefined' ||
            typeof(posted_data.trainer_id)==='undefined'

        ) {
            sendError(res, "Invalid parameters");
        } else if (
            posted_data.workoutday_id === '' ||
            posted_data.user_id === '' ||
            posted_data.notes === '' ||
            posted_data.posted_by === '' ||
            posted_data.trainer_id === ''
        ) {
            sendError(res, "Empty parameters \n खाली पैरामीटर");
        }else{
            var model_workoutday_notes = Model.load('workoutdaynotes', {}, function(err, model_workoutday_notes) {
                if (err) {
                    sendError(res, "Failed to access db: " + err);
                } else {
                    posted_data['created_at'] = (new Date()).getTime();
                    posted_data['updated_at'] = (new Date()).getTime();
                    if (model_workoutday_notes.verify(posted_data)) {
                        model_workoutday_notes.insertOne(posted_data, {}, function(err, dbres) {
                            if (err) {
                                sendError(res, "Failed to insert record: " + err);
                            } else {
                                sendSuccess(res, {
                                    res: dbres,
                                    workoutday_notes: posted_data
                                });
                            }
                        })
                    } else {
                        sendError(res, "Invalid data for workoutday notes!");
                    }
                }
            })
        }
    })

    /**
        @@ Delete Workoutday Notes
        @@ Input Workoutday Notes Id
    **/

    router.delete('/workoutday_notes/:id', function(req, res, next) {
        var workoutday_notes_id = req.params.id;
        if(!workoutday_notes_id){
            return sendError(res, "To perform this action you need to send workoutday notes id", 400);
        }
        try {
            var model_workoutday_notes = Model.load('workoutdaynotes', {}, function(err, model_workoutday_notes) {
                if (err) {
                    sendError(res, "Failed to access db: " + err);
                } else {
                    var conditions = { _id: Model.ObjectID(workoutday_notes_id) }
                    model_workoutday_notes.deleteOne(conditions, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, err);
                        } else {
                            sendSuccess(res, {
                                res: dbres
                            }, 200);
                        }
                    })
                }
            })
        }catch (e) {
            sendError(res, `API error - ${e.message} `, 500);
        }
    })

    /** Load All Workoutdays with respect to their Custom plans **/
    /** This is an API to copy workoutday in Custom Plan **/

    router.get('/workoutday_with_customplan', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                // var conds = { plan_type: "custom" }; // check for custom Plan
                var conds = { }; // check for custom Plan

                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                var fields = { "label":1, "plan_id":1, "week":1, "weekday":1 };

                model_workoutday.find(conds, fields).sort({
                    label: 1,
                    week: 1,
                    weekday: 1,
                    sort_order: 1
                }).toArray(function(err, workoutdays) {
                    if (err) {
                        sendError(res, "Failed to retrieve workout days: " + err);
                    } else {
                        var model_plan = Model.load('trainerplan', {}, function(err, model_plan) {
                            if (err) {
                                sendError(res, "Failed to access db: " + err);
                            } else {

                                var loadedWorkoutDays = 0;
                                if(workoutdays && workoutdays.length){
                                    workoutdays.forEach(function(wDay, ind) {
                                        var plan_id = wDay.plan_id;

                                        var conditions = {
                                            _id: new Model.ObjectID(plan_id)
                                        };

                                        model_plan.find(conditions).limit(1).next(function(err, plan) {
                                            if (err) {
                                                return sendError(res, "Error found to fetch trainer plan" +err);
                                            } else if (plan) {
                                                workoutdays[ind].plan_name = plan.label;
                                                workoutdays[ind].weekday_name = "Week" + wDay.week + " Day" + wDay.weekday + " Plan" + plan.label;
                                            }

                                            if (++loadedWorkoutDays >= workoutdays.length) {

                                                sendSuccess(res, {
                                                    workoutdays: workoutdays
                                                });
                                            }

                                        });

                                    });
                                }else{
                                    sendSuccess(res, {workoutdays: workoutdays});
                                }
                            }
                        })
                    }
                })
            }
        })
    })

    /**
        @@ Copy Workout Day in User Custom Plan
    **/

    router.post('/copy_workoutday_with_customplan', function(req, res, next) {
        var posted_data= req.body.workoutday;
        var copyFrom = posted_data.copyFrom || 0;
        var copyTo = posted_data.copyTo || 0;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to copy this workoutday");
        }

        if (!copyFrom && !copyTo.week) {
            return sendError(res, "Please specify copy from and copy to");
        }

        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var copyExercise0 = function(w, callback) {
                    delete w._id;
                    w.label = w.label.replace(/\s+$/, '');
                    if(w.type=="exercise") w.sets = "0"; // don't copy set if workout is exercise
                    w.user_id = Model.ObjectID(posted_data.user_id);
                    w.created_at = (new Date()).getTime();
                    w.updated_at = (new Date()).getTime();
                    //if (typeof exer.is_alternate != "undefined") w.is_alternate = exer.is_alternate;
                    model_workout.insert(w, function(err, res) {
                        if (err) {
                            callback(err);
                        } else {

                            callback(undefined, w);
                        }
                    });
                };

                var copyExercise = function(workout, callback) {
                    if (workout.alternates && workout.alternates.length) {
                        var alternatesIds = [];
                        var invalidalternates = [];
                        workout.alternates.forEach(function(wc) {
                            if (!wc || wc.length != 24) {
                                invalidalternates.push(wc);
                                if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                    workout.alternates = alternatesIds;
                                    copyExercise0(workout, callback);
                                }
                            } else {

                                copyWorkout(wc, function(err, nW) {
                                    if (err) {
                                        //callback(err);
                                        invalidalternates.push(wc);
                                    } else {
                                        alternatesIds.push(nW._id + "");
                                    }
                                    if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                        workout.alternates = alternatesIds;
                                        copyExercise0(workout, callback);
                                    }
                                });
                            }

                        });
                    } else {
                        copyExercise0(workout, callback);
                    }
                };

                var copyWorkout = function(w, callback) {
                    model_workout.findOne({
                        "_id": Model.ObjectID(w)
                    }, {}, function(err, workout) {
                        if (err) {
                            return callback(err);

                        } else if (!workout) {
                            return callback("Not found");
                        }
                        if (workout.type == 'group' && workout.children && workout.children.length) {
                            var childrenIds = [];
                            var invalidChildren = [];
                            var _saveChildren = function(i){
                                if(i>=workout.children.length){
                                    workout.children = childrenIds;
                                    copyExercise(workout, callback);
                                }else{
                                    if(!workout.children[i] || workout.children[i].length != 24){
                                        invalidChildren.push(workout.children[i]);
                                        _saveChildren(i+1);
                                    }else{
                                        copyWorkout(workout.children[i], function(err, nW){
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
                            copyExercise(workout, callback);
                        }
                    });

                };

                var copyWorkoutday = function(wday, WorkoutDay, callback){
                    copyWorkout(wday.workout, function(err, newWorkout){
                        if(newWorkout){
                            delete wday._id;
                            wday.workout = newWorkout._id+"";
                            wday.week = copyTo.week;
                            wday.plan_type = "custom";
                            wday.user_id = Model.ObjectID(posted_data.user_id);
                            if(copyTo.weekday){
                                wday.weekday = copyTo.weekday;
                            }
                            if(copyTo.plan_id){
                                wday.plan_id = copyTo.plan_id;
                            }
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

                Model.load('workoutday', {}, function(err, model_workoutday){

                    if(err){
                        console.error("Error1: "+err);
                    }
                    var conditions1 = copyTo;

                    if(copyFrom._id) {
                        copyFrom._id = new Model.ObjectID(copyFrom._id);
                    }
                    var conditions2 = copyFrom;

                    if(model_workoutday){
                        // Remove existing copyTo week

                        model_workoutday.remove(conditions1);
                        // Now fetch copyFrom week
                        model_workoutday.find(conditions2).toArray(function(err, workoutdays) {
                            var savedWorkoutdays = 0;
                            var savedDayData = [];
                            var invalidSavedDayData = [];
                            workoutdays.forEach(function(wday){
                                if(err){
                                    console.error("WD Error: "+err);
                                    return;
                                }

                                copyWorkoutday(wday, model_workoutday, function(err, newwday){
                                    if(newwday){
                                        savedDayData.push(newwday._id);
                                    }else{
                                        invalidSavedDayData.push(wday._id);
                                    }

                                    if (++savedWorkoutdays >= workoutdays.length) {

                                            sendSuccess(res, { workoutday: newwday, workoutdays: savedDayData, failed:invalidSavedDayData  });
                                        }
                                })

                            })
                        })
                    }
                })

            }

        })
    })

    /**
        @@ This API gets All Custom Plans,
        @@ This is implemented for Frontend Admin
    **/

    router.get('/custom_plans', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = { type: 'custom'}
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }

                model_tp.find(conds).sort({sort_order: 1}).toArray(function(err, customplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve trainer plans: " + err);
                    } else {
                        sendSuccess(res, {
                            customplans: customplans
                        });
                    }
                });
            }
        });
    });

    /**
        @@ Copy Workout Week in Custom Plan
    **/

    router.post('/copy_workoutweek_to_customplan', function(req, res, next) {

        var posted_data= req.body.workoutweek;

        var copyFrom = posted_data.copyFrom || false;
        var copyTo = posted_data.copyTo || false;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to copy this week");
        }

        if (!copyFrom.week && !copyTo.week) {
            return sendError(res, "Please specify copy from and copy to");
        }

        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var copyExercise0 = function(w, callback) {
                    delete w._id;
                    w.label = w.label.replace(/\s+$/, '');
                    if(w.type=="exercise") w.sets = "0";
                    w.user_id = Model.ObjectID(posted_data.user_id);
                    w.created_at = (new Date()).getTime();
                    w.updated_at = (new Date()).getTime();

                    model_workout.insert(w, function(err, res) {
                        if (err) {
                            callback(err);
                        } else {

                            callback(undefined, w);
                        }
                    });
                };

                var copyExercise = function(workout, callback) {
                    if (workout.alternates && workout.alternates.length) {
                        var alternatesIds = [];
                        var invalidalternates = [];
                        workout.alternates.forEach(function(wc) {
                            if (!wc || wc.length != 24) {
                                invalidalternates.push(wc);
                                if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                    workout.alternates = alternatesIds;
                                    copyExercise0(workout, callback);
                                }
                            } else {

                                copyWorkout(wc, function(err, nW) {
                                    if (err) {
                                        //callback(err);
                                        invalidalternates.push(wc);
                                    } else {
                                        alternatesIds.push(nW._id + "");
                                    }
                                    if ((alternatesIds.length + invalidalternates.length) >= workout.alternates.length) {
                                        workout.alternates = alternatesIds;
                                        copyExercise0(workout, callback);
                                    }
                                });
                            }

                        });
                    } else {
                        copyExercise0(workout, callback);
                    }
                };

                var copyWorkout = function(w, callback) {
                    model_workout.findOne({
                        "_id": Model.ObjectID(w)
                    }, {}, function(err, workout) {
                        if (err) {
                            callback(err);
                            return;
                        } else if (!workout) {
                            return callback("Not found");
                        }
                        if (workout.type == 'group' && workout.children && workout.children.length) {
                            var childrenIds = [];
                            var invalidChildren = [];
                            var _saveChildren = function(i){
                                if(i>=workout.children.length){
                                    workout.children = childrenIds;
                                    copyExercise(workout, callback);
                                }else{
                                    if(!workout.children[i] || workout.children[i].length != 24){
                                        invalidChildren.push(workout.children[i]);
                                        _saveChildren(i+1);
                                    }else{
                                        copyWorkout(workout.children[i], function(err, nW){
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
                            copyExercise(workout, callback);
                        }
                    });

                };

                var copyWorkoutday = function(wday, WorkoutDay, callback){
                    copyWorkout(wday.workout, function(err, newWorkout){
                        if(newWorkout){
                            delete wday._id;
                            wday.workout = newWorkout._id+"";
                            wday.week = copyTo.week;
                            wday.plan_type = "custom";
                            wday.user_id = Model.ObjectID(posted_data.user_id);
                            if(copyTo.weekday){
                                wday.weekday = copyTo.weekday;
                            }
                            if(copyTo.plan_id){
                                wday.plan_id = copyTo.plan_id;
                            }
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

                Model.load('workoutday', {}, function(err, model_workoutday){

                    if(err){
                       sendError(res, "Error: "+err);
                    }
                    var conditions1 = copyTo;

                    if(copyFrom._id) {
                        copyFrom._id = new Model.ObjectID(copyFrom._id);
                    }
                    var conditions2 = copyFrom;

                    if(model_workoutday){

                        // Now fetch copyFrom week
                        model_workoutday.find(conditions2).toArray(function(err, workoutdays) {
                            var savedWorkoutdays = 0;
                            var savedDayData = [];
                            var invalidSavedDayData = [];
                            if(err){
                                sendError(res, "An error occured in workout day: " +err);
                            }
                            if(workoutdays && workoutdays.length)
                            {
                                // Remove existing copyTo week

                                model_workoutday.remove(conditions1);

                                workoutdays.forEach(function(wday){

                                    copyWorkoutday(wday, model_workoutday, function(err, newwday){
                                        if(newwday){
                                            savedDayData.push(newwday._id);
                                        }else{
                                            invalidSavedDayData.push(wday._id);
                                        }

                                        if (++savedWorkoutdays >= workoutdays.length) {

                                                sendSuccess(res, { success_days: savedDayData, failed:invalidSavedDayData  });
                                            }
                                    });

                                });
                            }else{
                                sendError(res, "Either week or day is missing, please try with another plan/week");
                            }
                        });
                    }
                })
            }
        })
    })

    /**
        @@ Get All Circuits to copy in Add Circuit Form
    **/

    router.get('/workoutday_with_circuit_in_custom_plan', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var keyword_filter = req.query.keyword || "";
                var conds = {};
                var if_custom_plan = req.query.if_custom_plan || false
                if(if_custom_plan) conds.plan_type = 'custom';
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }

                var rex = new RegExp('.*' + keyword_filter + '.*', "i");

                model_workoutday.find(conds).toArray(function(err, workoutdays) {
                    if (err) {
                        sendError(res, "Failed to retrieve workout days: " + err);
                    } else {
                        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
                            if (err) {
                                callback("Failed to access db: " + err)
                            } else {
                                var model_workout = Model.load('workout', {}, function(err, model_workout) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {
                                        var loadedWorkouts = 0;
                                        workoutdays.forEach(function(wDays, ind) {
                                            var id = wDays.workout;
                                            model_workout.loadWorkout(id, function(err, workout) {
                                                if (err) {
                                                    sendError(res, err);
                                                } else if (!workout) {
                                                    sendError(res, "Not found");
                                                } else {

                                                    workoutdays[ind].workout = workout;

                                                }
                                                if (++loadedWorkouts >= workoutdays.length) {
                                                    var filtered_workouts = [];
                                                    var failedloadedPlans = [];
                                                    var succeededloadedPlans = [];
                                                    workoutdays.forEach(function(wDay, ind) { // Workout Days

                                                        model_tp.findOne({
                                                            _id: new Model.ObjectID(wDay.plan_id)
                                                        }, {
                                                            "label": 1
                                                        }, function(err, trainerplans) {
                                                            if (err) {
                                                                failedloadedPlans.push(err);
                                                                if ((failedloadedPlans.length + succeededloadedPlans.length) == workoutdays.length) {
                                                                    sendSuccess(res, {
                                                                        workouts: filtered_workouts
                                                                    });
                                                                }
                                                            } else {
                                                                succeededloadedPlans.push("success");
                                                                wDay.plan_name = trainerplans?trainerplans.label:"";

                                                                if (wDay.workout.children && wDay.workout.children.length) {
                                                                    var arr = wDay.workout.children;

                                                                    arr.forEach(function(wout, ind) { // Circuits
                                                                        if (wout.is_alternate == true || wout.is_alternate == "true") {
                                                                            return;
                                                                        }
                                                                        delete wout.children; // delete Exercises
                                                                        wout.week = wDay.week;
                                                                        wout.weekday = wDay.weekday;
                                                                        wout.weekday_name = "Week#" + wDay.week + " Day#" + wDay.weekday;
                                                                        wout.plan_name = wDay.plan_name;

                                                                        //var matched=false;
                                                                        // find similar workouts
                                                                        /*for(var j=0; j < filtered_workouts.length; j++){
                                                                            if(filtered_workouts[j]._id == wout._id) continue;
                                                                            matched = false;
                                                                            if(filtered_workouts[j].label.trim().toLowerCase() == wout.label.trim().toLowerCase()) {

                                                                                matched = filtered_workouts[j].image == wout.image && ((filtered_workouts[j].has_steps && wout.has_steps && filtered_workouts[j].steps.length == wout.steps.length) || (!filtered_workouts[j].has_steps && !wout.has_steps));

                                                                                if(matched && filtered_workouts[j].has_steps && wout.has_steps && filtered_workouts[j].steps.length == wout.steps.length){
                                                                                    // match all steps..
                                                                                    for(var s=0; s<wout.steps.length; s++){
                                                                                        if(wout.steps[s].image != filtered_workouts[j].steps[s].image) {
                                                                                            matched = false; break;
                                                                                        }
                                                                                    }
                                                                                }

                                                                                if(matched){
                                                                                    break;
                                                                                }
                                                                            }
                                                                        }*/
                                                                        //if(!matched) {
                                                                        if (rex.test(wout.label)) {
                                                                            filtered_workouts.push(wout);
                                                                        }
                                                                        //}
                                                                        // // For Alternates Circuits
                                                                        var alternates = wout.alternates;
                                                                        if (alternates && alternates.length) {

                                                                            alternates.forEach(function(alt, i) {
                                                                                delete alt.children; // delete Exercises
                                                                                alt.week = wDay.week;
                                                                                alt.weekday = wDay.weekday;
                                                                                alt.weekday_name = "Week#" + wDay.week + " Day#" + wDay.weekday;
                                                                                alt.plan_name = wDay.plan_name;

                                                                                //var matched=false;
                                                                                // find similar workouts
                                                                                /*for(var j=0; j < filtered_workouts.length; j++){
                                                                                  if(filtered_workouts[j]._id == alt._id) continue;
                                                                                  matched = false;
                                                                                  if(filtered_workouts[j].label.trim().toLowerCase() == alt.label.trim().toLowerCase()) {

                                                                                    matched = filtered_workouts[j].image == wout.image && ((filtered_workouts[j].has_steps && wout.has_steps && filtered_workouts[j].steps.length == wout.steps.length) || (!filtered_workouts[j].has_steps && !wout.has_steps));

                                                                                    if(matched && filtered_workouts[j].has_steps && wout.has_steps && filtered_workouts[j].steps.length == wout.steps.length){
                                                                                        // match all steps..
                                                                                        for(var s=0; s<wout.steps.length; s++){
                                                                                            if(wout.steps[s].image != filtered_workouts[j].steps[s].image) {
                                                                                                matched = false; break;
                                                                                            }
                                                                                        }
                                                                                    }

                                                                                    if(matched){
                                                                                      break;
                                                                                    }
                                                                                  }
                                                                                }*/
                                                                                //if(!matched){
                                                                                if (rex.test(alt.label)) {
                                                                                    filtered_workouts.push(alt);
                                                                                }
                                                                                //}

                                                                            });

                                                                        }
                                                                    });
                                                                }

                                                                if ((failedloadedPlans.length + succeededloadedPlans.length) == workoutdays.length) {
                                                                    sendSuccess(res, {
                                                                        workouts: filtered_workouts
                                                                    });
                                                                }
                                                            }
                                                        })
                                                    })
                                                }

                                            });

                                        });
                                    }
                                });
                            }
                        })
                    }
                });
            }
        });
    });


    /**
        @@ Onboarding Questions Module
    **/

    router.get('/questions', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var webapp = req.query.webapp || 0
        var model_question = Model.load('question', {}, function(err, model_question) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};

                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }

                var sortOrder = { 'index': 1 }

                model_question.find(conds).sort(sortOrder).toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve data for question : " + err)
                    } else {
                        sendSuccess(res, {
                            questions: dbres
                        })
                    }
                })
            }
        })
    })

    /**
        @@ Questions Modules
        @@ Add Question

    **/

    router.put('/question', function(req, res, next) {
        var posted_data = req.body.question;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this video data");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_question = Model.load('question', {}, function(err, model_question) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var saveQuestion = function(failed) {
                    model_question.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                question: posted_data,
                                failed_files: failed
                            });
                        }
                    });
                };

                if(posted_data.question) posted_data.question = posted_data.question.replace(/\s+$/, '');

                if (model_question.verify(posted_data)) {

                    posted_data.created_at = (new Date()).getTime();
                    posted_data.updated_at = (new Date()).getTime();

                    /** If User choose From Media Library **/
                    if (typeof posted_data.is_active != "undefined") {
                        posted_data.is_active = true;
                    }else{
                        posted_data.is_active = false;
                    }

                    if(posted_data.answers && posted_data.answers.length){
                        var answers = posted_data.answers.map(function(kk, ind) {
                            return { value: kk, skip: posted_data.skip[ind] }
                        })
                    }
                    posted_data.answers = answers;
                    delete posted_data.skip;

                    saveQuestion();

                } else {
                    sendError(res, "Invalid data for question");
                }
            }
        })
    })


    /**
        @@ Delete question Data
    **/

    router.delete('/question/:id', function(req, res, next) {
        var id = req.params.id;
        var model_question = Model.load('question', {}, function(err, model_question) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }
                model_question.deleteOne(conds, {}, function(err, response) {
                    if (err) {
                        sendError(res, err);
                    } else {
                        sendSuccess(res, {
                            res: response
                        });
                    }
                })
            }
        })
    })

    /**
        @@ Question sort api
        @@ input sortable data array

    **/

    router.post('/updateQuestionOrder',function(req,res,next){
        var sorted_data = req.body.data;
        if (!req.query.trainer_id) {
            return sendError(res, "Not authorized to update this record");
        }
        if (!req.query.model_name) {
            return sendError(res, "Not authorized to update this record");
        }
        var model_name = req.query.model_name;
        var M = Model.load(model_name, {}, function(err, M) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if(sorted_data.length > 0){
                    var counter = 0;
                    var qindex = 1;
                    sorted_data.forEach(function(item,index){
                        M.updateOne({_id:new Model.ObjectID(item._id)},{$set:{index:qindex}},function(err,data){
                               if (err) {
                                    sendError(res, "Failed to update record: " + err);
                                } else {
                                    if(++counter >=sorted_data.length){
                                        sendSuccess(res, {
                                            data: sorted_data,
                                            success:true
                                        });
                                    }
                                }
                            })
                        qindex++;
                    })
                }
            }
        });
    })


    /**
        @@ Get Video data with video_id
        @@ This is for getting video data
    **/

    router.get('/question/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_question = Model.load('question', {}, function(err, model_question) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_question.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "This question data doesn't exist in our record");
                    } else {
                        sendSuccess(res, {
                            question: dbres
                        });
                    }
                });
            }
        });
    });


    /**
        @@ Update Question Data
    **/

    router.post('/question/:id', function(req, res, next) {
        var exer = req.body.question;

        var id = req.params.id;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this question data");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        var model_question = Model.load('question', {}, function(err, model_question) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_question.find(conditions).limit(1).next(function(err, question_data) {
                    if (err) {
                        sendError(res, err);
                    } else if (!question_data) {
                        sendError(res, "Question data not found, please try with another question");
                    } else {

                        var _updateQuestion = function() {

                            if (typeof exer.is_active != 'undefined') {
                                exer.is_active = true;
                            }else{
                                exer.is_active = false;
                            }

                            if(exer.type!=='choice' && exer.type!=='multichoice'){
                                exer.answers = [ ]
                            }

                            _.defaults(exer, question_data);

                            if(exer.type=='choice' || exer.type=='multichoice'){ // if user chooses choice option
                                if(exer.answers && exer.answers.length){
                                    var answers = exer.answers.map(function(kk, ind) {
                                        return { value: kk, skip: exer.skip[ind] }
                                    })
                                }
                            }

                            exer.answers = answers;
                            delete exer._id;
                            delete exer.skip;
                            if (model_question.verify(exer)) {

                                exer.updated_at = (new Date()).getTime();
                                    model_question.update(conds, {
                                        $set: exer
                                    }, {
                                        multi: true
                                    }, function(err, dbres) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: dbres,
                                                question: exer
                                            });
                                        }
                                    })

                            } else {
                                sendError(res, "Invalid data for question data");
                            }
                        }

                        conds._id = new Model.ObjectID(id);
                        _updateQuestion();
                    }
                })
            }
        })
    })


    /**
        @@ Question Categories Modules
        @@ This is for EXTRAS Section
        @@ Add/Edit/Delete Question Category

    **/

    router.get('/questioncategory', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var model_questioncategory = Model.load('questioncategory', {}, function(err, model_questioncategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_questioncategory.find(conds).sort({
                        'created_at': -1
                    }).toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve question categories: " + err);
                    } else {
                        sendSuccess(res, {
                            questioncategory: dbres
                        });
                    }
                });
            }
        });
    });

    router.get('/questioncategory/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_questioncategory = Model.load('questioncategory', {}, function(err, model_questioncategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_questioncategory.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "Not found");
                    } else {
                        sendSuccess(res, {
                            questioncategory: dbres
                        });
                    }
                });
            }
        });
    });

    router.post('/questioncategory/:id', function(req, res, next) {
        var posted_data = req.body.questioncategory;
        var id = req.params.id;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this question category");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_questioncategory = Model.load('questioncategory', {}, function(err, model_questioncategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conditions.trainer_id = req.trainer_id;
                }
                model_questioncategory.find(conditions).limit(1).next(function(err, result) {
                    if (err) {
                        sendError(res, err);
                    } else if (!result) {
                        sendError(res, "Not found");
                    } else {

                        _.defaults(posted_data, result);
                        delete posted_data._id;

                        if (model_questioncategory.verify(posted_data)) {

                            model_questioncategory.updateOne(conditions, {
                                $set: posted_data
                            }, {}, function(err, dbres) {
                                if (err) {
                                    sendError(res, "Failed to update record: " + err);
                                } else {
                                    sendSuccess(res, {
                                        res: dbres,
                                        questioncategory: posted_data
                                    })
                                }
                            })
                        } else {
                            sendError(res, "Invalid data for question category");
                        }

                    }
                })
            }
        })
    })

    router.put('/questioncategory', function(req, res, next) {
        var posted_data = req.body.questioncategory;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this question category");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_questioncategory = Model.load('questioncategory', {}, function(err, model_questioncategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                if (model_questioncategory.verify(posted_data)) {

                    model_questioncategory.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                questioncategory: posted_data
                            });
                        }
                    });

                } else {
                    sendError(res, "Invalid data for question category");
                }
            }
        })
    })

    router.delete('/questioncategory/:id', function(req, res, next) {
        var id = req.params.id;
        var model_questioncategory = Model.load('questioncategory', {}, function(err, model_questioncategory) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                model_questioncategory.deleteOne(conds, {}, function(err, response) {
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
        @@ Get only Exercise in Erin Oprea
    **/

    router.get('/exercises_data', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;

        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            }else{
                var conds = {}

                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }

                conds.plan_id = {
                    "$in": ["5daa3e7e09be946ad1441700" ] // only for specific plan ids
                };

                model_workoutday.find(conds).count(function(err, total_days) {
                    if (err) {
                        return sendError(res, "Failed to retrieve workout days: " + err);
                    } else{
                        R = Math.floor(Math.random() * 20);
                        model_workoutday.find(conds).sort({
                            label: 1,
                            week: 1,
                            weekday: 1,
                            sort_order: 1
                        }).toArray(function(err, workoutdays) {

                            if (err) {
                                sendError(res, "Failed to retrieve workout days: " + err);
                            } else {

                                var model_workout = Model.load('workout', {}, function(err, model_workout) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {

                                        if(workoutdays.length > 0){
                                            var loadedWorkouts = 0
                                            for (var wdi = 0; wdi < workoutdays.length; wdi++) {
                                                (function(wdi) {
                                                    model_workout.loadWorkout(workoutdays[wdi].workout, function(err, w) {
                                                        if (err) {
                                                            return sendError(res, "Failed to retrieve workout details: " + err);
                                                        }

                                                        workoutdays[wdi].workout = w;
                                                        if (++loadedWorkouts >= workoutdays.length) {

                                                            var filtered_workouts = [];
                                                            workoutdays.forEach(function(wDay, index) { // Workout Days

                                                                if (wDay.workout.children && wDay.workout.children.length) {
                                                                    // sort according to updated_at time

                                                                    wDay.workout.children.forEach(function(circuit, ind) { // Circuits
                                                                        circuit.children.sort(function(a,b) { // Exercises
                                                                            return (a.updated_at < b.updated_at) ? 1 : ((b.updated_at < a.updated_at) ? -1 : 0);
                                                                        });

                                                                    });
                                                                    wDay.workout.children.forEach(function(circuit, ind) { // Circuits
                                                                        var arr = circuit.children; // Exercises
                                                                        arr.forEach(function(wout, i) {
                                                                            filtered_workouts.push(wout)
                                                                        });
                                                                    })
                                                                }

                                                            })

                                                            // shuffle data
                                                            var shuffle_data = shuffle(filtered_workouts)
                                                            // get unique data
                                                            var unique_featured_exercises = getUnique(shuffle_data, 'label');

                                                            sendSuccess(res, {
                                                                filtered_workouts: unique_featured_exercises, // Random 54 Exercises
                                                            });
                                                        }
                                                    });
                                                })(wdi);
                                            }
                                        }else{
                                            sendSuccess(res, {
                                                filtered_workouts: []
                                            });
                                        }

                                    }
                                })
                            }
                        }) //end here
                    }

                })
            }
        })
    })

    /**
        @@ Workout Library
        @@ As per input plan id
    **/

    router.get('/workout_library/:plan_id?', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var keyword_filter = req.query.keyword || '';
        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = { plan_type: {$ne: "custom"} };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                if (keyword_filter) {
                    conds.label = new RegExp('^' + keyword_filter + '.*$', "i");
                }
                var plan_id = req.params.plan_id || false;

                if(plan_id) conds.plan_id = plan_id;

                var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
                    if (err) {
                        sendError(res, "Failed to access db: " + err);
                    } else {

                        model_workoutday.find(conds).sort({
                            label: 1,
                            week: 1,
                            weekday: 1,
                            sort_order: 1
                        }).toArray(function(err, workoutdays) {
                            if (err) {
                                sendError(res, "Failed to retrieve workout days: " + err);
                            } else {
                                var model_workout = Model.load('workout', {}, function(err, model_workout) {
                                    if (err) {
                                        sendError(res, "Failed to access db: " + err);
                                    } else {

                                        var loadedWorkouts = 0;
                                        if (workoutdays.length) {
                                            for (var wdi = 0; wdi < workoutdays.length; wdi++) {
                                                (function(wdi) {
                                                    model_workout.loadWorkout(workoutdays[wdi].workout, function(err, w) {
                                                        if (err) {
                                                            return sendError(res, "Failed to retrieve workout details: " + err);
                                                        }
                                                        workoutdays[wdi].workout = w;
                                                        if (++loadedWorkouts >= workoutdays.length) {
                                                            var filtered_workouts = [];
                                                            var loadedPlans = 0;
                                                            workoutdays.forEach(function(wDay, ind) { // Workout Days

                                                                model_tp.findOne({
                                                                    _id: new Model.ObjectID(wDay.plan_id)
                                                                }, {
                                                                    "label": 1
                                                                }, function(err, trainerplans) {
                                                                    if (err) {
                                                                        return sendError(res, "Failed to retrieve plan details: " + err);
                                                                    } else {

                                                                        wDay.plan_name = trainerplans;

                                                                        if (++loadedPlans >= workoutdays.length) {

                                                                            var filtered_workouts = workoutdays.reduce(function (obj, item) {
                                                                                if(item.workout && item.workout.body_types && item.workout.body_types.length) {
                                                                                    for (var j = 0; j < item.workout.body_types.length; j++) {
                                                                                        if(item.workout.body_types[j]['label']){
                                                                                            obj[item.workout.body_types[j]['label'] ] = obj[item.workout.body_types[j]['label'] ] || [];
                                                                                            obj[item.workout.body_types[j]['label']].push(item);
                                                                                        }

                                                                                    }
                                                                                }
                                                                                return obj;

                                                                            }, {});
                                                                            sendSuccess(res, { filtered_data: filtered_workouts });

                                                                        }
                                                                    }
                                                                });

                                                            });

                                                        }
                                                    });
                                                })(wdi);
                                            }
                                        } else {
                                            sendError(res, "No workout found in this Plan");
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });

    router.post('/updateNotification', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var workout_id = req.body.workout_id || false
        var notification_type = req.body.type || ""
        var notification_id = req.body.notification_id || ""

        var model_workout = Model.load('workout', {}, function(err, model_workout) {
            if(err){
                sendError(res, "Failed to access db: " + err);
            }else{
                var model_workout_notes = Model.load('workoutnotes', {}, function(err, model_workout_notes) {
                    if(err){
                        sendError(res, "Failed to access db: " + err);
                    }else{

                        var conds = {
                            children: {
                                $in: [workout_id.toString()]
                            }
                        };

                        if (trainer_id) {
                            conds.trainer_id = trainer_id;
                        }

                        model_workout.find(conds, {
                            "label": 1,
                            "is_alternate": 1
                        }).limit(1).next(function(err, circuit) { // Main Circuit
                            if (err) {
                                return sendError(res, "Failed to retrieve exercise: " + err);
                            } else {
                                // Check if Circuit is alternate or not
                                if (circuit && circuit._id && (circuit.is_alternate == "true" || circuit.is_alternate == true)) {
                                    var circuit_alt = circuit._id.toString();
                                    var conds3 = {
                                        alternates: {
                                            $in: [circuit_alt]
                                        }
                                    };
                                    if (trainer_id) {
                                        conds3.trainer_id = trainer_id;
                                    }

                                    model_workout.find(conds3, {
                                        "label": 1
                                    }).limit(1).next(function(err, workout) {

                                        if (err) {
                                            return sendError(res, "Failed to retrieve workout: " + err);
                                        }

                                        var conds4 = {
                                            children: {
                                                $in: [workout._id.toString()]
                                            }
                                        };

                                        if (trainer_id) {
                                            conds.trainer_id = trainer_id;
                                        }
                                        model_workout.find(conds4, {
                                            "label": 1
                                        }).limit(1).next(function(err, wout) {
                                            if (err) {
                                                return sendError(res, "Failed to retrieve workout: " + err);
                                            }
                                            var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
                                                if (err) {
                                                    return sendError(res, "Failed to access db: " + err);
                                                } else {
                                                    var conds2 = {
                                                        workout: wout._id.toString()
                                                    };
                                                    if (trainer_id) {
                                                        conds2.trainer_id = trainer_id;
                                                    }
                                                    model_workoutday.find(conds2).limit(1).next(function(err, workoutday) {
                                                        if (err) {
                                                            return sendError(res, "Failed to retrieve workout days: " + err);
                                                        } else {
                                                            if (!workoutday) {
                                                                return sendError(res, "Not found");
                                                            }
                                                            if( notification_type=="weight" || notification_type=="reps" ){

                                                                if(notification_type=="weight"){
                                                                    var update_notification_conds = { _id:  Model.ObjectID(workout_id), "user_weight_tracking._id": Model.ObjectID(notification_id) }
                                                                    var updated_data = { "user_weight_tracking.$.read_status": "y" }
                                                                }
                                                                else if(notification_type=="reps"){
                                                                    var update_notification_conds = { _id:  Model.ObjectID(workout_id), "user_reps_tracking._id": Model.ObjectID(notification_id) }
                                                                    var updated_data = { "user_reps_tracking.$.read_status": "y" }
                                                                }

                                                                model_workout.updateOne(update_notification_conds, {
                                                                    $set: updated_data
                                                                }, {

                                                                }, function(err, dbres) {
                                                                    if (err) {
                                                                        sendError(res, "Failed to update record: " + err);
                                                                    } else {
                                                                        sendSuccess(res, {
                                                                            workoutday: workoutday,
                                                                            main_workout: dbres
                                                                        });
                                                                    }
                                                                });
                                                            }else{
                                                                model_workout_notes.update({workout_id: workout_id}, {
                                                                    $set: { read_status: "y"}
                                                                }, {

                                                                }, function(err, dbres) {
                                                                    if (err) {
                                                                        sendError(res, "Failed to update record: " + err);
                                                                    } else {
                                                                        sendSuccess(res, {
                                                                            workoutday: workoutday,
                                                                            main_workout: dbres
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    });
                                } else if (circuit && circuit._id && (circuit.is_alternate == "false" || circuit.is_alternate == false)) {
                                    var conditions = {
                                        children: {
                                            $in: [circuit._id.toString()]
                                        }
                                    };
                                    if (trainer_id) {
                                        conditions.trainer_id = trainer_id;
                                    }
                                    model_workout.find(conditions).limit(1).next(function(err, workout) {
                                        if (err) {
                                            return sendError(res, "Failed to retrieve workout days: " + err);
                                        }
                                        var model_workoutday = Model.load('workoutday', {}, function(err, model_workoutday) {
                                            if (err) {
                                                sendError(res, "Failed to access db: " + err);
                                            } else {
                                                var conds2 = {
                                                    workout: workout._id.toString()
                                                };
                                                if (trainer_id) {
                                                    conds2.trainer_id = trainer_id;
                                                }
                                                model_workoutday.find(conds2).limit(1).next(function(err, workoutday) {
                                                    if (err) {
                                                        return sendError(res, "Failed to retrieve workout days: " + err);
                                                    } else {
                                                        if (!workoutday) {
                                                            return sendError(res, "Not found");
                                                        }
                                                        if( notification_type=="weight" || notification_type=="reps" ){

                                                            if(notification_type=="weight"){
                                                                var update_notification_conds = { _id:  Model.ObjectID(workout_id), "user_weight_tracking._id": Model.ObjectID(notification_id) }
                                                                var updated_data = { "user_weight_tracking.$.read_status": "y" }
                                                            }
                                                            else if(notification_type=="reps"){
                                                                var update_notification_conds = { _id:  Model.ObjectID(workout_id), "user_reps_tracking._id": Model.ObjectID(notification_id) }
                                                                var updated_data = { "user_reps_tracking.$.read_status": "y" }
                                                            }

                                                            model_workout.updateOne(update_notification_conds, {
                                                                $set: updated_data
                                                            }, {

                                                            }, function(err, dbres) {
                                                                if (err) {
                                                                    sendError(res, "Failed to update record: " + err);
                                                                } else {
                                                                    sendSuccess(res, {
                                                                        workoutday: workoutday,
                                                                        main_workout: dbres
                                                                    });
                                                                }
                                                            });
                                                        }else{
                                                            model_workout_notes.update({_id: Model.ObjectID(notification_id)}, {
                                                                $set: { read_status: "y"}
                                                            }, {

                                                            }, function(err, dbres) {
                                                                if (err) {
                                                                    sendError(res, "Failed to update record: " + err);
                                                                } else {
                                                                    sendSuccess(res, {
                                                                        workoutday: workoutday,
                                                                        main_workout: dbres
                                                                    });
                                                                }
                                                            })
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    });

                                } else {
                                    sendError(res, "Not found");
                                }
                            }
                        });
                    }
                })
            }
        })
    })

    /**
        @@ Support Ads Module
    **/

    router.get('/all_trainer_ads', function(req, res, next) {
        var webapp = req.query.webapp || 0
        var model_ad = Model.load('community_ad', {}, function(err, model_ad) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};

                var sortOrder = { 'created_date': -1 }

                model_ad.find(conds).sort(sortOrder).toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve data for ads : " + err)
                    } else {
                        sendSuccess(res, {
                            ads: dbres
                        })
                    }
                })
            }
        })
    })

    router.get('/ads', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var webapp = req.query.webapp || 0
        var model_ad = Model.load('community_ad', {}, function(err, model_ad) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};

                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }

                var sortOrder = { 'created_date': -1 }

                model_ad.find(conds).sort(sortOrder).toArray(function(err, dbres) {
                    if (err) {
                        sendError(res, "Failed to retrieve data for ads : " + err)
                    } else {
                        sendSuccess(res, {
                            ads: dbres
                        })
                    }
                })
            }
        })
    })

    /**
        @@ SAVE AD
        @@ PUT REQUEST
    **/

    router.put('/saveAd', function(req, res, next) {
        var posted_data = req.body.ad;

        if (req.trainer_id && posted_data.trainer_id && req.trainer_id != posted_data.trainer_id) {
            return sendError(res, "Not authorized to update this video data");
        }

        if (!posted_data.trainer_id && req.trainer_id) {
            posted_data.trainer_id = req.trainer_id;
        }

        var model_ad = Model.load('community_ad', {}, function(err, model_ad) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {

                var saveAd = function(failed) {
                    model_ad.insertOne(posted_data, {}, function(err, dbres) {
                        if (err) {
                            sendError(res, "Failed to insert record: " + err);
                        } else {
                            sendSuccess(res, {
                                res: dbres,
                                video: posted_data,
                                failed_files: failed
                            });
                        }
                    });
                };

                if(posted_data.title) posted_data.title = posted_data.title.replace(/\s+$/, '');

                if (model_ad.verify(posted_data)) {

                    posted_data.created_date = (new Date());
                    posted_data.last_modified_date = (new Date());

                    posted_data.start_date = (new Date(posted_data.start_date));
                    posted_data.end_date = (new Date(posted_data.end_date));

                    /** If User choose From Media Library **/
                    if (typeof posted_data.is_featured != "undefined") {
                        posted_data.is_featured = true;
                    }else{
                        posted_data.is_featured = false;
                    }

                    if (typeof posted_data.is_published != "undefined") {
                        posted_data.draft = false;
                        posted_data.published_date = [ (new Date()) ];
                    }else{
                        posted_data.draft = true;
                    }
                    // Set archive FALSE
                    posted_data.archived = false;

                    if (req.files && req.files.length) {
                        var baseFolder = path.join(path.dirname(require.main.filename), "uploads/community/");

                        Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + posted_data.title.replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                            if (!succeeded.length) {
                                sendError(res, "Failed to upload all file(s)");
                            } else {

                                posted_data.mediaAssets = { };

                                if (fields.community_photo) {
                                    posted_data.mediaAssets.communityPhoto = { url: config.base_url+"uploads/community/"+fields.community_photo.shift() }
                                } else {

                                    posted_data.mediaAssets.communityPhoto = { url: "" }
                                }

                                if (fields.home_photo) {
                                    posted_data.mediaAssets.homePhoto = { url: config.base_url+"uploads/community/"+fields.home_photo.shift() }
                                } else {

                                    posted_data.mediaAssets.homePhoto = { url: "" }
                                }


                                if (fields.video) {
                                    var v = fields.video.shift();
                                    posted_data.mediaAssets.video = { url: v.path };
                                    posted_data.video_mime = v.mime;
                                    posted_data.local_video = true;
                                    posted_data.uncompressed = true;
                                } else {
                                    posted_data.mediaAssets.video = { url: "" }

                                    if(posted_data.video_url) posted_data.mediaAssets.video = { url: posted_data.video_url };
                                }

                                saveAd(failed);

                            }
                        }, function(err, fieldname, eventtype, newvalue) {
                            //pd 2
                            var id = posted_data._id;

                            if (!err) {
                                if (fieldname == "video") {
                                    var o = posted_data.mediaAssets;

                                    if (newvalue) {
                                        o.video = { url: newvalue };
                                    }


                                    model_ad.updateOne({
                                        _id: id
                                    }, {
                                        "$set": o
                                    }, {}, function(err, dbres) {
                                        // TODO: error handling
                                        console.error("update2", err, dbres);
                                    });

                                }
                            }


                        }, posted_data.trainer_id);
                    } else {

                        posted_data.mediaAssets = { "video": { "url": "" }, "communityPhoto": { "url": "" }, "homePhoto": { "url": "" } };

                        if(posted_data.video_url) posted_data.mediaAssets.video.url = posted_data.video_url;

                        saveAd();
                    }

                } else {
                    sendError(res, "Invalid data for ad");
                }
            }
        });
    });


    /**
        @@ GET Ad by ID
    **/

    router.get('/ad/:id', function(req, res, next) {
        var trainer_id = req.userinfo.isAdmin && req.query.trainer_id ? req.query.trainer_id : req.trainer_id;
        var id = req.params.id;
        var model_ad = Model.load('community_ad', {}, function(err, model_ad) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };
                if (trainer_id) {
                    conds.trainer_id = trainer_id;
                }
                model_ad.find(conds).limit(1).next(function(err, dbres) {
                    if (err) {
                        sendError(res, err);
                    } else if (!dbres) {
                        sendError(res, "This ad data doesn't exist in our record");
                    } else {
                        sendSuccess(res, {
                            ad: dbres
                        });
                    }
                });
            }
        });
    });


    /**
        @@ Update Ad Data
    **/

    router.post('/ad/:id', function(req, res, next) {

        var exer = req.body.ad;
        var removeImages = req.body.removeImages || [];
        var removeVideo = req.body.removeVideo || "";

        var id = req.params.id;

        if (req.trainer_id && exer.trainer_id && req.trainer_id != exer.trainer_id) {
            return sendError(res, "Not authorized to update this video data");
        }

        if (!exer.trainer_id && req.trainer_id) {
            exer.trainer_id = req.trainer_id;
        }

        if(exer.label) exer.label = exer.label.replace(/\s+$/, '');

        var model_ad = Model.load('community_ad', {}, function(err, model_ad) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {};
                var conditions = {
                    _id: new Model.ObjectID(id)
                };
                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                    conditions.trainer_id = req.trainer_id;
                }
                model_ad.find(conditions).limit(1).next(function(err, ad_data) {
                    if (err) {
                        sendError(res, err);
                    } else if (!ad_data) {
                        sendError(res, "Ad data not found, please try with another ad");
                    } else {

                        var _updateAd = function() {

                            exer.last_modified_date = (new Date());

                            exer.start_date = (new Date(exer.start_date));
                            exer.end_date = (new Date(exer.end_date));

                            /** If User choose From Media Library **/
                            if (typeof exer.is_featured != "undefined") {
                                exer.is_featured = true;
                            }else{
                                exer.is_featured = false;
                            }

                            if (typeof exer.draft != "undefined") {
                                exer.draft = true;
                            }else{
                                exer.draft = false;
                            }

                            if (typeof exer.archived != "undefined") {
                                exer.archived = true;
                            }else{
                                exer.archived = false;
                            }

                            _.defaults(exer, ad_data);
                            delete exer._id;

                            if (model_ad.verify(exer)) {

                                if(!exer.draft && !exer.archived) {
                                    exer.published_date = exer.published_date || []
                                    exer.published_date.push((new Date()));
                                }

                                if (removeVideo) {
                                    exer.mediaAssets.video = { url: "" }
                                }

                                if (req.files && req.files.length) {

                                    var baseFolder = path.join(path.dirname(require.main.filename), "uploads/community/");

                                    Model.uploadFilesEx(req, baseFolder, req.trainer_id + "_" + exer.title.replace(/[^a-zA-Z0-9]/g, '_') + "_", function(succeeded, failed, fields) {
                                        if (!succeeded.length) {
                                            sendError(res, "Failed to upload all file(s)");
                                        } else {

                                            if (fields.community_photo) {
                                                exer.mediaAssets.communityPhoto = { url: config.base_url+"uploads/community/"+fields.community_photo.shift() }
                                            }

                                            if (fields.home_photo) {
                                                exer.mediaAssets.homePhoto = { url: config.base_url+"uploads/community/"+fields.home_photo.shift() }
                                            }


                                            if (fields.video) {
                                                var v = fields.video.shift();
                                                exer.mediaAssets.video = { url: v.path };
                                                exer.video_mime = v.mime;
                                                exer.local_video = true;
                                                exer.uncompressed = true;
                                            }

                                            if(exer.video_url) exer.mediaAssets.video = { url: exer.video_url };

                                            model_ad.update(conds, {
                                                $set: exer
                                            }, {
                                                multi: true
                                            }, function(err, dbres) {
                                                if (err) {
                                                    sendError(res, "Failed to update record: " + err);
                                                } else {
                                                    sendSuccess(res, {
                                                        res: dbres,
                                                        ad: exer,
                                                        failed_files: failed
                                                    });
                                                }
                                            });

                                        }
                                    }, function(err, fieldname, eventtype, newvalue) {
                                        //pd 2

                                        if (!err) {
                                            if (fieldname == "video") {                                                

                                                model_ad.updateOne(conds, {
                                                    "$set": { "mediaAssets.video.url": newvalue }
                                                }, {}, function(err, dbres) {
                                                    // TODO: error handling
                                                    console.error("update2", err, dbres);
                                                });

                                            }
                                        }


                                    }, exer.trainer_id);
                                
                                } else {

                                    if(exer.video_url) exer.mediaAssets.video = { url: exer.video_url };

                                    model_ad.update(conds, {
                                        $set: exer
                                    }, {
                                        multi: true
                                    }, function(err, dbres) {
                                        if (err) {
                                            sendError(res, "Failed to update record: " + err);
                                        } else {
                                            sendSuccess(res, {
                                                res: dbres,
                                                ad: exer
                                            });
                                        }
                                    });
                                }
                            } else {
                                sendError(res, "Invalid data for ad data");
                            }
                        };

                        conds._id = new Model.ObjectID(id);
                        _updateAd();
                    }
                });
            }
        });
    });

    /**
        @@ Delete Ad
    **/

    router.post('/ad_archive/:id', function(req, res, next) {

        var id = req.body.ad_id;
        var model_ad = Model.load('community_ad', {}, function(err, model_ad) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                var conds = {
                    _id: new Model.ObjectID(id)
                };

                if (req.trainer_id) {
                    conds.trainer_id = req.trainer_id;
                }

                console.log("conds", conds);
                // return

                model_ad.updateOne(conds, {
                  $set: { "archived": true }
                }, {}, function (err, dbres) {

                    if (err) {
                        sendError(res, "Failed to update record: " + err);
                    } else {
                        sendSuccess(res, {
                            res: dbres,
                            ad: dbres
                        });
                    }
                });
            }
        });
    })

    /**
        @@ ProgramDays Modules
        @@ Add/Edit/Delete Program

    **/

  router.get('/program', function (req, res, next) {
    var model_program = Model.load('program', {}, function (err, model_program) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {};

        if (req.query.org_id) {
          conds.org_id = req.query.org_id;
        }

        if (req.query.trainer_id) {
          conds.trainer_id = req.query.trainer_id;
        }

        if (req.query.user_id) {
          conds.user_id = req.query.user_id;
        }

        model_program.find(conds).sort({
          'created_at': -1
        }).toArray(function (err, dbres) {
          if (err) {
            sendError(res, "Failed to retrieve programs: " + err);
          } else {
            sendSuccess(res, {
              programs: dbres
            });
          }
        });
      }
    });
  });

  router.get('/program/:id', function (req, res, next) {
    var id = req.params.id;
    var model_program = Model.load('program', {}, function (err, model_program) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };
        model_program.find(conds).limit(1).next(function (err, dbres) {
          if (err) {
            sendError(res, err);
          } else if (!dbres) {
            sendError(res, "Not found");
          } else {
            sendSuccess(res, {
              program: dbres
            });
          }
        });
      }
    });
  });

  router.post('/program/:id', function (req, res, next) {
    var posted_data = req.body.program;
    var id = req.params.id;
    var replace = req.body.replace || false;

    var model_program = Model.load('program', {}, function (err, model_program) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {

        var conditions = {
          _id: new Model.ObjectID(id)
        };
        model_program.find(conditions).limit(1).next(function (err, result) {
          if (err) {
            sendError(res, err);
          } else if (!result) {
            sendError(res, "Not found");
          } else {
            if (!replace) {
              _.defaults(posted_data, result);
              delete posted_data._id;
            }

            if (model_program.verify(posted_data)) {

              if (replace) {
                model_program.replaceOne(conditions, posted_data, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to replace record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      program: posted_data
                    });
                  }
                });
              } else {
                model_program.updateOne(conditions, {
                  $set: posted_data
                }, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to update record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      program: posted_data
                    });
                  }
                });
              }
            } else {
              sendError(res, "Invalid data for program");
            }
          }
        });
      }
    });
  });

  router.put('/program', function (req, res, next) {
    var posted_data = req.body.program;

    var model_program = Model.load('program', {}, function (err, model_program) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        if (model_program.verify(posted_data)) {

          model_program.insertOne(posted_data, {}, function (err, dbres) {
            if (err) {
              sendError(res, "Failed to insert record: " + err);
            } else {
              sendSuccess(res, {
                res: dbres,
                program: posted_data
              });
            }
          });
        } else {
          sendError(res, "Invalid data for video category");
        }
      }
    });
  });

  router.delete('/program/:id', function (req, res, next) {
    var id = req.params.id;
    var model_program = Model.load('program', {}, function (err, model_program) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };

        model_program.deleteOne(conds, {}, function (err, response) {
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
        @@ ProgramNotification Modules
        @@ Add/Edit/Delete ProgramNotification

    **/

   router.get('/programNotification', function (req, res, next) {
    var model_program_notification = Model.load('programNotification', {}, function (err, model_program_notification) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {};

        if (req.query.org_id) {
          conds.org_id = req.query.org_id;
        }

        if (req.query.trainer_id) {
          conds.trainer_id = req.query.trainer_id;
        }

        if (req.query.user_id) {
          conds.user_id = req.query.user_id;
        }

        model_program_notification.find(conds).sort({
          'created_at': -1
        }).toArray(function (err, dbres) {
          if (err) {
            sendError(res, "Failed to retrieve notifications: " + err);
          } else {
            sendSuccess(res, {
              notifications: dbres
            });
          }
        });
      }
    });
  });

  router.get('/programNotification/:id', function (req, res, next) {
    var id = req.params.id;
    var model_program_notification = Model.load('programNotification', {}, function (err, model_program_notification) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };
        model_program_notification.find(conds).limit(1).next(function (err, dbres) {
          if (err) {
            sendError(res, err);
          } else if (!dbres) {
            sendError(res, "Not found");
          } else {
            sendSuccess(res, {
              notification: dbres
            });
          }
        });
      }
    });
  });

  router.put('/programNotification/:id', function (req, res, next) {
    var posted_data = req.body.notification;
    var id = req.params.id;
    var replace = req.body.replace || false;

    var model_program_notification = Model.load('programNotification', {}, function (err, model_program_notification) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {

        var conditions = {
          _id: new Model.ObjectID(id)
        };
        model_program_notification.find(conditions).limit(1).next(function (err, result) {
          if (err) {
            sendError(res, err);
          } else if (!result) {
            sendError(res, "Not found");
          } else {
            if (!replace) {
              _.defaults(posted_data, result);
              delete posted_data._id;
            }

            if (model_program_notification.verify(posted_data)) {

              if (replace) {
                model_program_notification.replaceOne(conditions, posted_data, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to replace record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      notification: posted_data
                    });
                  }
                });
              } else {
                model_program_notification.updateOne(conditions, {
                  $set: posted_data
                }, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to update record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      notification: posted_data
                    });
                  }
                });
              }
            } else {
              sendError(res, "Invalid data for notification");
            }
          }
        });
      }
    });
  });

  router.post('/programNotification', function (req, res, next) {
    var posted_data = req.body.notification;

    var model_program_notification = Model.load('programNotification', {}, function (err, model_program_notification) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        if (model_program_notification.verify(posted_data)) {

            model_program_notification.insertOne(posted_data, {}, function (err, dbres) {
            if (err) {
              sendError(res, "Failed to insert record: " + err);
            } else {
              sendSuccess(res, {
                res: dbres,
                notification: posted_data
              });
            }
          });
        } else {
          sendError(res, "Invalid data");
        }
      }
    });
  });

  router.delete('/programNotification/:id', function (req, res, next) {
    var id = req.params.id;
    var model_program_notification = Model.load('programNotification', {}, function (err, model_program_notification) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };

        model_program_notification.deleteOne(conds, {}, function (err, response) {
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
        @@ ProgramWorkouts Modules
        @@ Add/Edit/Delete ProgramWorkout

    **/

   router.get('/programWorkout', function (req, res, next) {
    var model_programWorkout = Model.load('programWorkout', {}, function (err, model_programWorkout) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {};

        if (req.query.org_id) {
          conds.org_id = req.query.org_id;
        }

        if (req.query.trainer_id) {
          conds.trainer_id = req.query.trainer_id;
        }

        if (req.query.user_id) {
          conds.user_id = req.query.user_id;
        }

        model_programWorkout.find(conds).sort({
          'created_at': -1
        }).toArray(function (err, dbres) {
          if (err) {
            sendError(res, "Failed to retrieve programWorkouts: " + err);
          } else {
            sendSuccess(res, {
              programWorkouts: dbres
            });
          }
        });
      }
    });
  });

  router.get('/programWorkout/:id', function (req, res, next) {
    var id = req.params.id;
    var model_programWorkout = Model.load('programWorkout', {}, function (err, model_programWorkout) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };
        model_programWorkout.find(conds).limit(1).next(function (err, dbres) {
          if (err) {
            sendError(res, err);
          } else if (!dbres) {
            sendError(res, "Not found");
          } else {
            sendSuccess(res, {
              programWorkout: dbres
            });
          }
        });
      }
    });
  });

  router.post('/programWorkout/:id', function (req, res, next) {
    var posted_data = req.body.programWorkout;
    var id = req.params.id;
    var replace = req.body.replace || false;

    var model_programWorkout = Model.load('programWorkout', {}, function (err, model_programWorkout) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {

        var conditions = {
          _id: new Model.ObjectID(id)
        };
        model_programWorkout.find(conditions).limit(1).next(function (err, result) {
          if (err) {
            sendError(res, err);
          } else if (!result) {
            sendError(res, "Not found");
          } else {
            if (!replace) {
              _.defaults(posted_data, result);
              delete posted_data._id;
            }

            if (model_programWorkout.verify(posted_data)) {

              if (replace) {
                model_programWorkout.replaceOne(conditions, posted_data, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to replace record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      programWorkout: posted_data
                    });
                  }
                });
              } else {
                model_programWorkout.updateOne(conditions, {
                  $set: posted_data
                }, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to update record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      programWorkout: posted_data
                    });
                  }
                });
              }
            } else {
              sendError(res, "Invalid data for programWorkout");
            }
          }
        });
      }
    });
  });

  router.put('/programWorkout', function (req, res, next) {
    var posted_data = req.body.programWorkout;

    var model_programWorkout = Model.load('programWorkout', {}, function (err, model_programWorkout) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        if (model_programWorkout.verify(posted_data)) {

          model_programWorkout.insertOne(posted_data, {}, function (err, dbres) {
            if (err) {
              sendError(res, "Failed to insert record: " + err);
            } else {
              sendSuccess(res, {
                res: dbres,
                programWorkout: posted_data
              });
            }
          });
        } else {
          sendError(res, "Invalid data for video category");
        }
      }
    });
  });

  router.delete('/programWorkout/:id', function (req, res, next) {
    var id = req.params.id;
    var model_programWorkout = Model.load('programWorkout', {}, function (err, model_programWorkout) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };

        model_programWorkout.deleteOne(conds, {}, function (err, response) {
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

  router.get('/programWorkout/:id/equipmentList', function (req, res, next) {
    var id = req.params.id;
    var model_programWorkout = Model.load('programWorkout', {}, function (err, model_programWorkout) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };
        model_programWorkout.find(conds).limit(1).next(function (err, workout) {
          if (err) {
            sendError(res, err);
          } else if (!workout) {
            sendError(res, "Not found");
          } else {
            // we have a good workout object...

            const exerciseIds = {};
            workout.circuits.forEach(circuit => {
              circuit.exercises.forEach(exercise => {
                const exerciseId = exercise.exercise_id || exercise._id;
                exerciseIds[exerciseId] = 1
              });
            });

          var exerciseObjectIds = Object.keys(exerciseIds).map(exerciseId => new Model.ObjectID(exerciseId));

            var model_exercise = Model.load('exercise', {}, function(err, model_exercise) {
              if (err) {
                sendError(res, "Failed to access db: " + err);
              } else {
                var conds = {
                  _id: {$in: exerciseObjectIds}
                };
                model_exercise.find(conds).toArray(function(err, exercises) {
                  const equipmentStrings = {};

                  if (err) {
                    sendError(res, err);
                  } else {
                    exercises.forEach(exercise => {
                      if (exercise.requiredEquipment &&
                          exercise.requiredEquipment.weighted &&
                          exercise.requiredEquipment.weighted.equipment_id !== null) {
                        equipmentStrings[exercise.requiredEquipment.weighted.label] = 1;
                      }

                      if (exercise.requiredEquipment &&
                          exercise.requiredEquipment.unweighted &&
                          exercise.requiredEquipment.unweighted.length > 0) {
                        exercise.requiredEquipment.unweighted.forEach(unweightedEq => {
                          if (unweightedEq.equipment_id !== null) {
                            equipmentStrings[unweightedEq.label] = 1;
                          }
                        });
                      }
                    });

                    sendSuccess(res, {
                      equipmentList: Object.keys(equipmentStrings)
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

    /**
        @@ ProgramCircuits Modules
        @@ Add/Edit/Delete ProgramCircuit

    **/

   router.get('/programCircuit', function (req, res, next) {
    var model_programCircuit = Model.load('programCircuit', {}, function (err, model_programCircuit) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {};

        if (req.query.org_id) {
          conds.org_id = req.query.org_id;
        }

        if (req.query.trainer_id) {
          conds.trainer_id = req.query.trainer_id;
        }

        if (req.query.user_id) {
          conds.user_id = req.query.user_id;
        }

        model_programCircuit.find(conds).sort({
          'created_at': -1
        }).toArray(function (err, dbres) {
          if (err) {
            sendError(res, "Failed to retrieve programCircuits: " + err);
          } else {
            sendSuccess(res, {
              programCircuits: dbres
            });
          }
        });
      }
    });
  });

  router.get('/programCircuit/:id', function (req, res, next) {
    var id = req.params.id;
    var model_programCircuit = Model.load('programCircuit', {}, function (err, model_programCircuit) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };
        model_programCircuit.find(conds).limit(1).next(function (err, dbres) {
          if (err) {
            sendError(res, err);
          } else if (!dbres) {
            sendError(res, "Not found");
          } else {
            sendSuccess(res, {
              programCircuit: dbres
            });
          }
        });
      }
    });
  });

  router.post('/programCircuit/:id', function (req, res, next) {
    var posted_data = req.body.programCircuit;
    var id = req.params.id;
    var replace = req.body.replace || false;

    var model_programCircuit = Model.load('programCircuit', {}, function (err, model_programCircuit) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {

        var conditions = {
          _id: new Model.ObjectID(id)
        };
        model_programCircuit.find(conditions).limit(1).next(function (err, result) {
          if (err) {
            sendError(res, err);
          } else if (!result) {
            sendError(res, "Not found");
          } else {
            if (!replace) {
              _.defaults(posted_data, result);
              delete posted_data._id;
            }

            if (model_programCircuit.verify(posted_data)) {

              if (replace) {
                model_programCircuit.replaceOne(conditions, posted_data, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to replace record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      programCircuit: posted_data
                    });
                  }
                });
              } else {
                model_programCircuit.updateOne(conditions, {
                  $set: posted_data
                }, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to update record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      programCircuit: posted_data
                    });
                  }
                });
              }
            } else {
              sendError(res, "Invalid data for programCircuit");
            }
          }
        });
      }
    });
  });

  router.put('/programCircuit', function (req, res, next) {
    var posted_data = req.body.programCircuit;

    var model_programCircuit = Model.load('programCircuit', {}, function (err, model_programCircuit) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        if (model_programCircuit.verify(posted_data)) {

          model_programCircuit.insertOne(posted_data, {}, function (err, dbres) {
            if (err) {
              sendError(res, "Failed to insert record: " + err);
            } else {
              sendSuccess(res, {
                res: dbres,
                programCircuit: posted_data
              });
            }
          });
        } else {
          sendError(res, "Invalid data for video category");
        }
      }
    });
  });

  router.delete('/programCircuit/:id', function (req, res, next) {
    var id = req.params.id;
    var model_programCircuit = Model.load('programCircuit', {}, function (err, model_programCircuit) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };

        model_programCircuit.deleteOne(conds, {}, function (err, response) {
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
        @@ ProgramWeeks Modules
        @@ Add/Edit/Delete ProgramWeek

    **/

   router.get('/programWeek', function (req, res, next) {
    var model_programWeek = Model.load('programWeek', {}, function (err, model_programWeek) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {};

        if (req.query.program_id) {
          conds.program_id = req.query.program_id;
        }

        if (req.query.org_id) {
          conds.org_id = req.query.org_id;
        }

        if (req.query.trainer_id) {
          conds.trainer_id = req.query.trainer_id;
        }

        if (req.query.user_id) {
          conds.user_id = req.query.user_id;
        }

        if (req.query.weekNumberGte && req.query.weekNumberLte) {
          conds['$and'] = [ { weekNumber: { $gte: parseInt(req.query.weekNumberGte,10) }}, {weekNumber: { $lte: parseInt(req.query.weekNumberLte, 10) }} ];
        }

        model_programWeek.find(conds).sort({
          'created_at': -1
        }).toArray(function (err, dbres) {
          if (err) {
            sendError(res, "Failed to retrieve programWeeks: " + err);
          } else {
            sendSuccess(res, {
              programWeeks: dbres
            });
          }
        });
      }
    });
  });

  router.get('/programWeek/:id', function (req, res, next) {
    var id = req.params.id;
    var model_programWeek = Model.load('programWeek', {}, function (err, model_programWeek) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };
        model_programWeek.find(conds).limit(1).next(function (err, dbres) {
          if (err) {
            sendError(res, err);
          } else if (!dbres) {
            sendError(res, "Not found");
          } else {
            sendSuccess(res, {
              programWeek: dbres
            });
          }
        });
      }
    });
  });

  router.post('/programWeek/:id', function (req, res, next) {
    var posted_data = req.body.programWeek;
    var id = req.params.id;
    var replace = req.body.replace || false;

    var model_programWeek = Model.load('programWeek', {}, function (err, model_programWeek) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {

        var conditions = {
          _id: new Model.ObjectID(id)
        };
        model_programWeek.find(conditions).limit(1).next(function (err, result) {
          if (err) {
            sendError(res, err);
          } else if (!result) {
            sendError(res, "Not found");
          } else {
            if (!replace) {
              _.defaults(posted_data, result);
              delete posted_data._id;
            }

            if (model_programWeek.verify(posted_data)) {

              if (replace) {
                model_programWeek.replaceOne(conditions, posted_data, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to replace record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      programWeek: posted_data
                    });
                  }
                });
              } else {
                model_programWeek.updateOne(conditions, {
                  $set: posted_data
                }, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to update record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      programWeek: posted_data
                    });
                  }
                });
              }
            } else {
              sendError(res, "Invalid data for programWeek");
            }
          }
        });
      }
    });
  });

  router.put('/programWeek', function (req, res, next) {
    var posted_data = req.body.programWeek;

    var model_programWeek = Model.load('programWeek', {}, function (err, model_programWeek) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        if (model_programWeek.verify(posted_data)) {

          model_programWeek.insertOne(posted_data, {}, function (err, dbres) {
            if (err) {
              sendError(res, "Failed to insert record: " + err);
            } else {
              sendSuccess(res, {
                res: dbres,
                programWeek: posted_data
              });
            }
          });
        } else {
          sendError(res, "Invalid data for video category");
        }
      }
    });
  });

  router.delete('/programWeek/:id', function (req, res, next) {
    var id = req.params.id;
    var model_programWeek = Model.load('programWeek', {}, function (err, model_programWeek) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };

        model_programWeek.deleteOne(conds, {}, function (err, response) {
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
        @@ ProgramDays Modules
        @@ Add/Edit/Delete ProgramDay

    **/

   router.get('/programDay', function (req, res, next) {
    var model_programDay = Model.load('programDay', {}, function (err, model_programDay) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {};

        if (req.query.program_id) {
          conds.program_id = req.query.program_id;
        }

        if (req.query.org_id) {
          conds.org_id = req.query.org_id;
        }

        if (req.query.trainer_id) {
          conds.trainer_id = req.query.trainer_id;
        }

        if (req.query.user_id) {
          conds.user_id = req.query.user_id;
        }

        model_programDay.find(conds).sort({
          'created_at': -1
        }).toArray(function (err, dbres) {
          if (err) {
            sendError(res, "Failed to retrieve programDays: " + err);
          } else {
            sendSuccess(res, {
              programDays: dbres
            });
          }
        });
      }
    });
  });

  router.get('/programDay/:id', function (req, res, next) {
    var id = req.params.id;
    var model_programDay = Model.load('programDay', {}, function (err, model_programDay) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };
        model_programDay.find(conds).limit(1).next(function (err, dbres) {
          if (err) {
            sendError(res, err);
          } else if (!dbres) {
            sendError(res, "Not found");
          } else {
            sendSuccess(res, {
              programDay: dbres
            });
          }
        });
      }
    });
  });

  router.post('/programDay/:id', function (req, res, next) {
    var posted_data = req.body.programDay;
    var id = req.params.id;
    var replace = req.body.replace || false;

    var model_programDay = Model.load('programDay', {}, function (err, model_programDay) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {

        var conditions = {
          _id: new Model.ObjectID(id)
        };
        model_programDay.find(conditions).limit(1).next(function (err, result) {
          if (err) {
            sendError(res, err);
          } else if (!result) {
            sendError(res, "Not found");
          } else {
            if (!replace) {
              _.defaults(posted_data, result);
              delete posted_data._id;
            }

            if (model_programDay.verify(posted_data)) {

              if (replace) {
                model_programDay.replaceOne(conditions, posted_data, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to replace record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      programDay: posted_data
                    });
                  }
                });
              } else {
                model_programDay.updateOne(conditions, {
                  $set: posted_data
                }, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to update record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      programDay: posted_data
                    });
                  }
                });
              }
            } else {
              sendError(res, "Invalid data for programDay");
            }
          }
        });
      }
    });
  });

  router.put('/programDay', function (req, res, next) {
    var posted_data = req.body.programDay;

    var model_programDay = Model.load('programDay', {}, function (err, model_programDay) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        if (model_programDay.verify(posted_data)) {

          model_programDay.insertOne(posted_data, {}, function (err, dbres) {
            if (err) {
              sendError(res, "Failed to insert record: " + err);
            } else {
              sendSuccess(res, {
                res: dbres,
                programDay: posted_data
              });
            }
          });
        } else {
          sendError(res, "Invalid data for video category");
        }
      }
    });
  });

  router.delete('/programDay/:id', function (req, res, next) {
    var id = req.params.id;
    var model_programDay = Model.load('programDay', {}, function (err, model_programDay) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };

        model_programDay.deleteOne(conds, {}, function (err, response) {
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
        @@ Clients Modules
        @@ Add/Edit/Delete User

    **/
  router.get('/:trainerId/client', function (req, res, next) {
    var model_user = Model.load('user', {}, function (err, model_user) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          trainer_id: req.params.trainerId
        };

        model_user.find(conds).sort({
          'created_at': -1
        }).toArray(function (err, dbres) {
          if (err) {
            sendError(res, "Failed to retrieve users: " + err);
          } else {
            sendSuccess(res, {
              clients: dbres
            });
          }
        });
      }
    });
  });

  router.get('/:trainerId/client/:id', function (req, res, next) {
    var id = req.params.id;
    var model_user = Model.load('user', {}, function (err, model_user) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id),
          trainer_id: req.params.trainerId
        };
        model_user.find(conds).limit(1).next(function (err, dbres) {
          if (err) {
            sendError(res, err);
          } else if (!dbres) {
            sendError(res, "Not found");
          } else {
            sendSuccess(res, {
              client: dbres
            });
          }
        });
      }
    });
  });

  router.post('/:trainerId/client/:id', function (req, res, next) {
    var posted_data = req.body.client;
    var id = req.params.id;
    var replace = req.body.replace || false;

    var model_user = Model.load('user', {}, function (err, model_user) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {

        var conditions = {
          _id: new Model.ObjectID(id),
          trainer_id: req.params.trainerId
        };
        model_user.find(conditions).limit(1).next(function (err, result) {
          if (err) {
            sendError(res, err);
          } else if (!result) {
            sendError(res, "Not found");
          } else {
            if (!replace) {
              _.defaults(posted_data, result);
              delete posted_data._id;
            }

            if (model_user.verify(posted_data)) {

              if (replace) {
                model_user.replaceOne(conditions, posted_data, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to replace record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      client: posted_data
                    });
                  }
                });
              } else {
                model_user.updateOne(conditions, {
                  $set: posted_data
                }, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to update record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      client: posted_data
                    });
                  }
                });
              }
            } else {
              sendError(res, "Invalid data for client");
            }
          }
        });
      }
    });
  });

  router.put('/:trainerId/client', function (req, res, next) {
    var posted_data = req.body.client;

    var model_user = Model.load('user', {}, function (err, model_user) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        if (model_user.verify(posted_data)) {
          posted_data.password = Model.password(posted_data.password);
          posted_data.email = posted_data.email.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');
          posted_data.joined_on = (new Date()).toISOString(),

          model_user.insertOne(posted_data, {}, function (err, dbres) {
            if (err) {
              sendError(res, "Failed to insert record: " + err);
            } else {
              sendSuccess(res, {
                res: dbres,
                client: posted_data
              });
            }
          });
        } else {
          sendError(res, "Invalid data for video category");
        }
      }
    });
  });


  module.exports = router;

  // Optionally set a different controller name...this defaults to current file path, excluding base route dir path and file extension.
  // So, for a file, /routes/foo/bar/foobar.js, where /routes/ is base route dir, controller will default to foo/bar/foobar
  // Also, if some file is named index.js, then the full name is ignored, but the path is taken into consideration for defining controller name

  //module.exports.controller = "api";
})();
