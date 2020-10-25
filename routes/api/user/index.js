(function (){

	var express = require('express');
	var jwt = require('jsonwebtoken');
	var _ = require('lodash');
	const path = require('path');
	const fs = require('fs');
	const config = require(path.dirname(require.main.filename) + path.sep + 'config' + path.sep + 'index.json');
	const Model = require(path.dirname(require.main.filename) + path.sep + 'models');
	var router = express.Router();
	const util = require('util');
	var request= require('request');
	var moment = require('moment');

	const mailer = require(path.dirname(require.main.filename) + path.sep + 'mailer.js');


	function sendError(res, obj, status){
		obj = util.isObject(obj) ? obj : {error: obj};
		obj.success = false;
		if(status) {
			res.status(status);
		}
		res.json(obj);
	}

	function sendSuccess(res, obj){
		obj = util.isObject(obj) ? obj : {message: obj};
		obj.success = true;
		res.json(obj);
	}


	function isUser(userInfo){
		return (userInfo && !userInfo.isGuest && !userInfo.isTrainer && !userInfo.isAdmin);
	}

	function isAdmin(userInfo){
		return (userInfo && userInfo.isAdmin);
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
 		@@ Block F+T Thick APP Users
 		@@ Date 1 Sep 2019
	**/
	router.get('/block_access', function(req, res, next){
		sendError(res, {title: "The Fit and Thick App has been discontinued", "message": "We apologize for the inconvenience. The F+T App is no longer available. Please contact support@plankk.com for any questions" } );
	})

	// API for check the user view a notifiction or not
	router.post('/check_user_notification', function(req, res, next){
		var unData = req.body;

		if(unData.user_id && unData.trainer_id){

			var model_notification = Model.load('notification', {}, function(err, model_notification) {
				if (err) {
					sendError(res, "Failed to access db: " + err);
				} else {
					var currentDate = moment().format('YYYY-MM-DD');
					var conds = {
						'notification_type': 'inapp_notification',
						'status' : true,
						'trainer_id': (unData.trainer_id).toString(),
						$and: [
							{'start_date': {$lte: currentDate}},
							{'end_date': {$gt: currentDate}}
						]
					};
					var sortOrder = { 'created_at': -1 }
					model_notification.find(conds).sort(sortOrder).limit(1).toArray(function(nerr, resNots) {
						if (nerr) {
							sendError(res, "Failed to find records: " + nerr);
						} else {
							if(resNots.length>0){
								var resNot = resNots[0];
								var notificationId = resNot._id;

								var data = {};
								data.title = resNot.title;
								data.body = resNot.message;
								data.status = (checkEmpty(resNot.status) == false)?resNot.status:0;
								data.start_date = resNot.start_date;
								data.end_date = resNot.end_date;
								data.button_title = (checkEmpty(resNot.button_title) == false)?resNot.button_title:'';
								data.button_title_2 = (checkEmpty(resNot.button_title_2) == false)?resNot.button_title_2:'';
								data.button_action = (checkEmpty(resNot.button_action) == false)?resNot.button_action:'';
								data.button_action_2 = (checkEmpty(resNot.button_action_2) == false)?resNot.button_action_2:'';
								data.button_action_target = (checkEmpty(resNot.button_action_target) == false)?resNot.button_action_target:'';
								data.button_action_target_2 = (checkEmpty(resNot.button_action_target_2) == false)?resNot.button_action_target_2:'';
								data.screen_id_name = (checkEmpty(resNot.screen_id_name) == false)?resNot.screen_id_name:'';
								data.screen_id_name_2 = (checkEmpty(resNot.screen_id_name_2) == false)?resNot.screen_id_name_2:'';
								data.image = (checkEmpty(resNot.image) == false)?SITE_IMG_URL+'notifications/'+resNot.image:'';
								data.time = resNot.time;
								data.timezone = resNot.timezone;
								data.notification_id = notificationId;

								var model_get_notification = Model.load('get_notification', {}, function(gnerr, model_get_notification){
									if(gnerr){
										sendError(res, "Failed to access db :" +gnerr);
									} else {

										var conditions = {
											type: 'push',
											sub_type: 'inapp_notification',
											user_id: (unData.user_id).toString(),
											trainer_id: (unData.trainer_id).toString(),
											read_status: "y"
										};

										var	_viewNotificationCount = function(conditions, callback) {
											model_get_notification.find(conditions).count(callback)
										};
										_viewNotificationCount(conditions, function(error, dbres){
											if(error){
												sendError(res, "Failed to get notification data :" +error);
											} else {
												var total = parseInt(dbres);
												if(total <= 0){
													sendSuccess(res, {status:true, data:data});
												} else {
													sendSuccess(res, {status:false, view_notification:'Notifiction already viewed'});
												}
											}
										});
									}
								});
							} else {
								sendSuccess(res, {status:false, view_notification:'There is no notification exists.'});
							}
						}
					});
				}
			});
		} else {
			sendError(res, "User ID or Trainer ID is missing");
		}

	})

	// API for add a view notification for user
	router.post('/view_notification', function(req, res, next){
		var unData = req.body;
		if(unData.user_id && unData.trainer_id){

			var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification){
				if(err){
					sendError(res, "Failed to access db :" +err);
				} else {

					var data = {};
					data.type = 'push';
					data.sub_type = unData.sub_type;
					data.data = {};
					data.user_id = (unData.user_id).toString();
					data.trainer_id = (unData.trainer_id).toString();
					data.title = unData.title;
					data.notification_id = (unData.notification_id).toString();
					data.read_status = "y";

					var conditions = {
						type: data.type,
						sub_type: data.sub_type,
						user_id: data.user_id,
						trainer_id: data.trainer_id,
						notification_id: data.notification_id,
						read_status: "y"
					};

					var	_viewNotificationCount = function(conditions, callback) {
						model_get_notification.find(conditions).count(callback)
					};
					_viewNotificationCount(conditions, function(error, dbres){
						if(error){
							sendError(res, "Failed to get notification data :" +error);
						} else {
							var total = parseInt(dbres);
							if(total <= 0){
								if(model_get_notification.verifyView(data)){
									data.created_at = (new Date()).getTime();
									model_get_notification.insertOne(data, {}, function(errors, dbres){
										if(errors) {
											sendError(res, "Failed to insert data: " +errors);
										}else{
											sendSuccess(res, {view_notification:'notifiction view added'});
										}
									});
								}else{
									sendError(res, "Invalid data for view notification");
								}
							} else {
								sendSuccess(res, {view_notification:'Notifiction view already added'});
							}
						}
					});
				}
			});
		} else {
			sendError(res, "User ID or Trainer ID is missing");
		}
	})

	/* GET home page. */
	router.get('/', function(req, res, next) {
	  	res.json({
            error: true,
            message: "Unauthorized",
            responseCode: 0
        });
        res.end();
		// mailer.sendMail({to: "sandeep@wegile.com", subject: "Testing Amazon SES", html: "Hello!!"});


		// var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'FnT_register_template.html'));
		// mailer.sendMail({to: "sandeep@wegile.com", subject: "Welcome to the Fit and Thick App!", html: msg});

	});

	/**
		@@Update Email for WEB users
		@@ input trainer_id, email, new_email
	**/
	__updateEmailForWebUsers = function(trainer_domain, email, new_email, trainer_id, callback) {

		var formData = {
			"trainer_id": trainer_id,
			"email": email,
			"new_email" : new_email
	    };

		var options = {
			method: 'post',
		  	body: formData,
		  	json: true,
		  	url: 'https://'+trainer_domain+'.plankk.com/api/User/UpdateEmail',
		};

		request.post(options, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				if(callback) callback(undefined, "Success");
          	}else{
	          	console.error("Error in updating email "+ response);
	          	if(callback) callback("Error in updating email "+ response);
          	}
	 	});
	};

	/**
		@@Update Password for Web Users
		@@input token, email, password

	**/

	__updatePasswordForWebUsers = function(trainer_domain, email, password, trainer_id, callback) {

		var formData = {
			trainer_id: trainer_id,
			email: email,
			password : password
	    };

		var options = {
		 	method: 'post',
		  	body: formData,
		  	json: true,
		  	url: 'https://'+trainer_domain+'.plankk.com/api/User/ResetPassword',
		};

		request(options, function(err, response, body) {
			if (err) {
				console.error("Error in updating Password ===", err)
	          	if(callback) callback("Error in updating password "+ response.statusCode);
		  	}else{
				console.info('Password updated for web user');
				if(callback) callback(undefined, info);
		  	}

	 	});
	};

	router.post('/forgotpass', function(req, res, next){
		if(!req.body){
			return sendError(res, "Email is missing!");
		}
		var email = req.body.email || '';
		var trainer_id = req.body.trainer_id || '57c5310521bbac1d01aa75db';

		if(!email){
			return sendError(res, "Email is missing!");
		}

		email = email.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');

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
			"5bd9de9ada6a6b3a240de595": "mandy", // Mandy
			"5bd9e069da6a6b3a240de6dd": "aliengains", // Bakhar Nabieva
			"5c58993f9485e03a2c042b30": "yarishna", // Yarishna Fitness
			"5ccc64cfd17f9f5d70b9b227": "massy", // Massy
			"5c3cc5c8ba2d490d720aca9e": "samib", // Sami
			"5da625b54eca18246d33be28": "erin" // Erin Oprea
	    }

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({email: email, trainer_id: trainer_id}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Failed to get user: "+err);
				}
				if(!user){
					return sendError(res, "Email is not registered");
				}

				var pass = generatePassword(6);

				model_user.updateOne({_id: user._id}, {$set: {password: Model.password(pass)}}, {}, function(err, r){
					if(err){
						return sendError(res, "Failed to update password");
					}

					// update password for Web Users
					if(all_trainers_subdomain[user.trainer_id]) {
						__updatePasswordForWebUsers( all_trainers_subdomain[user.trainer_id], user.email, pass, user.trainer_id );
					}
					if(user.trainer_id == "57c5310521bbac1d01aa75db"){
						var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'FnT_forgot_password.html'));
						msg = (msg+"").replace('{{PASSWORD}}', pass);
						mailer.sendMail({to: user.email, html: msg, subject: "New Password"}, function(err, info){
							// if(err){
							// 	return sendError(res, "Failed to send email");
							// }

						});
					}else{
						mailer.sendMail({to: user.email, html: "New password: "+pass, subject: "New Password"}, function(err, info){
							// if(err){
							// 	return sendError(res, "Failed to send email");
							// }

						});
					}

					sendSuccess(res, "Password has been emailed to you");
				});
			});
		});
	});

	/**
		@@Update Device Token
		@@input user_id
	**/
	var updateDeviceToken = function(userdata, deviceToken, osType, callback){
		var model_user = Model.load('user', {}, function(err, model_user){
			var updated_data = {};
			updated_data.device_token = deviceToken;
			updated_data.os_type = osType;
			model_user.updateOne({_id: userdata}, {$set: updated_data}, {}, function(err, dbres){
				if(err){
					console.error(err);
				}else{
					console.info("Device Token updated", dbres);
				}
			});
		});

	};

	/**
		@@Login API
	**/

	router.post('/login', function(req, res, next) {
		if(!req.body){
			return sendError(res, "User/pass is missing!");
		}

		var user = req.body.email || "";
		var pass = req.body.password || "";
		var trainer_id = req.body.trainer_id || "57c5310521bbac1d01aa75db";
		var device_token = req.body.device_token || "";
		var os_type = req.body.os_type || "";
		var org_id = req.body.org_id || "";

		if(!user || !pass){
			sendError(res, "Email/password is missing!");
			return;
		}

		user = user.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');
		//check special case for Mike Chabot

		if(!org_id) {
			if(trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d") {
				var conditions = {email: user, password: Model.password(pass), trainer_id: { $in:[ "59791200cc447310747e731d", "59bc29ff25d96c751aa76b3d" ] }};
			}
			else{ // for All other APPS
				var conditions = {email: user, password: Model.password(pass), trainer_id: trainer_id};
			}
		}
		else {
			var conditions = {email: user, password: Model.password(pass), org_id: org_id};
		}

		var user_model = Model.load('user', {}, function(err, user_model){
			user_model.find(conditions).limit(1).next(function(err, isUser){
				if(isUser) {

					user_model.updateOne({_id: isUser._id}, { $set: { "profile.last_seen": (new Date()).getTime() } }, {}, function(error, dbresult){

						// if(error) {
						// 	sendError(res, "Something went wrong, please try again:" +error);
						// } else{
							// update device token
							if(device_token) {
								updateDeviceToken(isUser._id, device_token, os_type);
							}

							var new_user = JSON.parse(JSON.stringify(isUser));
							delete new_user.profile;
							delete new_user.transactions;
							delete new_user.progress_pics;
							delete new_user.progress_pictures;

							var token = jwt.sign({user: new_user, name: isUser.name, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
							if(isUser.verified && isUser.verified !== true){
								isUser.verified = false;
							}
							if(isUser.transactions) delete isUser.transactions;
							delete isUser.password;
							sendSuccess(res, {token: token, user: isUser});
						//}
					})
				}else{
					sendError(res, "Email/password is wrong!");
				}
			});
		});
	});


	/**
		@@ get User Token
		@@ for Web User Only
	**/

	router.post('/user_token', function(req, res, next) {
		if(!req.body){
			return sendError(res, "User/pass is missing!");
		}

		var user = req.body.email || "";
		var trainer_id = req.body.trainer_id || "57c5310521bbac1d01aa75db";

		if(!user || !pass){
			sendError(res, "Email/password is missing!");
			return;
		}

		user = user.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');
		//check special case for Mike Chabot
		if(trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d") {
			var conditions = {email: user, password: Model.password(pass), trainer_id: { $in:[ "59791200cc447310747e731d", "59bc29ff25d96c751aa76b3d" ] }};
		}
		else{ // for All other APPS
			var conditions = {email: user, password: Model.password(pass), trainer_id: trainer_id};
		}

		var user_model = Model.load('user', {}, function(err, user_model){
			user_model.find(conditions).limit(1).next(function(err, isUser){
				if(isUser) {

					var new_user = JSON.parse(JSON.stringify(isUser));
					delete new_user.profile;
					delete new_user.transactions;
					delete new_user.progress_pics;
					delete new_user.progress_pictures;

					var token = jwt.sign({user: new_user, name: isUser.name, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
					if(isUser.verified && isUser.verified !== true){
						isUser.verified = false;
					}
					if(isUser.transactions) delete isUser.transactions;
					sendSuccess(res, {token: token, user: isUser});
				}else{
					sendError(res, "Email/password is wrong!");
				}
			});
		});
	});

	function followUser(user_id, trainer_id, callback){
		var model_user = Model.load('user', {}, function(err, model_user){
			var conds = {
				trainer_id: trainer_id,
				is_trainer: true
			};

			model_user.find(conds).limit(1).next(function(err, user_data){
				if(err){
					callback("Failed to retrieve user");
				}else if(!user_data){
					callback("No user found");
				}else{
					var model_follow = Model.load('userfollow', {}, function(err, model_follow){
						if(err){
							callback("Failed to access db");
						}else{
							var userfollow ={
								follower: user_id,
								following: user_data._id.toString(),
								status: 1, //Here status 0, 1  values references to Pending Follow Request, Confirm Follow Request
								created_at: (new Date()).getTime()
							};
							// var reverseuserfollow ={
							// 	follower: user_data._id.toString(),
							// 	following: user_id,
							// 	status: 1,//Here status 0, 1  values references to Pending Follow Request, Confirm Follow Request
							// 	created_at: (new Date()).getTime()
							// }
							if(model_follow.verify(userfollow)){
								model_follow.insertOne(userfollow, {}, function(err, inserted_followers){
									if(err) {
										callback("Failed to insert record");
									}else{
										callback(undefined, inserted_followers);
									}
								});
							}else{
								callback("Invalid data for user follows");
							}
						}
					});
				}
			});
		});
	}

	router.post('/loginFB', function(req, res, next) {
		if(!req.body){
			return sendError(res, "Invalid Request!");
		}

		var facebook_id = req.body.facebook_id || "";
		var google_id = "";
		var device_token = req.body.device_token || "";
		var trainer_id = req.body.trainer_id || '57c5310521bbac1d01aa75db';
		var email = req.body.email || "";
		var image = req.body.image || "";
		var name = req.body.name || "";
		var os_type = req.body.os_type || "";
		var phone = req.body.phone || "";
		var course_type = req.body.course_type || "";

		if(!facebook_id){
			sendError(res, "Invalid Request!");
			return;
		}
		email = email.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');
		//check special case for Mike Chabot
		if(trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d") {
			var conditions = {facebook_id: facebook_id, trainer_id: { $in:[ "59791200cc447310747e731d", "59bc29ff25d96c751aa76b3d" ] }};
		}
		else{ // for All other APPS
			var conditions = { facebook_id: facebook_id, trainer_id: trainer_id };
		}
		var model_user = Model.load('user', {}, function(err, model_user){
			model_user.find(conditions).limit(1).next(function(err, isUser){
				if(isUser) {
					model_user.updateOne({_id: isUser._id}, { $set: { "profile.last_seen": (new Date()).getTime() } }, {}, function(error, dbresult){

						// if(error){
						// 	sendError(res, "Something went wrong, please try again:" +error);
						// } else{
							var new_user = JSON.parse(JSON.stringify(isUser));
							delete new_user.profile;
							delete new_user.transactions;
							delete new_user.progress_pics;
							delete new_user.progress_pictures;
							// update device token
							if(device_token) {
								updateDeviceToken(isUser._id, device_token, os_type);
							}
							var token = jwt.sign({user: new_user, name: isUser.name, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
							if(isUser.verified && isUser.verified !== true){
								isUser.verified = false;
							}
							if(isUser.transactions) delete isUser.transactions;
							sendSuccess(res, {token: token, user: isUser});
						// }
					})

				}else{

					var _insertFBUser = function(){

						var user = {
							user: facebook_id,
							facebook_id: facebook_id,
							google_id: google_id,
							trainer_id: trainer_id,
							email: email,
							password: Model.password(generatePassword(6)),
							device_token: device_token,
							os_type: os_type,
							course_type: course_type,
							profile: {
								name: name,
								phone: phone,
								image: image,
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
								subscribed_plan: '0',
								active_plan_key: '',
								active_planid: 0,
								selected_trainer: '',
								last_seen: (new Date()).getTime()
							},
							joined_on: (new Date()).getTime(),
							subscribed_on: false,
							subscription: false,
							plans: [],
							progress_pictures: [],
							// current_plan: false,
							active: true,
							verified: true//generatePassword(12),
						};



						var saveUser = function(){
							model_user.insertOne(user, {}, function(err, insertedUser){
								if(err){
									sendError(res, "Failed to register user: "+err);
								}else {
									if(user.email){

										if(trainer_id == "57c5310521bbac1d01aa75db"){
											// Fit & Thick App

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'FnT_register_template.html'));
											mailer.sendMail({from: 'Nicole Mejia <info@getfitandthick.com>', to: user.email, subject: "Welcome to the Fit and Thick App!", html: msg});
										}else if(trainer_id == "5822bfb2b86828570dd90899"){
											// MTC app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'MTC_register_template.html'));
											mailer.sendMail({from: 'Carmen Morgan <support@plankk.com>', to: user.email, subject: "Welcome to My Trainer Carmen!", html: msg});
										}else if(trainer_id == "586f341b1cfef774222b1821"){
											// DFG app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'DFG_register_template.html'));
											mailer.sendMail({from: 'Samantha Kozuch <support@plankk.com>', to: user.email, subject: "Welcome to the Daily Fit Girl App!", html: msg});
										}else if(trainer_id == "59177e86980aa43e2715a8ff"){
											// Madeleine Byrne app

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Madeleine_Byrne_register.html'));
											mailer.sendMail({from: 'Madeleine Byrne <support@plankk.com>', to: user.email, subject: "Welcome to the Madeleine Byrne App!", html: msg});
										}else if(trainer_id == "591c8094da9386315f51787e"){
											// Workouts By Gabriela app

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Gabriela_register.html'));
											mailer.sendMail({from: 'Gabriela Bandy <support@plankk.com>', to: user.email, subject: "Welcome to the Workouts By Gabriela App!", html: msg});
										}else if(trainer_id == "58f66e596e288005867db979"){
											// MinneNinja app
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'MN_register_template.html'));
											mailer.sendMail({from: 'Jennifer Tavernier <support@plankk.com>', to: user.email, subject: "Welcome to the Minne Ninja App!", html: msg});
										}else if(trainer_id == "59177d25980aa43e2715a8fe"){
											// Nikki Rica Fit app
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Nikki_register_template.html'));
											mailer.sendMail({from: ' Nikki Leonard <support@plankk.com>', to: user.email, subject: "Welcome to the Nikki Rica Fit App!", html: msg});
										}else if(trainer_id == "584fbe1dadbdd05d535cddae"){
											// TWL app
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'TWL_register_template.html'));
											mailer.sendMail({from: 'Lyzabeth Lopez <support@plankk.com>', to: user.email, subject: "Welcome to the TWL App!", html: msg});
										}else if(trainer_id == "59791200cc447310747e731d"){
											// Mike Chabot app
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mike_chabot_register_template.html'));
											mailer.sendMail({from: 'Mike Chabot <support@plankk.com>', to: user.email, subject: "Welcome to the Mike Chabot Fitness App!", html: msg});
										}else if(trainer_id == "59d52803ee5c705abefacc11"){
											// Oooh Baby Beast app

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'OBB_register_template.html'));
											mailer.sendMail({from: 'Kayli <support@plankk.com>', to: user.email, subject: "Welcome to the Oooh Baby Beast App!", html: msg});
										}else if(trainer_id == "59b174cfab77c775bae7c6a2"){
											// Fit With Whit app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Fit_with_whit_register.html'));
											mailer.sendMail({from: 'Whitney <support@plankk.com>', to: user.email, subject: "Welcome to the Fit With Whit App!", html: msg});
										}else if(trainer_id == "59c02f07b271d505358da0bf"){
											// Arianny Celeste

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Arianny_register_template.html'));
											mailer.sendMail({from: 'Arianny <support@plankk.com>', to: user.email, subject: "Welcome to the Arianny Celeste App!", html: msg});
										}else if(trainer_id == "597b8a331b54472074c2dd1a"){
											// Sugary Six Pack

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'ssp_register.html'));
											mailer.sendMail({from: 'SugarySixpack <support@plankk.com>', to: user.email, subject: "Welcome to the NEW SugarySixpack App!", html: msg});
										}else if(trainer_id == "59e4ea0878c2ed3818c7c0de"){
											// Lais DeLeon App

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Lais_register.html'));
											mailer.sendMail({from: 'Lais DeLeon <support@plankk.com>', to: user.email, subject: "Welcome to the Lais DeLeon App!", html: msg});
										}else if(trainer_id == "59b9ad9e446c6d65794a9bc9"){
											// Trav Beach Boy

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Trav_register.html'));
											mailer.sendMail({from: 'Trav Beach Boy <support@plankk.com>', to: user.email, subject: "Welcome to the Beach Body By Trav App!", html: msg});
										}else if(trainer_id == "5a270b18731edd456cb56f3b"){
											// Ashley K FIT

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'ashley_k_register.html'));
											mailer.sendMail({from: 'AshleyKFit <support@plankk.com>', to: user.email, subject: "Welcome to the AshleyKFit App!", html: msg});
										}else if(trainer_id == "59cd5272c1dc8268c5818cf0"){
											// Caitlin Rice Fit

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'caitlin_rice_fit_register_template.html'));
											mailer.sendMail({from: 'Caitlin Rice Fit <support@plankk.com>', to: user.email, subject: "Welcome to the Caitlin Rice Fit App!", html: msg});
										}else if(trainer_id == "5a60de980379ce6d1fecfec0"){
											// Body By Lynsee

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Lynsee_register_template.html'));
											mailer.sendMail({from: 'Body By Lynsee <support@plankk.com>', to: user.email, subject: "Welcome to the Body By Lynsee App!", html: msg});
										}else if(trainer_id == "5a3c25bf34d092539e01b020"){
											// HollY Barker

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'holly_barker_register_template.html'));
											mailer.sendMail({from: 'Holly Barker <support@plankk.com>', to: user.email, subject: "Welcome to the Holly Barker App!", html: msg});
										}else if(trainer_id == "5a690da90379ce6d1fed04ac"){
											// Tianna Gregory
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'tianna_gregory_register_template.html'));
											mailer.sendMail({from: 'Tianna Gregory <support@plankk.com>', to: user.email, subject: "Thanks for joining the Tianna Gregory Community!", html: msg});
										}else if(trainer_id == "5a5f8f628887535a6f78b66f"){
											// Julian and Austin
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'austin_julian_register_template.html'));
											mailer.sendMail({from: 'Julian and Austin <support@plankk.com>', to: user.email, subject: "Thanks for joining the Austin & Julian App!", html: msg});
										}else if(trainer_id == "5aa6e4c527d727022ed0a9a8"){
											// Cass Martin

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'cass_martin_register.html'));
											mailer.sendMail({from: 'Lift With Cass Martin <support@plankk.com>', to: user.email, subject: "Welcome to the Lift with Cass Martin App!", html: msg});
										}else if(trainer_id == "5a8c7aff14d55f7ad445a6f3"){
											// BoothCamp

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'boothcamp_register_template.html'));
											mailer.sendMail({from: 'BOOTHCAMP <support@plankk.com>', to: user.email, subject: "Welcome to the BOOTHCAMP App!", html: msg});
										}else if(trainer_id == "5a9d7d110a4ae17da220a43e"){
											// Fit By Valen

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'fit_by_valen_register.html'));
											mailer.sendMail({from: 'Valen <support@plankk.com>', to: user.email, subject: "Welcome to the Fit By Valen App!", html: msg});
										}else if(trainer_id == "5a31715fea9bfe01e569a79e"){
											// Nienna Jade

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'nienna_jade_register_template.html'));
											mailer.sendMail({from: 'Nienna Jade <support@plankk.com>', to: user.email, subject: "Welcome to the Nienna Jade App!", html: msg});
										}else if(trainer_id == "5ababddaecc1ec1ffbd08c30"){
											// Bikni Boss

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bikni_boss_register_template.html'));
											mailer.sendMail({from: 'Bikini Boss <support@plankk.com>', to: user.email, subject: "Welcome to the Bikini Boss App!", html: msg});
										}else if(trainer_id == "5a5e36168887535a6f78b521"){
											// Jessie’s Girls
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'jessies_girls_register_template.html'));
											mailer.sendMail({from: 'Jessie’s Girls <support@plankk.com>', to: user.email, subject: "Welcome to the Jessie’s Girls App!", html: msg});
										}else if(trainer_id == "59e7a30ce1705864cc7cf355"){
											// Caroline De Campos

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'cdc_register_template.html'));
											mailer.sendMail({from: 'Caroline De Campos <support@plankk.com>', to: user.email, subject: "Welcome to the CDC Body App!", html: msg});
										}else if(trainer_id == "5ae1efea5058a545907d5f61"){
											// Janna App

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'train_with_janna_register.html'));
											mailer.sendMail({from: 'Train With Janna <support@plankk.com>', to: user.email, subject: "Welcome to the Train with Janna App!", html: msg});
										}else if(trainer_id == "5ad4dd4cc1ce3e3463753b50"){
											// Callie Bundy

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'callie_bundy_register.html'));
											mailer.sendMail({from: 'Callie Bundy <support@plankk.com>', to: user.email, subject: "Welcome to the Callie Bundy App!", html: msg});
										}else if(trainer_id == "5acd3eb90780015c1e9cc568"){
											// Get Loved Up

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Get_Loved_Up_register_template.html'));
											mailer.sendMail({from: 'Koya <support@plankk.com>', to: user.email, subject: "Welcome to the Get Loved Up App!", html: msg});
										}else if(trainer_id == "5b5746db5c3f964e6408b507"){
											// Bodymaze

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bodymaze_register_template.html'));
											mailer.sendMail({from: 'Bodymaze <support@plankk.com>', to: user.email, subject: "Welcome to the BodyMaze App!", html: msg});
										}else if(trainer_id == "5b3fac6ebb2b53737d1fe6cc"){
											// Body By Anita

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'body_by_anita_register_template.html'));
											mailer.sendMail({from: 'Anita Herbert <support@plankk.com>', to: user.email, subject: "Welcome to the Body By Anita App!", html: msg});
										}else if(trainer_id == "5b0d7e8f97e2f515d56b7fa3"){
											// Mariza

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mariza_register_template.html'));
											mailer.sendMail({from: 'Mariza Villarreal <support@plankk.com>', to: user.email, subject: "Welcome to the Mariza Villarreal App!", html: msg});
										}else if(trainer_id == "5b32b29430f0493180099e60"){
											// Get It Dunne

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Get_it_Dunne_register.html'));
											mailer.sendMail({from: 'Get It Dunne <support@plankk.com>', to: user.email, subject: "Welcome to the Get it Dunne App!", html: msg});
										}else if(trainer_id == "5b917a71b29b997460999b8f"){
											// Train with Tanya

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Tanya_register_template.html'));
											mailer.sendMail({from: 'Train with Tanya <support@plankk.com>', to: user.email, subject: "Welcome to the Train with Tanya App!", html: msg});
										}else if(trainer_id == "5bd9e069da6a6b3a240de6dd"){
											// Bakhar Nabieva
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bakhar_nabieva_register.html'));
											mailer.sendMail({from: 'Bakhar Nabiev <support@plankk.com>', to: user.email, subject: "Welcome to the Alien Gains App!", html: msg});
										}else if(trainer_id == "5bfc2525a2d6464827d1fbf5"){
											// The Iron Giantess
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Laura_micetich_register.html'));
											mailer.sendMail({from: 'The Iron Giantess <support@plankk.com>', to: user.email, subject: "Welcome to the Iron Giantess App!", html: msg});
										}else if(trainer_id == "5bd9de9ada6a6b3a240de595"){
											// Mandy Sacs
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mandy_sacs_register_template.html'));
											mailer.sendMail({from: 'Mandy <support@plankk.com>', to: user.email, subject: "Welcome to the Fit with Mandy App!", html: msg});
										}else if(trainer_id == "5ba3dad956d38558c5e5fbd7"){
											// Warrior Athlete

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Laura_Prestin_register.html'));
											mailer.sendMail({from: 'Warrior Athlete <support@plankk.com>', to: user.email, subject: "Welcome to the Warrior Athlete App!", html: msg});
										}else if(trainer_id == "5c58993f9485e03a2c042b30"){
											// Yarishna

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Yarishna_register_template.html'));
											mailer.sendMail({from: 'Yarishna Ayala <support@plankk.com>', to: user.email, subject: "Welcome to my Yarishna Fit community!", html: msg});
										}else if(trainer_id == "5cb5fb5ee6829f72a8c6b6d9"){
											// Theresa Miller

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'theresa_miller_register.html'));
											mailer.sendMail({from: 'Theresa Miller <support@plankk.com>', to: user.email, subject: " Welcome to my Theresa Miller App!", html: msg});
										}else if(trainer_id == "5c096ec07a55ad64617c8c8c"){
											// Ingrid Romero
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Ingrid_register_template.html'));
											mailer.sendMail({from: 'Edge Fit <support@plankk.com>', to: user.email, subject: " Thank you for joining my EdgeFit app community!", html: msg});
										}

									}
									var new_user = JSON.parse(JSON.stringify(user));
									delete new_user.profile;
									delete new_user.transactions;
									delete new_user.progress_pics;
									delete new_user.progress_pictures;

									var token = jwt.sign({user: new_user, name: user.email ? user.email : user.user, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
									if(user.verified && user.verified !== true){
										user.verified = false;
									}
									if(user.transactions) delete user.transactions;
									followUser(user._id.toString(), trainer_id, function(err, result){
										if(err){
											console.error(err);
										}
									});
									sendSuccess(res, {user: user, token: token});
								}
							});
						}

						if(req.files && req.files.length){
							var baseFolder = path.join(path.dirname(require.main.filename), "uploads/users/");

							Model.uploadFilesEx(req, baseFolder, (user.user).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
								if(!succeeded.length){
									sendError(res, "Failed to upload image");
								}else {
									user.profile.image = config.base_url+"uploads/users/"+succeeded.shift();
									saveUser();
								}
							});
						}else{
							saveUser();
						}

					}

					// check if any account exist for this email

					if(email && email.length){

						//check special case for Mike Chabot
						if(trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d") {
							var conditions2 = {email: email, trainer_id: { $in:[ "59791200cc447310747e731d", "59bc29ff25d96c751aa76b3d" ] }};
						}
						else{ // for All other APPS
							var conditions2 = { email: email, trainer_id: trainer_id, facebook_id: facebook_id };
						}
						model_user.find(conditions2).limit(1).next(function(err, emailExists){
							if(emailExists){
								return sendError(res, "Email already registered!");
							}
							_insertFBUser();
						});
					}else{
						_insertFBUser();
					}
				}
			});
		});
	});

	/**
		@@ INSTAGRAM LOGIN
	**/
	router.post('/loginInsta', function(req, res, next) {
		if(!req.body){
			return sendError(res, "Invalid Request!");
		}

		var instagram_id = req.body.instagram_id || "";
		var google_id = "";
		var device_token = req.body.device_token || "";
		var trainer_id = req.body.trainer_id;
		var email = req.body.email || "";
		var image = req.body.image || "";
		var name = req.body.name || "";
		var os_type = req.body.os_type || "";
		var phone = req.body.phone || "";

		if(!instagram_id){
			sendError(res, "Invalid Request!");
			return;
		}
		email = email.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');

		var conditions = { instagram_id: instagram_id, trainer_id: trainer_id };

		var model_user = Model.load('user', {}, function(err, model_user){
			model_user.find(conditions).limit(1).next(function(err, isUser){
				if(isUser) {

					model_user.updateOne({_id: isUser._id}, { $set: { "profile.last_seen": (new Date()).getTime() } }, {}, function(error, dbresult){

						// if(error) {
						// 	sendError(res, "Something went wrong, please try again:" +error);
						// } else{
							var new_user = JSON.parse(JSON.stringify(isUser));
							delete new_user.profile;
							delete new_user.transactions;
							delete new_user.progress_pics;
							delete new_user.progress_pictures;
							// update device token
							if(device_token) {
								updateDeviceToken(isUser._id, device_token, os_type);
							}
							var token = jwt.sign({user: new_user, name: isUser.name, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
							if(isUser.verified && isUser.verified !== true){
								isUser.verified = false;
							}
							if(isUser.transactions) delete isUser.transactions;
							sendSuccess(res, {token: token, user: isUser});
						// }
					})

				}else{

					var _insertInstaUser = function(){

						var user = {
							user: instagram_id,
							facebook_id: "",
							instagram_id: instagram_id,
							google_id: google_id,
							trainer_id: trainer_id,
							email: email,
							password: Model.password(generatePassword(6)),
							device_token: device_token,
							os_type: os_type,
							profile: {
								name: name,
								phone: phone,
								image: image,
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
								subscribed_plan: '0',
								active_plan_key: '',
								active_planid: 0,
								selected_trainer: '',
								last_seen: (new Date()).getTime()
							},
							joined_on: (new Date()).getTime(),
							subscribed_on: false,
							subscription: false,
							plans: [],
							progress_pictures: [],
							// current_plan: false,
							active: true,
							verified: true//generatePassword(12),
						};



						var saveUser = function(){
							model_user.insertOne(user, {}, function(err, insertedUser){
								if(err){
									sendError(res, "Failed to register user: "+err);
								}else {
									var new_user = JSON.parse(JSON.stringify(user));
									delete new_user.profile;
									delete new_user.transactions;
									delete new_user.progress_pics;
									delete new_user.progress_pictures;

									var token = jwt.sign({user: new_user, name: user.email ? user.email : user.user, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
									if(user.verified && user.verified !== true){
										user.verified = false;
									}
									if(user.transactions) delete user.transactions;
									followUser(user._id.toString(), trainer_id, function(err, result){
										if(err){
											console.error(err);
										}
									});
									sendSuccess(res, {user: user, token: token});
								}
							});
						}

						if(req.files && req.files.length){
							var baseFolder = path.join(path.dirname(require.main.filename), "uploads/users/");

							Model.uploadFilesEx(req, baseFolder, (user.user).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
								if(!succeeded.length){
									sendError(res, "Failed to upload image");
								}else {
									user.profile.image = config.base_url+"uploads/users/"+succeeded.shift();
									saveUser();
								}
							});
						}else{
							saveUser();
						}

					}

					// check if any account exist for this email

					if(email && email.length){

						var conditions2 = {email: email, trainer_id: trainer_id, instagram_id: instagram_id};

						model_user.find(conditions2).limit(1).next(function(err, emailExists){
							if(emailExists){
								return sendError(res, "Email already registered!");
							}else{
								_insertInstaUser();
							}
						});
					}else{
						_insertInstaUser();
					}
				}
			});
		});
	})

	router.post('/loginGoogle', function(req, res, next) {

		if(!req.body){
			return sendError(res, "Invalid Request!");
		}

		var google_id = req.body.google_id || "";
		var device_token = req.body.device_token || "";
		var trainer_id = req.body.trainer_id || '57c5310521bbac1d01aa75db';
		var email = req.body.email || "";
		var image = req.body.image || "";
		var name = req.body.name || "";
		var os_type = req.body.os_type || "";
		var phone = req.body.phone || "";
		var course_type = req.body.course_type || ""

		if(!google_id){
			sendError(res, "Invalid Request!");
			return;
		}

		email = email.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');
		//check special case for Mike Chabot
		if(trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d") {
			var conditions = {google_id: google_id, trainer_id: { $in:[ "59791200cc447310747e731d", "59bc29ff25d96c751aa76b3d" ] }};
		}
		else{ // for All other APPS
			var conditions = {google_id: google_id, trainer_id: trainer_id};
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			model_user.find(conditions).limit(1).next(function(err, isUser){
				if(isUser) {
					model_user.updateOne({_id: isUser._id}, { $set: { "profile.last_seen": (new Date()).getTime() } }, {}, function(error, dbresult){

						// if(error) {
					 // 		sendError(res, "Something went wrong, please try again:" +error);
						// } else{
							var new_user = JSON.parse(JSON.stringify(isUser));
							delete new_user.profile;
							delete new_user.transactions;
							delete new_user.progress_pics;

							// update device token
							if(device_token) {
								updateDeviceToken(isUser._id, device_token, os_type);
							}
							var token = jwt.sign({user: new_user, name: isUser.name, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
							if(isUser.verified && isUser.verified !== true){
								isUser.verified = false;
							}
							if(isUser.transactions) delete isUser.transactions;
							sendSuccess(res, {token: token, user: isUser});
						// }
					})
				}else{

					var _insertGoogleUser = function(){

						var user = {
							user: google_id,
							facebook_id: '',
							google_id: google_id,
							trainer_id: trainer_id,
							email: email,
							password: Model.password(generatePassword(6)),
							device_token: device_token,
							os_type: os_type,
							course_type: course_type,
							profile: {
								name: name,
								phone: phone,
								image: image,
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
								subscribed_plan: '0',
								active_plan_key: '',
								active_planid: 0,
								selected_trainer: '',
								last_seen: (new Date()).getTime()
							},
							joined_on: (new Date()).getTime(),
							subscribed_on: false,
							subscription: false,
							plans: [],
							progress_pictures: [],
							// current_plan: false,
							active: true,
							verified: true//generatePassword(12),
						};



						var saveUser = function(){
							model_user.insertOne(user, {}, function(err, insertedUser){
								if(err){
									sendError(res, "Failed to register user: "+err);
								}else {
									if(user.email){

										if(trainer_id == "57c5310521bbac1d01aa75db"){
											// Fit & Thick App

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'FnT_register_template.html'));
											mailer.sendMail({from: 'Nicole Mejia <info@getfitandthick.com>', to: user.email, subject: "Welcome to the Fit and Thick App!", html: msg});
										}else if(trainer_id == "5822bfb2b86828570dd90899"){
											// MTC app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'MTC_register_template.html'));
											mailer.sendMail({from: 'Carmen Morgan <support@plankk.com>', to: user.email, subject: "Welcome to My Trainer Carmen!", html: msg});
										}else if(trainer_id == "586f341b1cfef774222b1821"){
											// DFG app

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'DFG_register_template.html'));
											mailer.sendMail({from: 'Samantha Kozuch <support@plankk.com>', to: user.email, subject: "Welcome to Daily Fit Girl!", html: msg});
										}else if(trainer_id == "59177e86980aa43e2715a8ff"){
											// Madeleine Byrne app

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Madeleine_Byrne_register.html'));
											mailer.sendMail({from: 'Madeleine Byrne <support@plankk.com>', to: user.email, subject: "Welcome to the Madeleine Byrne App!", html: msg});
										}else if(trainer_id == "591c8094da9386315f51787e"){
											// Workouts By Gabriela app

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Gabriela_register.html'));
											mailer.sendMail({from: 'Gabriela Bandy <support@plankk.com>', to: user.email, subject: "Welcome to the Workouts By Gabriela App!", html: msg});
										}else if(trainer_id == "58f66e596e288005867db979"){
											// Minne Ninja app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'MN_register_template.html'));
											mailer.sendMail({from: 'Jennifer Tavernier <support@plankk.com>', to: user.email, subject: "Welcome to Minne Ninja App!", html: msg});
										}else if(trainer_id == "59177d25980aa43e2715a8fe"){
											// Nikki Rica Fit app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Nikki_register_template.html'));
											mailer.sendMail({from: 'Nikki Leonard <support@plankk.com>', to: user.email, subject: "Welcome to the Nikki Rica Fit App!", html: msg});
										}else if(trainer_id == "584fbe1dadbdd05d535cddae"){
											// TWL app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'TWL_register_template.html'));
											mailer.sendMail({from: 'Lyzabeth Lopez <support@plankk.com>', to: user.email, subject: "Welcome to the TWL App!", html: msg});
										}else if(trainer_id == "59791200cc447310747e731d"){
											// Mike Chabot app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mike_chabot_register_template.html'));
											mailer.sendMail({from: 'Mike Chabot <support@plankk.com>', to: user.email, subject: "Welcome to the Mike Chabot Fitness App!", html: msg});
										}else if(trainer_id == "59d52803ee5c705abefacc11"){
											// Oooh Baby Beast app

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'OBB_register_template.html'));
											mailer.sendMail({from: 'Kayli <support@plankk.com>', to: user.email, subject: "Welcome to the Oooh Baby Beast App!", html: msg});
										}else if(trainer_id == "59b174cfab77c775bae7c6a2"){
											// Fit With Whit app

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Fit_with_whit_register.html'));
											mailer.sendMail({from: 'Whitney <support@plankk.com>', to: user.email, subject: "Welcome to the Fit With Whit App!", html: msg});
										}else if(trainer_id == "59c02f07b271d505358da0bf"){
											// Arianny Celeste App

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Arianny_register_template.html'));
											mailer.sendMail({from: 'Arianny <support@plankk.com>', to: user.email, subject: "Welcome to the Arianny Celeste App!", html: msg});
										}else if(trainer_id == "597b8a331b54472074c2dd1a"){
											// Sugary Six Pack
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'ssp_register.html'));
											mailer.sendMail({from: 'SugarySixpack <support@plankk.com>', to: user.email, subject: "Welcome to the NEW SugarySixpack App!", html: msg});
										}else if(trainer_id == "59e4ea0878c2ed3818c7c0de"){
											// Lais DeLeon App
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Lais_register.html'));
											mailer.sendMail({from: 'Lais DeLeon <support@plankk.com>', to: user.email, subject: "Welcome to the Lais DeLeon App!", html: msg});
										}else if(trainer_id == "59b9ad9e446c6d65794a9bc9"){
											// Trav Beach Boy

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Trav_register.html'));
											mailer.sendMail({from: 'Trav Beach Boy <support@plankk.com>', to: user.email, subject: "Welcome to the Beach Body By Trav App!", html: msg});
										}else if(trainer_id == "5a270b18731edd456cb56f3b"){
											// Ashley K FIT

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'ashley_k_register.html'));
											mailer.sendMail({from: 'AshleyKFit <support@plankk.com>', to: user.email, subject: "Welcome to the AshleyKFit App!", html: msg});
										}else if(trainer_id == "59cd5272c1dc8268c5818cf0"){
											// Caitlin Rice Fit
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'caitlin_rice_fit_register_template.html'));
											mailer.sendMail({from: 'Caitlin Rice Fit <support@plankk.com>', to: user.email, subject: "Welcome to the Caitlin Rice Fit App!", html: msg});
										}else if(trainer_id == "5a60de980379ce6d1fecfec0"){
											// Body By Lynsee
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Lynsee_register_template.html'));
											mailer.sendMail({from: 'Body By Lynsee <support@plankk.com>', to: user.email, subject: "Welcome to the Body By Lynsee App!", html: msg});
										}else if(trainer_id == "5a3c25bf34d092539e01b020"){
											// HollY Barker
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'holly_barker_register_template.html'));
											mailer.sendMail({from: 'Holly Barker <support@plankk.com>', to: user.email, subject: "Welcome to the Holly Barker App!", html: msg});
										}else if(trainer_id == "5a690da90379ce6d1fed04ac"){
											// Tianna Gregory
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'tianna_gregory_register_template.html'));
											mailer.sendMail({from: 'Tianna Gregory <support@plankk.com>', to: user.email, subject: "Thanks for joining the Tianna Gregory Community!", html: msg});
										}else if(trainer_id == "5a5f8f628887535a6f78b66f"){
											// Julian and Austin
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'austin_julian_register_template.html'));
											mailer.sendMail({from: 'Julian and Austin <support@plankk.com>', to: user.email, subject: "Thanks for joining the Austin & Julian App!", html: msg});
										}else if(trainer_id == "5aa6e4c527d727022ed0a9a8"){
											// Cass Martin
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'cass_martin_register.html'));
											mailer.sendMail({from: 'Lift With Cass Martin <support@plankk.com>', to: user.email, subject: "Welcome to the Lift with Cass Martin App!", html: msg});
										}else if(trainer_id == "5a8c7aff14d55f7ad445a6f3"){
											// BoothCamp
											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'boothcamp_register_template.html'));
											mailer.sendMail({from: 'BOOTHCAMP <support@plankk.com>', to: user.email, subject: "Welcome to the BOOTHCAMP App!", html: msg});
										}else if(trainer_id == "5a9d7d110a4ae17da220a43e"){
											// Fit By Valen

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'fit_by_valen_register.html'));
											mailer.sendMail({from: 'Valen <support@plankk.com>', to: user.email, subject: "Welcome to the Fit By Valen App!", html: msg});
										}else if(trainer_id == "5a31715fea9bfe01e569a79e"){
											// Nienna Jade

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'nienna_jade_register_template.html'));
											mailer.sendMail({from: 'Nienna Jade <support@plankk.com>', to: user.email, subject: "Welcome to the Nienna Jade App!", html: msg});
										}else if(trainer_id == "5ababddaecc1ec1ffbd08c30"){
											// Bikni Boss

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bikni_boss_register_template.html'));
											mailer.sendMail({from: 'Bikini Boss <support@plankk.com>', to: user.email, subject: "Welcome to the Bikini Boss App!", html: msg});
										}else if(trainer_id == "5a5e36168887535a6f78b521"){
											// Jessie’s Girls

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'jessies_girls_register_template.html'));
											mailer.sendMail({from: 'Jessie’s Girls <support@plankk.com>', to: user.email, subject: "Welcome to the Jessie’s Girls App!", html: msg});
										}else if(trainer_id == "59e7a30ce1705864cc7cf355"){
											// Caroline De Campos

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'cdc_register_template.html'));
											mailer.sendMail({from: 'Caroline De Campos <support@plankk.com>', to: user.email, subject: "Welcome to the CDC Body App!", html: msg});
										}else if(trainer_id == "5ae1efea5058a545907d5f61"){
											// Janna App

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'train_with_janna_register.html'));
											mailer.sendMail({from: 'Train With Janna <support@plankk.com>', to: user.email, subject: "Welcome to the Train with Janna App!", html: msg});
										}else if(trainer_id == "5ad4dd4cc1ce3e3463753b50"){
											// Callie Bundy

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'callie_bundy_register.html'));
											mailer.sendMail({from: 'Callie Bundy <support@plankk.com>', to: user.email, subject: "Welcome to the Callie Bundy App!", html: msg});
										}else if(trainer_id == "5acd3eb90780015c1e9cc568"){
											// Get Loved Up

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Get_Loved_Up_register_template.html'));
											mailer.sendMail({from: 'Koya <support@plankk.com>', to: user.email, subject: "Welcome to the Get Loved Up App!", html: msg});
										}else if(trainer_id == "5b5746db5c3f964e6408b507"){
											// Bodymaze

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bodymaze_register_template.html'));
											mailer.sendMail({from: 'Bodymaze <support@plankk.com>', to: user.email, subject: "Welcome to the BodyMaze App!", html: msg});
										}else if(trainer_id == "5b3fac6ebb2b53737d1fe6cc"){
											// Body By Anita

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'body_by_anita_register_template.html'));
											mailer.sendMail({from: 'Anita Herbert <support@plankk.com>', to: user.email, subject: "Welcome to the Body By Anita App!", html: msg});
										}else if(trainer_id == "5b0d7e8f97e2f515d56b7fa3"){
											// Mariza

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mariza_register_template.html'));
											mailer.sendMail({from: 'Mariza Villarreal <support@plankk.com>', to: user.email, subject: "Welcome to the Mariza Villarreal App!", html: msg});
										}else if(trainer_id == "5b32b29430f0493180099e60"){
											// Get It Dunne
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Get_it_Dunne_register.html'));
											mailer.sendMail({from: 'Get It Dunne <support@plankk.com>', to: user.email, subject: "Welcome to the Get it Dunne App!", html: msg});
										}else if(trainer_id == "5b917a71b29b997460999b8f"){
											// Train with Tanya
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Tanya_register_template.html'));
											mailer.sendMail({from: 'Train with Tanya <support@plankk.com>', to: user.email, subject: "Welcome to the Train with Tanya App!", html: msg});
										}else if(trainer_id == "5bd9e069da6a6b3a240de6dd"){
											// Bakhar Nabieva

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bakhar_nabieva_register.html'));
											mailer.sendMail({from: 'Bakhar Nabiev <support@plankk.com>', to: user.email, subject: "Welcome to the Alien Gains App!", html: msg});
										}else if(trainer_id == "5bfc2525a2d6464827d1fbf5"){
											// The Iron Giantess
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Laura_micetich_register.html'));
											mailer.sendMail({from: 'The Iron Giantess <support@plankk.com>', to: user.email, subject: "Welcome to the Iron Giantess App!", html: msg});
										}else if(trainer_id == "5bd9de9ada6a6b3a240de595"){
											// Mandy Sacs
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mandy_sacs_register_template.html'));
											mailer.sendMail({from: 'Mandy <support@plankk.com>', to: user.email, subject: "Welcome to the Fit with Mandy App!", html: msg});
										}else if(trainer_id == "5ba3dad956d38558c5e5fbd7"){
											// Warrior Athlete											
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Laura_Prestin_register.html'));
											mailer.sendMail({from: 'Warrior Athlete <support@plankk.com>', to: user.email, subject: "Welcome to the Warrior Athlete App!", html: msg});
										}else if(trainer_id == "5c58993f9485e03a2c042b30"){
											// Yarishna
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Yarishna_register_template.html'));
											mailer.sendMail({from: 'Yarishna Ayala <support@plankk.com>', to: user.email, subject: "Welcome to my Yarishna Fit community!", html: msg});
										}else if(trainer_id == "5cb5fb5ee6829f72a8c6b6d9"){
											// Theresa Miller

											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'theresa_miller_register.html'));
											mailer.sendMail({from: 'Theresa Miller <support@plankk.com>', to: user.email, subject: " Welcome to my Theresa Miller App!", html: msg});
										}else if(trainer_id == "5c096ec07a55ad64617c8c8c"){
											// Ingrid Romero
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Ingrid_register_template.html'));
											mailer.sendMail({from: 'Edge Fit <support@plankk.com>', to: user.email, subject: " Thank you for joining my EdgeFit app community!", html: msg});
										}

									}
									var new_user = JSON.parse(JSON.stringify(user));
									delete new_user.profile;
									delete new_user.transactions;
									delete new_user.progress_pics;

									var token = jwt.sign({user: new_user, name: user.email ? user.email : user.user, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
									if(user.verified && user.verified !== true){
										user.verified = false;
									}
									if(user.transactions) delete user.transactions;
									followUser(user._id.toString(), trainer_id, function(err, result){
										if(err){
											console.error(err);
										}
									});
									sendSuccess(res, {user: user, token: token});
								}
							});
						}

						if(req.files && req.files.length){
							var baseFolder = path.join(path.dirname(require.main.filename), "uploads/users/");

							Model.uploadFilesEx(req, baseFolder, (user.user).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
								if(!succeeded.length){
									sendError(res, "Failed to upload image");
								}else {
									user.profile.image = config.base_url+"uploads/users/"+succeeded.shift();
									saveUser();
								}
							});
						}else{
							saveUser();
						}

					}

					if(email && email.length){
						// check if any account exist for this email

						//check special case for Mike Chabot
						if(trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d") {
							var conditions2 = {email: email, trainer_id: { $in:[ "59791200cc447310747e731d", "59bc29ff25d96c751aa76b3d" ] }};
						}
						else{ // for All other APPS
							var conditions2 = {email: email, trainer_id: trainer_id};
						}
						model_user.find(conditions2).limit(1).next(function(err, emailExists){
							if(emailExists){
								return sendError(res, "Email already registered!");
							}
							_insertGoogleUser();
						});
					}else{
						_insertGoogleUser();
					}
				}
			});
		});
	});

	/**
		@@ Apple Login
		@@ Input apple_id
	**/

	router.post('/loginWithApple', function(req, res, next) {
		if(!req.body){
			return sendError(res, "Invalid Request!");
		}

		var apple_id = req.body.apple_id || "";
		var device_token = req.body.device_token || "";
		var trainer_id = req.body.trainer_id;
		var email = req.body.email || "";
		var image = req.body.image || "";
		var name = req.body.name || "";
		var os_type = req.body.os_type || "";
		var phone = req.body.phone || "";
		var course_type = req.body.course_type || "";

		if(!apple_id){
			sendError(res, "Invalid Request!");
			return;
		}
		email = email.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');

		var conditions = { apple_id: apple_id, trainer_id: trainer_id };

		var model_user = Model.load('user', {}, function(err, model_user){
			model_user.find(conditions).limit(1).next(function(err, isUser){
				if(isUser) {

					model_user.updateOne({_id: isUser._id}, { $set: { "profile.last_seen": (new Date()).getTime() } }, {}, function(error, dbresult){

							var new_user = JSON.parse(JSON.stringify(isUser));
							delete new_user.profile;
							delete new_user.transactions;
							delete new_user.progress_pics;
							delete new_user.progress_pictures;
							// update device token
							if(device_token) {
								updateDeviceToken(isUser._id, device_token, os_type);
							}
							var token = jwt.sign({user: new_user, name: isUser.name, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
							if(isUser.verified && isUser.verified !== true){
								isUser.verified = false;
							}
							if(isUser.transactions) delete isUser.transactions;
							sendSuccess(res, {token: token, user: isUser});
					})

				}else{

					var _insertAppleUser = function(){

						var user = {
							user: apple_id,
							facebook_id: "",
							apple_id: apple_id,
							google_id: "",
							trainer_id: trainer_id,
							email: email,
							password: Model.password(generatePassword(6)),
							device_token: device_token,
							os_type: os_type,
							course_type: course_type,
							profile: {
								name: name,
								phone: phone,
								image: image,
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
								subscribed_plan: '0',
								active_plan_key: '',
								active_planid: 0,
								selected_trainer: '',
								last_seen: (new Date()).getTime()
							},
							joined_on: (new Date()).getTime(),
							subscribed_on: false,
							subscription: false,
							plans: [],
							progress_pictures: [],
							// current_plan: false,
							active: true,
							verified: true//generatePassword(12),
						};

						

						var saveUser = function(){
							model_user.insertOne(user, {}, function(err, insertedUser){
								if(err){
									sendError(res, "Failed to register user: "+err);
								}else {
									if(user.email){
										if(trainer_id == "57c5310521bbac1d01aa75db"){
											// Fit & Thick App
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'FnT_register_template.html'));
											mailer.sendMail({from: 'Nicole Mejia <info@getfitandthick.com>', to: user.email, subject: "Welcome to the Fit and Thick App!", html: msg});
										}else if(trainer_id == "5822bfb2b86828570dd90899"){
											// MTC app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'MTC_register_template.html'));
											mailer.sendMail({from: 'Carmen Morgan <support@plankk.com>', to: user.email, subject: "Welcome to My Trainer Carmen!", html: msg});
										}else if(trainer_id == "586f341b1cfef774222b1821"){
											// DFG app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'DFG_register_template.html'));
											mailer.sendMail({from: 'Samantha Kozuch <support@plankk.com>', to: user.email, subject: "Welcome to Daily Fit Girl!", html: msg});
										}else if(trainer_id == "59177e86980aa43e2715a8ff"){
											// Madeleine Byrne app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Madeleine_Byrne_register.html'));
											mailer.sendMail({from: 'Madeleine Byrne <support@plankk.com>', to: user.email, subject: "Welcome to the Madeleine Byrne App!", html: msg});
										}else if(trainer_id == "591c8094da9386315f51787e"){
											// Workouts By Gabriela app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Gabriela_register.html'));
											mailer.sendMail({from: 'Gabriela Bandy <support@plankk.com>', to: user.email, subject: "Welcome to the Workouts By Gabriela App!", html: msg});
										}else if(trainer_id == "58f66e596e288005867db979"){
											// Minne Ninja app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'MN_register_template.html'));
											mailer.sendMail({from: 'Jennifer Tavernier <support@plankk.com>', to: user.email, subject: "Welcome to Minne Ninja App!", html: msg});
										}else if(trainer_id == "59177d25980aa43e2715a8fe"){
											// Nikki Rica Fit app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Nikki_register_template.html'));
											mailer.sendMail({from: 'Nikki Leonard <support@plankk.com>', to: user.email, subject: "Welcome to the Nikki Rica Fit App!", html: msg});
										}else if(trainer_id == "584fbe1dadbdd05d535cddae"){
											// TWL app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'TWL_register_template.html'));
											mailer.sendMail({from: 'Lyzabeth Lopez <support@plankk.com>', to: user.email, subject: "Welcome to the TWL App!", html: msg});
										}else if(trainer_id == "59791200cc447310747e731d"){
											// Mike Chabot app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mike_chabot_register_template.html'));
											mailer.sendMail({from: 'Mike Chabot <support@plankk.com>', to: user.email, subject: "Welcome to the Mike Chabot Fitness App!", html: msg});
										}else if(trainer_id == "59d52803ee5c705abefacc11"){
											// Oooh Baby Beast app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'OBB_register_template.html'));
											mailer.sendMail({from: 'Kayli <support@plankk.com>', to: user.email, subject: "Welcome to the Oooh Baby Beast App!", html: msg});
										}else if(trainer_id == "59b174cfab77c775bae7c6a2"){
											// Fit With Whit app
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Fit_with_whit_register.html'));
											mailer.sendMail({from: 'Whitney <support@plankk.com>', to: user.email, subject: "Welcome to the Fit With Whit App!", html: msg});
										}else if(trainer_id == "59c02f07b271d505358da0bf"){
											// Arianny Celeste App
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Arianny_register_template.html'));
											mailer.sendMail({from: 'Arianny <support@plankk.com>', to: user.email, subject: "Welcome to the Arianny Celeste App!", html: msg});
										}else if(trainer_id == "597b8a331b54472074c2dd1a"){
											// Sugary Six Pack
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'ssp_register.html'));
											mailer.sendMail({from: 'SugarySixpack <support@plankk.com>', to: user.email, subject: "Welcome to the NEW SugarySixpack App!", html: msg});
										}else if(trainer_id == "59e4ea0878c2ed3818c7c0de"){
											// Lais DeLeon App
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Lais_register.html'));
											mailer.sendMail({from: 'Lais DeLeon <support@plankk.com>', to: user.email, subject: "Welcome to the Lais DeLeon App!", html: msg});
										}else if(trainer_id == "59b9ad9e446c6d65794a9bc9"){
											// Trav Beach Boy
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Trav_register.html'));
											mailer.sendMail({from: 'Trav Beach Boy <support@plankk.com>', to: user.email, subject: "Welcome to the Beach Body By Trav App!", html: msg});
										}else if(trainer_id == "5a270b18731edd456cb56f3b"){
											// Ashley K FIT
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'ashley_k_register.html'));
											mailer.sendMail({from: 'AshleyKFit <support@plankk.com>', to: user.email, subject: "Welcome to the AshleyKFit App!", html: msg});
										}else if(trainer_id == "59cd5272c1dc8268c5818cf0"){
											// Caitlin Rice Fit
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'caitlin_rice_fit_register_template.html'));
											mailer.sendMail({from: 'Caitlin Rice Fit <support@plankk.com>', to: user.email, subject: "Welcome to the Caitlin Rice Fit App!", html: msg});
										}else if(trainer_id == "5a60de980379ce6d1fecfec0"){
											// Body By Lynsee
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Lynsee_register_template.html'));
											mailer.sendMail({from: 'Body By Lynsee <support@plankk.com>', to: user.email, subject: "Welcome to the Body By Lynsee App!", html: msg});
										}else if(trainer_id == "5a3c25bf34d092539e01b020"){
											// HollY Barker
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'holly_barker_register_template.html'));
											mailer.sendMail({from: 'Holly Barker <support@plankk.com>', to: user.email, subject: "Welcome to the Holly Barker App!", html: msg});
										}else if(trainer_id == "5a690da90379ce6d1fed04ac"){
											// Tianna Gregory
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'tianna_gregory_register_template.html'));
											mailer.sendMail({from: 'Tianna Gregory <support@plankk.com>', to: user.email, subject: "Thanks for joining the Tianna Gregory Community!", html: msg});
										}else if(trainer_id == "5a5f8f628887535a6f78b66f"){
											// Julian and Austin
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'austin_julian_register_template.html'));
											mailer.sendMail({from: 'Julian and Austin <support@plankk.com>', to: user.email, subject: "Thanks for joining the Austin & Julian App!", html: msg});
										}else if(trainer_id == "5aa6e4c527d727022ed0a9a8"){
											// Cass Martin
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'cass_martin_register.html'));
											mailer.sendMail({from: 'Lift With Cass Martin <support@plankk.com>', to: user.email, subject: "Welcome to the Lift with Cass Martin App!", html: msg});
										}else if(trainer_id == "5a8c7aff14d55f7ad445a6f3"){
											// BoothCamp
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'boothcamp_register_template.html'));
											mailer.sendMail({from: 'BOOTHCAMP <support@plankk.com>', to: user.email, subject: "Welcome to the BOOTHCAMP App!", html: msg});
										}else if(trainer_id == "5a9d7d110a4ae17da220a43e"){
											// Fit By Valen
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'fit_by_valen_register.html'));
											mailer.sendMail({from: 'Valen <support@plankk.com>', to: user.email, subject: "Welcome to the Fit By Valen App!", html: msg});
										}else if(trainer_id == "5a31715fea9bfe01e569a79e"){
											// Nienna Jade
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'nienna_jade_register_template.html'));
											mailer.sendMail({from: 'Nienna Jade <support@plankk.com>', to: user.email, subject: "Welcome to the Nienna Jade App!", html: msg});
										}else if(trainer_id == "5ababddaecc1ec1ffbd08c30"){
											// Bikni Boss
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bikni_boss_register_template.html'));
											mailer.sendMail({from: 'Bikini Boss <support@plankk.com>', to: user.email, subject: "Welcome to the Bikini Boss App!", html: msg});
										}else if(trainer_id == "5a5e36168887535a6f78b521"){
											// Jessie’s Girls
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'jessies_girls_register_template.html'));
											mailer.sendMail({from: 'Jessie’s Girls <support@plankk.com>', to: user.email, subject: "Welcome to the Jessie’s Girls App!", html: msg});
										}else if(trainer_id == "59e7a30ce1705864cc7cf355"){
											// Caroline De Campos
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'cdc_register_template.html'));
											mailer.sendMail({from: 'Caroline De Campos <support@plankk.com>', to: user.email, subject: "Welcome to the CDC Body App!", html: msg});
										}else if(trainer_id == "5ae1efea5058a545907d5f61"){
											// Janna App
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'train_with_janna_register.html'));
											mailer.sendMail({from: 'Train With Janna <support@plankk.com>', to: user.email, subject: "Welcome to the Train with Janna App!", html: msg});
										}else if(trainer_id == "5ad4dd4cc1ce3e3463753b50"){
											// Callie Bundy
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'callie_bundy_register.html'));
											mailer.sendMail({from: 'Callie Bundy <support@plankk.com>', to: user.email, subject: "Welcome to the Callie Bundy App!", html: msg});
										}else if(trainer_id == "5acd3eb90780015c1e9cc568"){
											// Get Loved Up
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Get_Loved_Up_register_template.html'));
											mailer.sendMail({from: 'Koya <support@plankk.com>', to: user.email, subject: "Welcome to the Get Loved Up App!", html: msg});
										}else if(trainer_id == "5b5746db5c3f964e6408b507"){
											// Bodymaze
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bodymaze_register_template.html'));
											mailer.sendMail({from: 'Bodymaze <support@plankk.com>', to: user.email, subject: "Welcome to the BodyMaze App!", html: msg});
										}else if(trainer_id == "5b3fac6ebb2b53737d1fe6cc"){
											// Body By Anita
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'body_by_anita_register_template.html'));
											mailer.sendMail({from: 'Anita Herbert <support@plankk.com>', to: user.email, subject: "Welcome to the Body By Anita App!", html: msg});
										}else if(trainer_id == "5b0d7e8f97e2f515d56b7fa3"){
											// Mariza
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mariza_register_template.html'));
											mailer.sendMail({from: 'Mariza Villarreal <support@plankk.com>', to: user.email, subject: "Welcome to the Mariza Villarreal App!", html: msg});
										}else if(trainer_id == "5b32b29430f0493180099e60"){
											// Get It Dunne
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Get_it_Dunne_register.html'));
											mailer.sendMail({from: 'Get It Dunne <support@plankk.com>', to: user.email, subject: "Welcome to the Get it Dunne App!", html: msg});
										}else if(trainer_id == "5b917a71b29b997460999b8f"){
											// Train with Tanya
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Tanya_register_template.html'));
											mailer.sendMail({from: 'Train with Tanya <support@plankk.com>', to: user.email, subject: "Welcome to the Train with Tanya App!", html: msg});
										}else if(trainer_id == "5bd9e069da6a6b3a240de6dd"){
											// Bakhar Nabieva
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bakhar_nabieva_register.html'));
											mailer.sendMail({from: 'Bakhar Nabiev <support@plankk.com>', to: user.email, subject: "Welcome to the Alien Gains App!", html: msg});
										}else if(trainer_id == "5bfc2525a2d6464827d1fbf5"){
											// The Iron Giantess
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Laura_micetich_register.html'));
											mailer.sendMail({from: 'The Iron Giantess <support@plankk.com>', to: user.email, subject: "Welcome to the Iron Giantess App!", html: msg});
										}else if(trainer_id == "5bd9de9ada6a6b3a240de595"){
											// Mandy Sacs
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mandy_sacs_register_template.html'));
											mailer.sendMail({from: 'Mandy <support@plankk.com>', to: user.email, subject: "Welcome to the Fit with Mandy App!", html: msg});
										}else if(trainer_id == "5ba3dad956d38558c5e5fbd7"){
											// Warrior Athlete
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Laura_Prestin_register.html'));
											mailer.sendMail({from: 'Warrior Athlete <support@plankk.com>', to: user.email, subject: "Welcome to the Warrior Athlete App!", html: msg});
										}else if(trainer_id == "5c58993f9485e03a2c042b30"){
											// Yarishna
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Yarishna_register_template.html'));
											mailer.sendMail({from: 'Yarishna Ayala <support@plankk.com>', to: user.email, subject: "Welcome to my Yarishna Fit community!", html: msg});
										}else if(trainer_id == "5cb5fb5ee6829f72a8c6b6d9"){
											// Theresa Miller
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'theresa_miller_register.html'));
											mailer.sendMail({from: 'Theresa Miller <support@plankk.com>', to: user.email, subject: " Welcome to my Theresa Miller App!", html: msg});
										}else if(trainer_id == "5c096ec07a55ad64617c8c8c"){
											// Ingrid Romero
											var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Ingrid_register_template.html'));
											mailer.sendMail({from: 'Edge Fit <support@plankk.com>', to: user.email, subject: " Thank you for joining my EdgeFit app community!", html: msg});
										}
									}
									var new_user = JSON.parse(JSON.stringify(user));
									delete new_user.profile;
									delete new_user.transactions;
									delete new_user.progress_pics;
									delete new_user.progress_pictures;

									var token = jwt.sign({user: new_user, name: user.email ? user.email : user.user, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
									if(user.verified && user.verified !== true){
										user.verified = false;
									}
									if(user.transactions) delete user.transactions;
									followUser(user._id.toString(), trainer_id, function(err, result){
										if(err){
											console.log(err);
										}else{
											console.log("User Follows Entry", result);
										}
									});
									sendSuccess(res, {user: user, token: token});
								}
							});
						}

						if(req.files && req.files.length){
							var baseFolder = path.join(path.dirname(require.main.filename), "uploads/users/");

							Model.uploadFilesEx(req, baseFolder, (user.user).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
								if(!succeeded.length){
									sendError(res, "Failed to upload image");
								}else {
									user.profile.image = config.base_url+"uploads/users/"+succeeded.shift();
									saveUser();
								}
							});
						}else{
							saveUser();
						}
					
					}

					// check if any account exist for this email

					if(email && email.length){

						var conditions2 = {email: email, trainer_id: trainer_id, apple_id: apple_id};

						model_user.find(conditions2).limit(1).next(function(err, emailExists){
							if(emailExists){
								return sendError(res, "Email already registered!");
							}else{
								_insertAppleUser();
							}
						});
					}else{
						_insertAppleUser();
					}
				}
			});
		});
	})



	function generatePassword(N){
		var s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		return Array(N).join().split(',').map(function() { return s.charAt(Math.floor(Math.random() * s.length)); }).join('');

	}



	/**
		@@ Create New User
		@@ APP User
		@@ AUTHOR- WEGILE
	**/

	router.put('/', function(req, res, next){
		if(!req.body){
			return sendError(res, "Required parameters missing!");
		}

		var email = req.body.email || '';
		var password = req.body.password || '';
		var device_token = req.body.device_token || '';
		var trainer_id = req.body.trainer_id || '57c5310521bbac1d01aa75db';
		var facebook_id = "";
		var name = req.body.name || "";
		var os_type = req.body.os_type || "";
		var phone = req.body.phone || "";
		var course_type = req.body.course_type || ""

		email = email.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');

		if(!email){
			return sendError(res, "Email missing!");
		}

		if(!password){
			password = generatePassword(6);
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}
			//check special case for Mike Chabot
			if(trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d") {
				var conditions = {email: email, trainer_id: {$in:[ "59791200cc447310747e731d", "59bc29ff25d96c751aa76b3d" ] } };
			}
			else{ // for All other APPS
				var conditions = {email: email, trainer_id: trainer_id };
			}
			model_user.find(conditions).limit(1).next(function(err, existingUser){
				if(err){
					return sendError(res, "Something went wrong: "+err);
				}

				if(existingUser){
					return sendError(res, "Email already registered!");
				}

				var user = {
					user: email,
					email: email,
					facebook_id: "",
					google_id: "",
					trainer_id: trainer_id,
					password: Model.password(password),
					device_token: device_token,
					os_type: os_type,
					course_type: course_type,
					profile: {
						name: name,
						phone: phone,
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
						subscribed_plan: '0',
						active_plan_key: '',
						active_planid: 0,
						selected_trainer: '',
						last_seen: (new Date()).getTime()
					},
					joined_on: (new Date()).getTime(),
					subscribed_on: false,
					subscription: false,
					plans: [],
					progress_pictures: [],
					active: true,
					verified: true//generatePassword(12),
				};

				if(model_user.verify(user)){

					var saveUser = function(){
						model_user.insertOne(user, {}, function(err, insertedUser){
							if(err){
								sendError(res, "Failed to register user: "+err);
							}else {
								
								if(trainer_id == "57c5310521bbac1d01aa75db"){
									// Fit & Thick App

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'FnT_register_template.html'));
									mailer.sendMail({from: 'Nicole Mejia <info@getfitandthick.com>', to: user.email, subject: "Welcome to the Fit and Thick App!", html: msg});
								}else if(trainer_id == "5822bfb2b86828570dd90899"){
									// MTC app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'MTC_register_template.html'));
									mailer.sendMail({from: 'Carmen Morgan <support@plankk.com>', to: user.email, subject: "Welcome to My Trainer Carmen!", html: msg});
								}else if(trainer_id == "586f341b1cfef774222b1821"){
									// DFG app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'DFG_register_template.html'));
									mailer.sendMail({from: 'Samantha Kozuch <support@plankk.com>', to: user.email, subject: "Welcome to Daily Fit Girl!", html: msg});
								}else if(trainer_id == "59177e86980aa43e2715a8ff"){
									// Madeleine Byrne app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Madeleine_Byrne_register.html'));
									mailer.sendMail({from: ' Madeleine Byrne <support@plankk.com>', to: user.email, subject: "Welcome to the Madeleine Byrne App!", html: msg});
								}else if(trainer_id == "591c8094da9386315f51787e"){
									// Workouts By Gabriela app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Gabriela_register.html'));
									mailer.sendMail({from: 'Gabriela Bandy <support@plankk.com>', to: user.email, subject: "Welcome to the Workouts By Gabriela App!", html: msg});
								}else if(trainer_id == "58f66e596e288005867db979"){
									// Minne Ninja app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'MN_register_template.html'));
									mailer.sendMail({from: 'Jennifer Tavernier <support@plankk.com>', to: user.email, subject: "Welcome to Minne Ninja App!", html: msg});
								}else if(trainer_id == "59177d25980aa43e2715a8fe"){
									// Nikki Rica Fit app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Nikki_register_template.html'));
									mailer.sendMail({from: 'Nikki Leonard <support@plankk.com>', to: user.email, subject: "Welcome to the Nikki Rica Fit App!", html: msg});
								}else if(trainer_id == "584fbe1dadbdd05d535cddae"){
									// TWL app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'TWL_register_template.html'));
									mailer.sendMail({from: 'Lyzabeth Lopez <support@plankk.com>', to: user.email, subject: "Welcome to the TWL App!", html: msg});
								}else if(trainer_id == "59791200cc447310747e731d"){
									// Mike Chabot app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mike_chabot_register_template.html'));
									mailer.sendMail({from: 'Mike Chabot <support@plankk.com>', to: user.email, subject: "Welcome to the Mike Chabot Fitness App!", html: msg});
								}else if(trainer_id == "59d52803ee5c705abefacc11"){
									// Oooh Baby Beast app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'OBB_register_template.html'));
									mailer.sendMail({from: 'Kayli <support@plankk.com>', to: user.email, subject: "Welcome to the Oooh Baby Beast App!", html: msg});
								}else if(trainer_id == "59b174cfab77c775bae7c6a2"){
									// Fit With Whit app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Fit_with_whit_register.html'));
									mailer.sendMail({from: 'Whitney <support@plankk.com>', to: user.email, subject: "Welcome to the Fit With Whit App!", html: msg});
								}else if(trainer_id == "59c02f07b271d505358da0bf"){
									// Arianny Celeste App
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Arianny_register_template.html'));
									mailer.sendMail({from: 'Arianny <support@plankk.com>', to: user.email, subject: "Welcome to the Arianny Celeste App!", html: msg});
								}else if(trainer_id == "597b8a331b54472074c2dd1a"){
									// Sugary Six Pack
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'ssp_register.html'));
									mailer.sendMail({from: 'SugarySixpack <support@plankk.com>', to: user.email, subject: "Welcome to the NEW SugarySixpack App!", html: msg});
								}else if(trainer_id == "59e4ea0878c2ed3818c7c0de"){
									// Lais DeLeon App
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Lais_register.html'));
									mailer.sendMail({from: 'Lais DeLeon <support@plankk.com>', to: user.email, subject: "Welcome to the Lais DeLeon App!", html: msg});
								}else if(trainer_id == "59b9ad9e446c6d65794a9bc9"){
									// Trav Beach Boy
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Trav_register.html'));
									mailer.sendMail({from: 'Trav Beach Boy <support@plankk.com>', to: user.email, subject: "Welcome to the Beach Body By Trav App!", html: msg});
								}else if(trainer_id == "5a270b18731edd456cb56f3b"){
									// Ashley K FIT
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'ashley_k_register.html'));
									mailer.sendMail({from: 'AshleyKFit <support@plankk.com>', to: user.email, subject: "Welcome to the AshleyKFit App!", html: msg});
								}else if(trainer_id == "59cd5272c1dc8268c5818cf0"){
									// Caitlin Rice Fit
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'caitlin_rice_fit_register_template.html'));
									mailer.sendMail({from: 'Caitlin Rice Fit <support@plankk.com>', to: user.email, subject: "Welcome to the Caitlin Rice Fit App!", html: msg});
								}else if(trainer_id == "5a60de980379ce6d1fecfec0"){
									// Body By Lynsee
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Lynsee_register_template.html'));
									mailer.sendMail({from: 'Body By Lynsee <support@plankk.com>', to: user.email, subject: "Welcome to the Body By Lynsee App!", html: msg});
								}else if(trainer_id == "5a3c25bf34d092539e01b020"){
									// HollY Barker
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'holly_barker_register_template.html'));
									mailer.sendMail({from: 'Holly Barker <support@plankk.com>', to: user.email, subject: "Welcome to the Holly Barker App!", html: msg});
								}else if(trainer_id == "5a690da90379ce6d1fed04ac"){
									// Tianna Gregory
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'tianna_gregory_register_template.html'));
									mailer.sendMail({from: 'Tianna Gregory <support@plankk.com>', to: user.email, subject: "Thanks for joining the Tianna Gregory Community!", html: msg});
								}else if(trainer_id == "5a5f8f628887535a6f78b66f"){
									// Julian and Austin
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'austin_julian_register_template.html'));
									mailer.sendMail({from: 'Julian and Austin <support@plankk.com>', to: user.email, subject: "Thanks for joining the Austin & Julian App!", html: msg});
								}else if(trainer_id == "5aa6e4c527d727022ed0a9a8"){
									// Cass Martin
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'cass_martin_register.html'));
									mailer.sendMail({from: 'Lift With Cass Martin <support@plankk.com>', to: user.email, subject: "Welcome to the Lift with Cass Martin App!", html: msg});
								}else if(trainer_id == "5a8c7aff14d55f7ad445a6f3"){
									// BoothCamp
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'boothcamp_register_template.html'));
									mailer.sendMail({from: 'BOOTHCAMP <support@plankk.com>', to: user.email, subject: "Welcome to the BOOTHCAMP App!", html: msg});
								}else if(trainer_id == "5a9d7d110a4ae17da220a43e"){
									// Fit By Valen
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'fit_by_valen_register.html'));
									mailer.sendMail({from: 'Valen <support@plankk.com>', to: user.email, subject: "Welcome to the Fit By Valen App!", html: msg});
								}else if(trainer_id == "5a31715fea9bfe01e569a79e"){
									// Nienna Jade
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'nienna_jade_register_template.html'));
									mailer.sendMail({from: 'Nienna Jade <support@plankk.com>', to: user.email, subject: "Welcome to the Nienna Jade App!", html: msg});
								}else if(trainer_id == "5ababddaecc1ec1ffbd08c30"){
									// Bikni Boss
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bikni_boss_register_template.html'));
									mailer.sendMail({from: 'Bikini Boss <support@plankk.com>', to: user.email, subject: "Welcome to the Bikini Boss App!", html: msg});
								}else if(trainer_id == "5a5e36168887535a6f78b521"){
									// Jessie’s Girls
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'jessies_girls_register_template.html'));
									mailer.sendMail({from: 'Jessie’s Girls <support@plankk.com>', to: user.email, subject: "Welcome to the Jessie’s Girls App!", html: msg});
								}else if(trainer_id == "59e7a30ce1705864cc7cf355"){
									// Caroline De Campos
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'cdc_register_template.html'));
									mailer.sendMail({from: 'Caroline De Campos <support@plankk.com>', to: user.email, subject: "Welcome to the CDC Body App!", html: msg});
								}else if(trainer_id == "5ae1efea5058a545907d5f61"){
									// Janna App
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'train_with_janna_register.html'));
									mailer.sendMail({from: 'Train With Janna <support@plankk.com>', to: user.email, subject: "Welcome to the Train with Janna App!", html: msg});
								}else if(trainer_id == "5ad4dd4cc1ce3e3463753b50"){
									// Callie Bundy
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'callie_bundy_register.html'));
									mailer.sendMail({from: 'Callie Bundy <support@plankk.com>', to: user.email, subject: "Welcome to the Callie Bundy App!", html: msg});
								}else if(trainer_id == "5acd3eb90780015c1e9cc568"){
									// Get Loved Up
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Get_Loved_Up_register_template.html'));
									mailer.sendMail({from: 'Koya <support@plankk.com>', to: user.email, subject: "Welcome to the Get Loved Up App!", html: msg});
								}else if(trainer_id == "5b5746db5c3f964e6408b507"){
									// Bodymaze
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bodymaze_register_template.html'));
									mailer.sendMail({from: 'Bodymaze <support@plankk.com>', to: user.email, subject: "Welcome to the BodyMaze App!", html: msg});
								}else if(trainer_id == "5b3fac6ebb2b53737d1fe6cc"){
									// Body By Anita
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'body_by_anita_register_template.html'));
									mailer.sendMail({from: 'Anita Herbert <support@plankk.com>', to: user.email, subject: "Welcome to the Body By Anita App!", html: msg});
								}else if(trainer_id == "5b0d7e8f97e2f515d56b7fa3"){
									// Mariza
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mariza_register_template.html'));
									mailer.sendMail({from: 'Mariza Villarreal <support@plankk.com>', to: user.email, subject: "Welcome to the Mariza Villarreal App!", html: msg});
								}else if(trainer_id == "5b32b29430f0493180099e60"){
									// Get It Dunne
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Get_it_Dunne_register.html'));
									mailer.sendMail({from: 'Get It Dunne <support@plankk.com>', to: user.email, subject: "Welcome to the Get it Dunne App!", html: msg});
								}else if(trainer_id == "5b917a71b29b997460999b8f"){
									// Train with Tanya
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Tanya_register_template.html'));
									mailer.sendMail({from: 'Train with Tanya <support@plankk.com>', to: user.email, subject: "Welcome to the Train with Tanya App!", html: msg});
								}else if(trainer_id == "5bd9e069da6a6b3a240de6dd"){
									// Bakhar Nabieva
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bakhar_nabieva_register.html'));
									mailer.sendMail({from: 'Bakhar Nabiev <support@plankk.com>', to: user.email, subject: "Welcome to the Alien Gains App!", html: msg});
								}else if(trainer_id == "5bfc2525a2d6464827d1fbf5"){
									// The Iron Giantess
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Laura_micetich_register.html'));
									mailer.sendMail({from: 'The Iron Giantess <support@plankk.com>', to: user.email, subject: "Welcome to the Iron Giantess App!", html: msg});
								}else if(trainer_id == "5bd9de9ada6a6b3a240de595"){
									// Mandy Sacs
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mandy_sacs_register_template.html'));
									mailer.sendMail({from: 'Mandy <support@plankk.com>', to: user.email, subject: "Welcome to the Fit with Mandy App!", html: msg});
								}else if(trainer_id == "5ba3dad956d38558c5e5fbd7"){
									// Warrior Athlete
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Laura_Prestin_register.html'));
									mailer.sendMail({from: 'Warrior Athlete <support@plankk.com>', to: user.email, subject: "Welcome to the Warrior Athlete App!", html: msg});
								}else if(trainer_id == "5c58993f9485e03a2c042b30"){
									// Yarishna
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Yarishna_register_template.html'));
									mailer.sendMail({from: 'Yarishna Ayala <support@plankk.com>', to: user.email, subject: "Welcome to my Yarishna Fit community!", html: msg});
								}else if(trainer_id == "5cb5fb5ee6829f72a8c6b6d9"){
									// Theresa Miller
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'theresa_miller_register.html'));
									mailer.sendMail({from: 'Theresa Miller <support@plankk.com>', to: user.email, subject: " Welcome to my Theresa Miller App!", html: msg});
								}else if(trainer_id == "5c096ec07a55ad64617c8c8c"){
									// Ingrid Romero
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Ingrid_register_template.html'));
									mailer.sendMail({from: 'Edge Fit <support@plankk.com>', to: user.email, subject: "Thank you for joining my EdgeFit app community!", html: msg});
								}


								// mailer.sendMail({to: user.user, subject: "Please confirm your email!", html: msg});

								var token = jwt.sign({user: user, name: user.user, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
								if(user.verified && user.verified !== true){
									user.verified = false;
								}
								followUser(user._id.toString(), trainer_id, function(err, result){
									if(err){
										console.error(err);
									}
								});
								sendSuccess(res, {user: user, token: token});
							}
						});
					}

					if(req.files && req.files.length){
						var baseFolder = path.join(path.dirname(require.main.filename), "uploads/users/");

						Model.uploadFilesEx(req, baseFolder, (user.email).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
							if(!succeeded.length){
								sendError(res, "Failed to upload image");
							}else {
								user.profile.image = config.base_url+"uploads/users/"+succeeded.shift();
								saveUser();
							}
						});
					}else{
						saveUser();
					}
				}else {
					sendError(res, "Wrong data!");
				}

			});

		});

	});


	/**
		@@ Create a New User
		@@ WEBSITE User
		@@ AUTHOR- WEGILE
	**/

	router.put('/signupWithWeb', function(req, res, next){
		if(!req.body){
			return sendError(res, "Required parameters missing!");
		}

		var email = req.body.email || '';
		var password = req.body.password || '';
		var device_token = req.body.device_token || '';
		var trainer_id = req.body.trainer_id || '57c5310521bbac1d01aa75db';
		var facebook_id = "";
		var name = req.body.name || "";
		var os_type = "web";
		email = email.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');

		if(!email){
			return sendError(res, "Email missing!");
		}

		if(!password){
			password = generatePassword(6);
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}
			//check special case for Mike Chabot
			if(trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d") {
				var conditions = {email: email, trainer_id: {$in:[ "59791200cc447310747e731d", "59bc29ff25d96c751aa76b3d" ] } };
			}
			else{ // for All other APPS
				var conditions = {email: email, trainer_id: trainer_id };
			}
			model_user.find(conditions).limit(1).next(function(err, existingUser){
				if(err){
					return sendError(res, "Something went wrong: "+err);
				}

				if(existingUser){
					return sendError(res, "Email already registered!");
				}

				var user = {
					user: email,
					email: email,
					facebook_id: "",
					google_id: "",
					trainer_id: trainer_id,
					password: Model.password(password),
					device_token: device_token,
					os_type: os_type,
					profile: {
						name: name,
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
						subscribed_plan: '0',
						active_plan_key: '',
						active_planid: 0,
						selected_trainer: '',
						last_seen: (new Date()).getTime()
					},
					joined_on: (new Date()).getTime(),
					subscribed_on: false,
					subscription: false,
					plans: [],
					progress_pictures: [],
					active: true,
					verified: true//generatePassword(12),
				};

				if(model_user.verify(user)){

					var saveUser = function(){
						model_user.insertOne(user, {}, function(err, insertedUser){
							if(err){
								sendError(res, "Failed to register user: "+err);
							}else {

								if(trainer_id == "57c5310521bbac1d01aa75db"){
									// Fit & Thick App

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'FnT_register_web_template.html'));
									mailer.sendMail({from: 'Nicole Mejia <info@getfitandthick.com>', to: user.email, subject: "Welcome to the Fit and Thick App!", html: msg});
								}else if(trainer_id == "5822bfb2b86828570dd90899"){
									// MTC app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'MTC_register_web_template.html'));
									mailer.sendMail({from: 'Carmen Morgan <support@plankk.com>', to: user.email, subject: "Welcome to My Trainer Carmen!", html: msg});
								}else if(trainer_id == "586f341b1cfef774222b1821"){
									// DFG app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'DFG_register_template.html'));
									mailer.sendMail({from: 'Samantha Kozuch <support@plankk.com>', to: user.email, subject: "Welcome to Daily Fit Girl!", html: msg});
								}else if(trainer_id == "59177e86980aa43e2715a8ff"){
									// Madeleine Byrne app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Madeleine_Byrne_register.html'));
									mailer.sendMail({from: 'Madeleine Byrne <support@plankk.com>', to: user.email, subject: "Welcome to the Madeleine Byrne App!", html: msg});
								}else if(trainer_id == "591c8094da9386315f51787e"){
									// Workouts By Gabriela app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Gabriela_register_web_template.html'));
									mailer.sendMail({from: 'Gabriela Bandy <support@plankk.com>', to: user.email, subject: "Welcome to the Workouts By Gabriela App!", html: msg});
								}else if(trainer_id == "58f66e596e288005867db979"){
									// Minne Ninja app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'MN_register_web_template.html'));
									mailer.sendMail({from: 'Jennifer Tavernier <support@plankk.com>', to: user.email, subject: "Welcome to Minne Ninja App!", html: msg});
								}else if(trainer_id == "59177d25980aa43e2715a8fe"){
									// Nikki Rica Fit app

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Nikki_register_web_template.html'));
									mailer.sendMail({from: 'Nikki Leonard <support@plankk.com>', to: user.email, subject: "Welcome to the Nikki Rica Fit App!", html: msg});
								}else if(trainer_id == "584fbe1dadbdd05d535cddae"){
									// TWL app

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'TWL_register_web_template.html'));
									mailer.sendMail({from: 'Lyzabeth Lopez <support@plankk.com>', to: user.email, subject: "Welcome to the TWL App!", html: msg});
								}else if(trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d"){
									// Mike Chabot app

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mike_chabot_web_register_template.html'));
									mailer.sendMail({from: 'Mike Chabot <support@plankk.com>', to: user.email, subject: "Welcome to the Mike Chabot Fitness App!", html: msg});
								}else if(trainer_id == "59d52803ee5c705abefacc11"){
									// Oooh Baby Beast app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'OBB_register_web_template.html'));
									mailer.sendMail({from: 'Kayli <support@plankk.com>', to: user.email, subject: "Welcome to the Oooh Baby Beast App!", html: msg});
								}else if(trainer_id == "59b174cfab77c775bae7c6a2"){
									// Fit With Whit app
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'fit_with_whit_register_web_template.html'));
									mailer.sendMail({from: 'Whitney <support@plankk.com>', to: user.email, subject: "Welcome to the Fit With Whit App!", html: msg});
								}else if(trainer_id == "59c02f07b271d505358da0bf"){
									// Arianny Celeste
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Arianny_register_web_template.html'));
									mailer.sendMail({from: 'Arianny <support@plankk.com>', to: user.email, subject: "Welcome to the Arianny Celeste App!", html: msg});
								}else if(trainer_id == "597b8a331b54472074c2dd1a"){
									// Sugary Six Pack
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'ssp_register_web_template.html'));
									mailer.sendMail({from: 'SugarySixpack <support@plankk.com>', to: user.email, subject: "Welcome to the NEW SugarySixpack App!", html: msg});
								}else if(trainer_id == "59e4ea0878c2ed3818c7c0de"){
									// Lais DeLeon App
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Lais_register_web_template.html'));
									mailer.sendMail({from: 'Lais DeLeon <support@plankk.com>', to: user.email, subject: "Welcome to the Lais DeLeon App!", html: msg});
								}else if(trainer_id == "59b9ad9e446c6d65794a9bc9"){
									// Trav Beach Boy

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Trav_register_web.html'));
									mailer.sendMail({from: 'Trav Beach Boy <support@plankk.com>', to: user.email, subject: "Welcome to the Beach Body By Trav App!", html: msg});
								}else if(trainer_id == "5a270b18731edd456cb56f3b"){
									// Ashley K FIT

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'ashley_register_web_template.html'));
									mailer.sendMail({from: 'AshleyKFit <support@plankk.com>', to: user.email, subject: "Welcome to the AshleyKFit App!", html: msg});
								}else if(trainer_id == "59cd5272c1dc8268c5818cf0"){
									// Caitlin Rice Fit

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'caitlin_rice_fit_register_web_template.html'));
									mailer.sendMail({from: 'Caitlin Rice Fit <support@plankk.com>', to: user.email, subject: "Welcome to the Caitlin Rice Fit App!", html: msg});
								}else if(trainer_id == "5a60de980379ce6d1fecfec0"){
									// Body By Lynsee
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Lynsee_register_web_template.html'));
									mailer.sendMail({from: 'Body By Lynsee <support@plankk.com>', to: user.email, subject: "Welcome to the Body By Lynsee App!", html: msg});
								}else if(trainer_id == "5a3c25bf34d092539e01b020"){
									// HollY Barker
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'holly_barker_register_web_template.html'));
									mailer.sendMail({from: 'Holly Barker <support@plankk.com>', to: user.email, subject: "Welcome to the Holly Barker App!", html: msg});
								}else if(trainer_id == "5a690da90379ce6d1fed04ac"){
									// Tianna Gregory
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'tianna_gregory_register_web_template.html'));
									mailer.sendMail({from: 'Tianna Gregory <support@plankk.com>', to: user.email, subject: "Thanks for joining the Tianna Gregory Community!", html: msg});
								}else if(trainer_id == "5a5f8f628887535a6f78b66f"){
									// Julian and Austin
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'austin_julian_register_web_template.html'));
									mailer.sendMail({from: 'Julian and Austin <support@plankk.com>', to: user.email, subject: "Thanks for joining the Austin & Julian App!", html: msg});
								}else if(trainer_id == "5aa6e4c527d727022ed0a9a8"){
									// Cass Martin
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'cass_martin_register_web.html'));
									mailer.sendMail({from: 'Lift With Cass Martin <support@plankk.com>', to: user.email, subject: "Welcome to the Lift with Cass Martin App!", html: msg});
								}else if(trainer_id == "5a8c7aff14d55f7ad445a6f3"){
									// BoothCamp
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'boothcamp_register_web_template.html'));
									mailer.sendMail({from: 'BOOTHCAMP <support@plankk.com>', to: user.email, subject: "Welcome to the BOOTHCAMP App!", html: msg});
								}else if(trainer_id == "5a9d7d110a4ae17da220a43e"){
									// Fit By Valen
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'fit_by_valen_register_web.html'));
									mailer.sendMail({from: 'Valen <support@plankk.com>', to: user.email, subject: "Welcome to the Fit By Valen App!", html: msg});
								}else if(trainer_id == "5a31715fea9bfe01e569a79e"){
									// Nienna Jade
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'nienna_jade_register_web_template.html'));
									mailer.sendMail({from: 'Nienna Jade <support@plankk.com>', to: user.email, subject: "Welcome to the Nienna Jade App!", html: msg});
								}else if(trainer_id == "5ababddaecc1ec1ffbd08c30"){
									// Bikni Boss
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bikni_boss_register_web_template.html'));
									mailer.sendMail({from: 'Bikini Boss <support@plankk.com>', to: user.email, subject: "Welcome to the Bikini Boss App!", html: msg});
								}else if(trainer_id == "59e7a30ce1705864cc7cf355"){
									// Caroline De Campos
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'cdc_register_web_template.html'));
									mailer.sendMail({from: 'Caroline De Campos <support@plankk.com>', to: user.email, subject: "Welcome to the CDC Body App!", html: msg});
								}else if(trainer_id == "5ae1efea5058a545907d5f61"){
									// Janna App
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'train_with_janna_register_web.html'));
									mailer.sendMail({from: 'Train With Janna <support@plankk.com>', to: user.email, subject: "Welcome to the Train with Janna App!", html: msg});
								}else if(trainer_id == "5ad4dd4cc1ce3e3463753b50"){
									// Callie Bundy
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'callie_bundy_register_web.html'));
									mailer.sendMail({from: 'Callie Bundy <support@plankk.com>', to: user.email, subject: "Welcome to the Callie Bundy App!", html: msg});
								}else if(trainer_id == "5acd3eb90780015c1e9cc568"){
									// Get Loved Up
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Get_Loved_Up_register_web.html'));
									mailer.sendMail({from: 'Koya <support@plankk.com>', to: user.email, subject: "Welcome to the Get Loved Up App!", html: msg});
								}else if(trainer_id == "5b5746db5c3f964e6408b507"){
									// Bodymaze
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bodymaze_register_web_template.html'));
									mailer.sendMail({from: 'Bodymaze <support@plankk.com>', to: user.email, subject: "Welcome to the BodyMaze App!", html: msg});
								}else if(trainer_id == "5b3fac6ebb2b53737d1fe6cc"){
									// Body By Anita
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'body_by_anita_register_web_template.html'));
									mailer.sendMail({from: 'Anita Herbert <support@plankk.com>', to: user.email, subject: "Welcome to the Body By Anita App!", html: msg});
								}else if(trainer_id == "5b32b29430f0493180099e60"){
									// Get It Dunne

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Get_it_Dunne_register_web.html'));
									mailer.sendMail({from: 'Get It Dunne <support@plankk.com>', to: user.email, subject: "Welcome to the Get it Dunne App!", html: msg});
								}else if(trainer_id == "5b917a71b29b997460999b8f"){
									// Train with Tanya

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Tanya_register_web_template.html'));
									mailer.sendMail({from: 'Train with Tanya <support@plankk.com>', to: user.email, subject: "Welcome to the Train with Tanya App!", html: msg});
								}else if(trainer_id == "5bd9e069da6a6b3a240de6dd"){
									// Bakhar Nabieva

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'bakhar_nabieva_register_web.html'));
									mailer.sendMail({from: 'Bakhar Nabiev <support@plankk.com>', to: user.email, subject: "Welcome to the Alien Gains App!", html: msg});
								}else if(trainer_id == "5bfc2525a2d6464827d1fbf5"){
									// The Iron Giantess									
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Laura_micetich_register_web.html'));
									mailer.sendMail({from: 'The Iron Giantess <support@plankk.com>', to: user.email, subject: "Welcome to the Iron Giantess App!", html: msg});
								}else if(trainer_id == "5bd9de9ada6a6b3a240de595"){
									// Mandy Sacs

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Mandy_sacs_register_web_template.html'));
									mailer.sendMail({from: 'Mandy <support@plankk.com>', to: user.email, subject: "Welcome to the Fit with Mandy App!", html: msg});
								}else if(trainer_id == "5ba3dad956d38558c5e5fbd7"){
									// Warrior Athlete

									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Laura_Prestin_register_web.html'));
									mailer.sendMail({from: 'Warrior Athlete <support@plankk.com>', to: user.email, subject: "Welcome to the Warrior Athlete App!", html: msg});
								}else if(trainer_id == "5c58993f9485e03a2c042b30"){
									// Yarishna
									
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Yarishna_register_web.html'));
									mailer.sendMail({from: 'Yarishna Ayala <support@plankk.com>', to: user.email, subject: "Welcome to my Yarishna Fit community!", html: msg});
								}else if(trainer_id == "5cb5fb5ee6829f72a8c6b6d9"){
									// Theresa Miller
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'theresa_miller_register_web.html'));
									mailer.sendMail({from: 'Theresa Miller <support@plankk.com>', to: user.email, subject: " Welcome to my Theresa Miller App!", html: msg});
								}else if(trainer_id == "5c096ec07a55ad64617c8c8c"){
									// Ingrid Romero
									var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'Ingrid_register_web_template.html'));
									mailer.sendMail({from: 'Edge Fit <support@plankk.com>', to: user.email, subject: "Thank you for joining my EdgeFit app community!", html: msg});
								}

								var token = jwt.sign({user: user, name: user.user, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
								if(user.verified && user.verified !== true){
									user.verified = false;
								}
								followUser(user._id.toString(), trainer_id, function(err, result){
									if(err){
										console.error(err);
									}
								});
								sendSuccess(res, {user: user, token: token});
							}
						});
					}

					if(req.files && req.files.length){
						var baseFolder = path.join(path.dirname(require.main.filename), "uploads/users/");

						Model.uploadFilesEx(req, baseFolder, (user.email).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
							if(!succeeded.length){
								sendError(res, "Failed to upload image");
							}else {
								user.profile.image = config.base_url+"uploads/users/"+succeeded.shift();
								saveUser();
							}
						});
					}else{
						saveUser();
					}
				}else {
					sendError(res, "Wrong data!");
				}

			});

		});

	});



	/**
		@@ Generate Token
		@@ input email and trainer_id
		@@ AUTHOR- WEGILE

	**/

	router.post('/getToken', function(req, res, next) {

		if(!req.body){
			return sendError(res, "Invalid Request!");
		}

		var trainer_id = req.body.trainer_id || '57c5310521bbac1d01aa75db';
		var email = req.body.email || "";

		if(!email || !trainer_id){
			sendError(res, "Invalid Request!");
			return;
		}

		email = email.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');
		//check special case for Mike Chabot
		if(trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d") {
			var conditions = {email: email, trainer_id: { $in:[ "59791200cc447310747e731d", "59bc29ff25d96c751aa76b3d" ] }};
		}
		else{ // for All other APPS
			var conditions = {email: email, trainer_id: trainer_id};
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			model_user.find(conditions).limit(1).next(function(err, isUser){
				if(isUser) {
					var new_user = JSON.parse(JSON.stringify(isUser));
					delete new_user.profile;
					delete new_user.transactions;
					delete new_user.progress_pics;
					delete new_user.progress_pictures;

					var token = jwt.sign({user: new_user, name: isUser.email, isGuest: false, isAdmin: false, isTrainer: false}, config.secret);
					if(isUser.verified && isUser.verified !== true){
						isUser.verified = false;
					}
					if(isUser.transactions) delete isUser.transactions;
					sendSuccess(res, {token: token});
				}else{
					sendError(res, "User doesn't exists", 404);
				}
			});
		});

	});



	var user_id = 0;

	router.use(function(req, res, next){
		if(!req.userinfo){
			sendError(res, {error: "Unauthorized", qtoken: req.query.token, btoken: req.body.token, body: req.body, query: req.query, params: req.params}, 401);
		}else{
			if(isUser(req.userinfo)){
				// Normal user
				user_id = req.userinfo.user._id;
				var model_user = Model.load('user', {}, function(err, model_user){
					model_user.find({_id: Model.ObjectID(user_id)}).count(function(err, count){
						if(count>0){
							next();
						}else{
							sendError(res, "User doesn't exists", 404);
						}
					});
				});
			//}else if(isAdmin(req.userinfo)){
			//	user_id = 0;
			} else if (req.userinfo.isAdmin || req.userinfo.isTrainer) {
        // not a user but is either an admin or trainer... there are some endpoints that don't reuire the user object loaded.
        next();
      } else {
				return sendError(res, {error: "Unauthorized", qtoken: req.query.token, btoken: req.body.token, body: req.body, query: req.query, params: req.params}, 401);
			}
			// next();
		}
	});

	/**
		@@ POST API
		@@ Update Device Token when Logout from APP
	**/
	router.post('/update_device_token', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var deviceToken = req.body.device_token || ""
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Something went wrong: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).count(function(err, count){

				if(count > 0){
					var updated_data = {};
					updated_data.device_token = deviceToken;
					model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: updated_data}, {}, function(err, dbres){
						if(err){
							sendError(res, err);
						}else{
							sendSuccess(res, {message:"Device token has been updated successfully", device_token: deviceToken});
						}
					});
				}else{
					sendError(res, "User doesn't exists");
				}
			});

		});
	});

	router.get('/checkuser', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Something went wrong: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).count(function(err, count){

				if(count > 0){
					sendSuccess(res, {"message":"User exists", "error":"User exists"});
				}else{
					sendError(res, "User doesn't exists", 404);
				}
			});

		});
	});


	router.post('/verify', function(req, res, next){
		user_id = req.userinfo.user._id;
		if(!req.body || !req.body.verification_token){
			return sendError(res, "Please provide verification_token!");
		}

		var vtoken = req.body.verification_token || '';

		if(vtoken == req.userinfo.user.verified){
			// Verification token matched
			var model_user = Model.load('user', {}, function(err, model_user){
				if(err){
					return sendError(res, "Something went wrong: "+err);
				}

				model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: {verified: true}}, {}, function(err, r){
					if(err){
						return sendError(res, "Failed to update verification information");
					}
					if(req.userinfo.user.trainer_id == "57c5310521bbac1d01aa75db"){
						var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'FnT_register_template.html'));
						mailer.sendMail({to: req.userinfo.user.email, subject: "Welcome to the Fit and Thick App!", html: msg});
					}else{
						mailer.sendMail({to: req.userinfo.user.email, subject: "Welcome Aboard!", html: "Thanks for signing up! Email verified successfully!"});
					}

					sendSuccess(res, "Successfully verified");

				});

			});
		}else {
			// Verification failed
			return sendError(res, "Verification failed, please try again with valid verification_token");
		}
	});

	router.post("/changepass", function(req, res, next){
		var user_id = req.userinfo.user._id;
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
            "5bd9de9ada6a6b3a240de595": "mandy", // Mandy
            "5bd9e069da6a6b3a240de6dd": "aliengains", // Bakhar Nabieva
            "5c58993f9485e03a2c042b30": "yarishna", // Yarishna Fitness
            "5ccc64cfd17f9f5d70b9b227": "massy", // Massy
            "5c3cc5c8ba2d490d720aca9e": "samib", // Sami
            "5da625b54eca18246d33be28": "erin" // Erin Oprea
	    }

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id), password: Model.password(current_pass)}).limit(1).next(function(err, user){
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

	router.get("/profile", async function(req, res, next){
		var user_id = req.userinfo.user._id;
		var model_user = Model.load('user', {}, async function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next( async function(err, user){
				if(err){
					return sendError(res, "Something went wrong while fetch user profile: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong, there is no such user!");
				}

				var model_tp = Model.load("trainerplan", {}, async function(err, model_tp) {
		            if (err) {
		                sendError(res, "Failed to access db: " + err);
		            } else {
		            	var conditions = { type: "custom", "assigned": true, trainer_id: user.trainer_id, user_id: Model.ObjectID(user_id) } 
						var customplans = await model_tp.find(conditions).toArray();
						
		            	model_tp.find({challenge_access_users: { $in:[ user.email ] }, "type":"challenge"}, { "label": 1 } ).toArray(function(err, challenge_access_users) {

		            		// For White List Users in Challenge Plan
		            		if(challenge_access_users && challenge_access_users.length){
		            			var free_access_challenges = challenge_access_users.map(function(key, ind) {
                                    return { plan_id: key._id.toString(),purchased_date: (new Date()).toJSON().substring(0, 10) };
                                });

                                user.profile.challenge_plan_purchased = (user.profile.challenge_plan_purchased || []).concat(free_access_challenges)
		            		}

							if(user.verified && user.verified !== true){
								user.verified = false;
							}
							// Extra check for Subscription
							user.profile.subscription_plan_name = user.profile.subscription_plan_name || "";

							if(user.transactions) delete user.transactions;
							var active_plan_key = user.profile.active_plan_key || false;
							var active_side_plan_key = user.profile.active_side_plan_key || false
			        		var streak_count = current_streak_count = longest_streak_count = skipped_count = completed_workout = 0;
			        		var streak_count_yes = false;

			            	var today_date = new Date();
			            	var workout_history_complete_array = [];
			            	var previous_date = new Date(today_date.getFullYear(), today_date.getMonth(), today_date.getDate(), 0,0,0,0)
			        		
			                var _getStreakCount  = function(saved_user_data, workout_history){
			                	var sorted_array = [];
			                	if( saved_user_data && saved_user_data.length ) {
				                    if(Array.isArray(saved_user_data[0])==false ){
				                        // for ANDROID users
				                        var date = new Date();
				                        var current_date = prev_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0,0);
				                        
				                        //filter those dates <= currentdate
				                        sorted_array = saved_user_data.filter(function(item){
				                            return new Date(item.dateWithYear).getTime() <= current_date.getTime();
				                        });

				                        var completed_sorted_data = sorted_array.concat(workout_history)
				                        
				                        // sort them in descending order of date
				                        completed_sorted_data.sort(function(a,b) {
				                            return (new Date(a.dateWithYear).getTime() < new Date(b.dateWithYear).getTime()) ? 1 : ((new Date(b.dateWithYear).getTime() < new Date(a.dateWithYear).getTime()) ? -1 : 0);
				                        });

				                        completed_sorted_data = completed_sorted_data.filter(function(item){
				                        	if( item.workoutComplete.toLowerCase() == 'no' && new Date(item.dateWithYear).getTime() == current_date.getTime() ){
				                        		return false;
				                        	} else{
				                        		return true;
				                        	}
				                        });
				                        
				                        if(completed_sorted_data.length && completed_sorted_data[0].dateWithYear ) prev_date = new Date(completed_sorted_data[0].dateWithYear);
				                        completed_sorted_data.forEach(function(json){
				                        	var dateWithYear = new Date(json.dateWithYear);
				                            if(json.workoutComplete.toLowerCase() == 'yes'){
				                            	completed_workout++;
				                            	// check if previous date  is current date 
				                                if(!streak_count){
				                                    streak_count++;
				                                    current_streak_count = streak_count;
				                                }
				                                else{// check if sequential date
				                                	if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
				                                        if(!streak_count_yes) {
				                                			current_streak_count = streak_count;
				                                		}
				                                    }
				                                    else if(prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000){
				                                        streak_count++;
				                                        if(!streak_count_yes) {
				                                			current_streak_count = streak_count;
				                                		}
				                                    }else{ //Non Sequntials date 
				                                		if(longest_streak_count < streak_count){
				                                			longest_streak_count = streak_count;
				                                		}
				                                		if(!streak_count_yes) {
				                                			current_streak_count = streak_count;
				                                			streak_count_yes = true;
				                                		}
				                                		streak_count = 1;
				                                    }
				                                }
				                            }
				                            else if(json.workoutComplete.toLowerCase() == 'skipped'){
				                                skipped_count++;

				                                if(!streak_count || prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000){
				                            		//streak_count++;
				                            		current_streak_count = streak_count;
				                            	}else if(prev_date.getTime() - dateWithYear.getTime() >= 86400 * 1000){
				                            		if(longest_streak_count < streak_count){
				                            			longest_streak_count = streak_count;
				                            		}
				                            		if(!streak_count_yes) {
				                            			current_streak_count = streak_count;
				                            			streak_count_yes = true;
				                            		}
				                            		streak_count = 0;
				                            		
				                            	}
				                            }
				                            else if(json.workoutComplete.toLowerCase() == 'no'){
				                            	
				                                if(/rest/i.test(json.label)) { // check if rest comes in Workout Label String
				                            		if( (prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000))  {
					                                	streak_count++;
						                            	current_streak_count = streak_count;
					                            	}
					                            	else if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
					                                	if(!streak_count_yes) {
				                                			current_streak_count = streak_count;
				                                			streak_count_yes = true;
				                                		}
					                                }
				                                }else{ //break streak
				                                	if(streak_count && (prev_date.getTime() - dateWithYear.getTime() >= 86400 * 1000) ){
					                                	if(longest_streak_count < streak_count){
				                                			longest_streak_count = streak_count;
				                                		}
				                                		if(!streak_count_yes) {
					                            			current_streak_count = streak_count;
					                            			streak_count_yes = true;
					                            		}
					                            		streak_count = 0;
				                            		}
				                            	}
				                            }
				                            if(longest_streak_count < streak_count){
				                    			longest_streak_count = streak_count;
				                    		}
				                            prev_date = dateWithYear;
				                        });
				                        
				                    }else{
				                     	// for IOS users
				                     	var date = new Date();
				                        var current_date = prev_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0,0);

				                        saved_user_data.forEach(function(json){
				                            
				                            json.forEach(function(item){
				                                sorted_array.push(item);
				                            });
				                        });

				                        //filter those date <= current date
				                        sorted_array = sorted_array.filter(function(item){
				                            return new Date(item.dateWithYear).getTime() <= current_date.getTime();
				                        });

				                        var completed_sorted_data = sorted_array.concat(workout_history) 
				                        // sort them in descending order of date
				                        completed_sorted_data.sort(function(a,b) {
				                            return (new Date(a.dateWithYear).getTime() < new Date(b.dateWithYear).getTime()) ? 1 : ((new Date(b.dateWithYear).getTime() < new Date(a.dateWithYear).getTime()) ? -1 : 0);
				                        });
				                        var sort_array = ["yes", "no"];
										completed_sorted_data.sort(function (a, b) {
										    var aDate = new Date(a.dateWithYear).getTime();
										    var bDate = new Date(b.dateWithYear).getTime();
										    var aCompleted = a.workoutComplete.toLowerCase();
										    var bCompleted = b.workoutComplete.toLowerCase();
										    if(aDate == bDate)
										    {
										    	var ia = sort_array.indexOf(aCompleted)
			                                    var ib = sort_array.indexOf(bCompleted)
			                                    return ia > ib ? 1 : (ia<ib ? -1 : 0);
										    }
										    else
										    {
										        return (aDate < bDate) ? 1 : (aDate > bDate) ? -1 : 0;
										    }
										})

				                        completed_sorted_data.forEach(function(json, index){
				                        	var dateWithYear = new Date(json.dateWithYear);
				                            if(json.workoutComplete.toLowerCase() == 'yes'){
				                            	completed_workout++;
				                                // check if previous date  is current date 
				                                if(!streak_count && prev_date.getTime() == dateWithYear.getTime()){
				                                    streak_count++;
				                                    current_streak_count = streak_count;
				                                }
				                                else{// check if sequential date
				                                	if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
				                                		
				                                        if(!streak_count_yes) {
				                                			current_streak_count = streak_count;
				                                		}
				                                    }
				                                    else if(prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000){
				                                        streak_count++;
				                                        if(!streak_count_yes) {
				                                			current_streak_count = streak_count;
				                                		}
				                                    }else{ //Non Sequntials date 
				                                		if(longest_streak_count < streak_count){
				                                			longest_streak_count = streak_count;
				                                		}
				                                		if(!streak_count_yes) {
				                                			current_streak_count = streak_count;
				                                			streak_count_yes = true;
				                                		}
				                                		
				                                		streak_count = 1;
				                                    }
				                                }
				                            }
				                            else if(json.workoutComplete.toLowerCase() == 'skipped'){
				                                skipped_count++;

				                                // check else if workout history 
				                                if(((!streak_count) || prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000)){
				                            		//streak_count++;
				                            		if(!streak_count_yes) current_streak_count = streak_count;
				                            		
				                            	}else if(prev_date.getTime() - dateWithYear.getTime() >= 86400 * 1000){
				                            		if(longest_streak_count < streak_count){
				                            			longest_streak_count = streak_count;
				                            		}
				                            		if(!streak_count_yes) {
				                            			current_streak_count = streak_count;
				                            			streak_count_yes = true;
				                            		}
				                            		streak_count = 0;
				                            	}
				                            }
				                            else if(json.workoutComplete.toLowerCase() == 'no'){
				                            	
				                            	if(/rest/i.test(json.label)) { // check if rest comes in Workout Label String
				                            		if(streak_count && (prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000))  {
					                                	streak_count++;
					                                	if(!streak_count_yes) {
				                                			current_streak_count = streak_count;
				                                		}
					                            	}
					                            	else if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
					                                	if(!streak_count_yes) {
				                                			current_streak_count = streak_count;
				                                			streak_count_yes = true;
				                                		}
					                                }
				                                }else{ //break streak
				                                	if(streak_count && (prev_date.getTime() - dateWithYear.getTime() >= 86400 * 1000) ){
				                                		if(longest_streak_count < streak_count){
				                                			longest_streak_count = streak_count;
				                                		}
				                                		if(!streak_count_yes) {
					                            			current_streak_count = streak_count;
					                            			streak_count_yes = true;
					                            		}
					                            		streak_count = 0;
				                                	}
				                            	}
				                            }
				                            if(longest_streak_count < streak_count){
				                    			longest_streak_count = streak_count;
				                    		}
				                            prev_date = dateWithYear;
				                        });
				                    }
				                }
			                }
			                var saved_user_data_main_plan = saved_user_data_side_plan = workout_history_main_plan = workout_history_side_plan = [];

			                // Make an array of all dates available in Workout History
			            	if(active_plan_key && active_plan_key.length == 24 && typeof user.profile['workout_history_' + active_plan_key]!="undefined" && user.profile['workout_history_' + active_plan_key]){
			            		workout_history_main_plan = JSON.parse(user.profile['workout_history_' + active_plan_key]) || []
			        		}else if( typeof user.profile['workout_history']!="undefined" && user.profile['workout_history']){
			        			workout_history_main_plan = JSON.parse(user.profile['workout_history']) || []
			    			}

			                if(active_plan_key && active_plan_key.length == 24 && user.profile['savedData_' + active_plan_key] && typeof user.profile['savedData_' + active_plan_key] !="undefined"){
								saved_user_data_main_plan = JSON.parse(user.profile['savedData_' + active_plan_key]) || []
							}else if( typeof user.profile['savedData']!="undefined" && user.profile['savedData']){
								saved_user_data_main_plan = JSON.parse(user.profile['savedData']) || []
							}

							// Make an array of all dates available in Workout History
			            	if(active_side_plan_key && active_side_plan_key.length == 24 && typeof user.profile['workout_history_' + active_side_plan_key]!="undefined" && user.profile['workout_history_' + active_side_plan_key]){
			            		var workout_history_side_plan = JSON.parse(user.profile['workout_history_' + active_side_plan_key]) || []
			        		}

			        		if(active_side_plan_key && active_side_plan_key.length == 24 && user.profile['savedData_' + active_side_plan_key] && typeof user.profile['savedData_' + active_side_plan_key] !="undefined"){
								var saved_user_data_side_plan = JSON.parse(user.profile['savedData_' + active_side_plan_key]) || []
							}

							// Process Workout History
							// Make only one array after concating main Plan History and Side Plan History
							workout_history_complete_array = workout_history_main_plan.concat(workout_history_side_plan);
							
							workout_history_complete_array = workout_history_complete_array.filter(function(item){
			                    return ( new Date(item.date).getTime() <= today_date.getTime() && item.indexOfWorkout == -1 );
			                });

							for(var i = 0; i < workout_history_complete_array.length; i++){
							    workout_history_complete_array[i].dateWithYear = workout_history_complete_array[i]['date'];
							    workout_history_complete_array[i].workoutComplete = "Yes";
							    delete workout_history_complete_array[i].date;
							}
							var saved_user_data_complete_array = saved_user_data_main_plan.concat(saved_user_data_side_plan)
							
							//calculate Streak Count according to Main active Plan, Side Active Plan, Manual Workout

							_getStreakCount(saved_user_data_complete_array, workout_history_complete_array)

			                user.profile.longest_streak_count = longest_streak_count;
			                user.profile.current_streak_count = current_streak_count;
			                user.profile.skipped_workout = skipped_count;
			                user.profile.completed_workout = completed_workout;

							sendSuccess(res, {user: user, customplans: customplans});
								
	            		})
					}
				})
			})
		})
	})

	/**
		@@ Get User Subscription
		@@ Check whether user is paid or not
	**/

	router.get("/userSubscription", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Something went wrong while fetch user profile: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong, there is no such user!");
				}

				if(user.verified && user.verified !== true){
					user.verified = false;
				}
				// Extra check for Subscription
				if( user.profile.device_type && user.profile.device_type == "iOS"){ // check iOS payment
					var expireDate= user.profile.expire_date;
					if(expireDate && expireDate!="none"){
						expireDate = expireDate.substring(0,19);
						expireDate = new Date(expireDate).getTime();
						if( expireDate >= (new Date()).getTime() ){ // check expire date
							sendSuccess(res, {paid: true, device_type: "iOS", message: "Success"});
						}else{
							if( user.subscription && typeof user.subscription == "object"){
								var end_plan_date = user.profile.endPlan_date; // if expire date expires then check endPlan_Date
								if(end_plan_date=="null"){
									return sendSuccess(res, {paid: false, device_type: "iOS", message: "Success"});
								}
								end_plan_date = new Date(end_plan_date).getTime();
								if(end_plan_date >= (new Date()).getTime()){
									sendSuccess(res, {paid: true, device_type: "iOS", message: "Success"});
								}else{
									sendSuccess(res, {paid: false, device_type: "iOS", message: "Success"});
								}
							}else{
								sendSuccess(res, {paid: false, device_type: "iOS", message: "Success"});
							}
						}
					}else{ // Check Web payment
						if( user.subscription && typeof user.subscription == "object"){
							var end_plan_date = user.profile.endPlan_date;
							if(end_plan_date=="null"){
								return sendSuccess(res, {paid: false, device_type: "iOS", message: "Success"});
							}
							end_plan_date = new Date(end_plan_date).getTime();
							if(end_plan_date >= (new Date()).getTime()){
								return sendSuccess(res, {paid: true, device_type: "iOS", message: "Success"});
							}else{
								return sendSuccess(res, {paid: false, device_type: "iOS", message: "Success"});
							}
						}else{
							sendSuccess(res, {paid: false, device_type: "iOS", message: "Success"});
						}
					}
				}else if( user.profile.device_type && user.profile.device_type == "web" ){ // check Web Payment
					if( user.subscription && typeof user.subscription == "object"){
						var end_plan_date = user.profile.endPlan_date;
						if(end_plan_date=="null"){
							return sendSuccess(res, {paid: false, device_type: "web", message: "Success"});
						}
						end_plan_date = new Date(end_plan_date).getTime();
						if(end_plan_date >= (new Date()).getTime()){
							sendSuccess(res, {paid: true, device_type: "web", message: "Success"});
						}else{
							sendSuccess(res, {paid: false, device_type: "web", message: "Success"});
						}
					}else{
						sendSuccess(res, {paid: false, device_type: "web", message: "Success"})
					}
				}else if( user.profile.device_type && user.profile.device_type.toLowerCase() == "android" ){ // check Android Payment
					var end_plan_date = user.profile.endPlan_date;
					end_plan_date = new Date(end_plan_date).getTime();
					if(end_plan_date >= (new Date()).getTime()){
						sendSuccess(res, {paid: true, device_type: "Android", message: "Success"})
					}else{
						if( user.subscription && typeof user.subscription == "object"){ // check if web payment
							var end_plan_date = user.profile.endPlan_date;
							if(end_plan_date=="null"){
								return sendSuccess(res, {paid: false, device_type: "Android", message: "Success"})
							}
							end_plan_date = new Date(end_plan_date).getTime();
							if(end_plan_date >= (new Date()).getTime()){
								sendSuccess(res, {paid: true, device_type: "Android", message: "Success"})
							}else{
								sendSuccess(res, {paid: false, device_type: "Android", message: "Success"})
							}
						}else{
							sendSuccess(res, {paid: false, device_type: "Android", message: "Success"})
						}
					}
				}else{
					sendSuccess(res, {paid: false, device_type: "na", message: "Success"})
				}
			})
		})
	})

	//  MORE EFFICIENT, BUT LESS FUN
	/**
	 * Remove duplicates from an array of objects in javascript
	 * @param arr - Array of objects
	 * @param prop - Property of each object to compare
	 * @returns {Array}
	 */

	var removeDuplicates = function ( arr, prop ) {
		var obj = {};
		for ( var i = 0, len = arr.length; i < len; i++ ){
			if(!obj[arr[i][prop]]) obj[arr[i][prop]] = arr[i];
		}
		var newArr = [];
		for ( var key in obj ) newArr.push(obj[key]);
		return newArr;
	}

	router.post("/profile", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var profile = req.body.profile || {};
		var email = req.body.email || '';
		var facebook_id = req.body.facebook_id || '';
		var google_id = req.body.google_id || '';
		var device_token = req.body.device_token || '';
		var trainer_id = req.body.trainer_id || '';
		var user = {profile: profile};

		if(facebook_id){
			user.facebook_id = facebook_id;
		}

		if(google_id){
			user.google_id = google_id;
		}

		email = email.toLowerCase().replace(/^\s+/,'').replace(/\s+$/, '');

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
			"5c58993f9485e03a2c042b30": "yarishna", // Yarishna Fitness
			"5ccc64cfd17f9f5d70b9b227": "massy", // Massy
			"5c3cc5c8ba2d490d720aca9e": "samib", // Sami
			"5da625b54eca18246d33be28": "erin", // Erin Oprea
	    }

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, oldUser){
				if(err){
					return sendError(res, "Something went wrong while fetch user profile: "+err);
				}
				if(!oldUser){
					return sendError(res, "Something went wrong, there is no such user!");
				}


				var _updateProfile1 = function(){

					_.defaultsDeep(user, oldUser);

					//additional check for TWL
					if(oldUser.trainer_id && oldUser.trainer_id == "584fbe1dadbdd05d535cddae"){
						var active_plan_key = user.profile.active_plan_key || false;
						var active_side_plan_key = user.profile.active_side_plan_key || false;
						if(active_plan_key && active_plan_key.length == 24 && typeof user.profile['save_data_' + active_plan_key]!="undefined" && user.profile['save_data_' + active_plan_key]){
		            		if(user.profile['save_data_' + active_plan_key]['workout'] && user.profile['save_data_' + active_plan_key]['workout'].length) user.profile['save_data_' + active_plan_key]['workout'] = removeDuplicates(user.profile['save_data_' + active_plan_key]['workout'], "id")
		        		}
		        		if(active_side_plan_key && active_side_plan_key.length == 24 && typeof user.profile['save_data_' + active_side_plan_key]!="undefined" && user.profile['save_data_' + active_side_plan_key]){
		            		if(user.profile['save_data_' + active_side_plan_key]['workout'] && user.profile['save_data_' + active_side_plan_key]['workout'].length) user.profile['save_data_' + active_side_plan_key]['workout'] = removeDuplicates(user.profile['save_data_' + active_side_plan_key]['workout'], "id")
		        		}
					}

					if(device_token){
						user.device_token = device_token;
					}
					// update trainer_id special case for Mike Chabot
					if(trainer_id && (trainer_id == "59791200cc447310747e731d" || trainer_id == "59bc29ff25d96c751aa76b3d")){
						user.trainer_id = trainer_id;
					}

					var _updateProfile2 = function(){
						if(user._id){
							delete user._id;
						}
						model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: user}, {}, function(err, doc){
							if(err){
								return sendError(res, "Failed to update profile: "+err);
							}
							if(user.transactions) delete user.transactions;
							// update Email for Web Users
							if(all_trainers_subdomain[user.trainer_id] && email != '' && email != oldUser.email) {
								__updateEmailForWebUsers( all_trainers_subdomain[user.trainer_id], oldUser.email, email, user.trainer_id );
							}
							sendSuccess(res, {user: user});
						});
					};

					if(req.files && req.files.length){
						var baseFolder = path.join(path.dirname(require.main.filename), "uploads/users/");

						Model.uploadFilesEx(req, baseFolder, (user.user).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
							if(!succeeded.length){
								sendError(res, "Failed to upload image");
							}else {
								user.profile.image = config.base_url+"uploads/users/"+succeeded.shift();
								_updateProfile2();
							}
						});
					}else{
						_updateProfile2();

					}
				};

				if(email != '' && email != oldUser.email){
						// User wants to change email... check if this email is available
						model_user.find({email: email, trainer_id: oldUser.trainer_id}).count(function(err, count){

							if(err){
								return sendError(res, "Something went wrong while fetching user profile: "+err);
							}
							if(count >= 1){
								return sendError(res, "Can't update email. This is already registered");
							}
							user.email = email;
							_updateProfile1();
						});
				}else{
					_updateProfile1();
				}

			});

		});

	});

	router.get("/progress_pic", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Something went wrong while fetching user progress pictures: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong, there is no such user!");
				}

				var progress_pics = user.progress_pics;
				//

				//get valid search text
				var email = user.user;
				var toCheck = email.replace(/[^a-zA-Z0-9]/g, '_');

				if(progress_pics != '' && typeof progress_pics == 'object'){
					for(var key in progress_pics){

						if(progress_pics[key] != '' && !progress_pics[key].match(toCheck)){
							delete progress_pics[key];
						}

					}
				}

				sendSuccess(res, {progress_pics: progress_pics});
			});

		});

	});

	router.post("/progress_pic", function(req, res, next){
		var time_stamp = req.body.time_stamp;
		var user_id = req.userinfo.user._id;
		if(!time_stamp){
			return sendError(res, "Timestamp missing!");
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, oldUser){
				if(err){
					return sendError(res, "Something went wrong while fetching user: "+err);
				}
				if(!oldUser){
					return sendError(res, "Something went wrong, there is no such user!");
				}

				var user = {};

				user.progress_pics = oldUser.progress_pics || {};

				var _updateProgressPic = function(){
					if(user._id){
						delete user._id;
					}
					model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: user}, {}, function(err, doc){
						if(err){
							return sendError(res, "Failed to update progress picture: "+err);
						}

						sendSuccess(res, {progress_pics: user.progress_pics});
					});
				};

				if(req.files && req.files.length){
					var baseFolder = path.join(path.dirname(require.main.filename), "uploads/users/");

					Model.uploadFilesEx(req, baseFolder, (oldUser.user).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
						if(!succeeded.length){
							sendError(res, "Failed to upload image");
						}else {
							user.progress_pics[time_stamp] = config.base_url+"uploads/users/"+succeeded.shift();
							_updateProgressPic();
						}
					});
				}else{
					if(time_stamp && typeof user.progress_pics[time_stamp] != 'undefined'){
						delete user.progress_pics[time_stamp];
					}
					_updateProgressPic();
				}

			});

		});

	});

	router.delete('/progress_pic/:time_stamp', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var time_stamp = req.params.time_stamp+"";
		if(!time_stamp){
			return sendError(res, "Timestamp missing!");
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, oldUser){
				if(err){
					return sendError(res, "Something went wrong while fetching user: "+err);
				}
				if(!oldUser){
					return sendError(res, "Something went wrong, there is no such user!");
				}

				var user = {};

				user.progress_pics = oldUser.progress_pics || {};

				var _updateProgressPic = function(){
					if(user._id){
						delete user._id;
					}
					model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: user}, {}, function(err, doc){
						if(err){
							return sendError(res, "Failed to update progress picture: "+err);
						}

						sendSuccess(res, {progress_pics: user.progress_pics});
					});
				};


				if(time_stamp && typeof user.progress_pics[time_stamp] != 'undefined'){
					delete user.progress_pics[time_stamp];
				}
				_updateProgressPic();


			});

		});
	});

	//Change timestamp to dd-mm-yy hh mm ss format
	function js_yyyy_mm_dd_hh_mm_ss (timestamp) {
		var now = new Date(timestamp);
		year = "" + now.getFullYear();
		month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
		day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
		hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
		minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
		second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
		return day + "-" + month + "-" + year + " " + hour + ":" + minute + ":" + second;
	}

	/**
	**	@@ GET Progress pictures in Array
	**	@@ AUTHOR- WEGILE
	**/

	router.get("/progress_picture", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Something went wrong while fetching user progress pictures: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong, there is no such user!");
				}

				var progress_pictures = user.progress_pictures || [];

			//handle old user's Progress Picture and merge this array to new Progress Picture Array
				var oldProgressPic = user.progress_pics || { };
				progress_pictures = progress_pictures.concat( Object.keys(oldProgressPic).map(function(pp) {
					return {time_stamp: pp, date: js_yyyy_mm_dd_hh_mm_ss(pp*1000), image: oldProgressPic[pp], weight: user.profile.weight, privacy: "private" };
                }) );
			//get valid search text
				var email = user.user;
				var toCheck = email.replace(/[^a-zA-Z0-9]/g, '_');

				if(progress_pictures.length && typeof progress_pictures == 'object'){

					progress_pictures = progress_pictures.filter(function(item){
                        return item.image!="" && item.image.match(toCheck);
                    });
				}

				sendSuccess(res, {progress_pictures: progress_pictures});
			});

		});

	});

	/**
		@@ Upload Progress pictures in Array
		@@ AUTHOR- WEGILE
	**/

	router.post("/progress_picture", function(req, res, next){
		var time_stamp = req.body.time_stamp;
		var weight = req.body.weight;
		var privacy = req.body.privacy;
		var posted_date = req.body.date;
		var update = req.query.update || false;
		var delete_picture = req.query.delete_picture || false;
		var user_id = req.userinfo.user._id;
		if(!time_stamp){
			return sendError(res, "Timestamp missing!");
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, oldUser){
				if(err){
					return sendError(res, "Something went wrong while fetching user: "+err);
				}
				if(!oldUser){
					return sendError(res, "Something went wrong, there is no such user!");
				}
				var updated_user = {};

				var _updateProgressPic = function(){

					if(oldUser.progress_pictures && oldUser.progress_pictures.length && update && update=="yes"){

						// oldUser.progress_pictures.forEach(function(pp, ind){
						// 	if(pp.time_stamp == time_stamp){

						// 		pp[ind].image
						// 	}

						// })
						oldUser.progress_pictures = oldUser.progress_pictures.filter(function(item){
	                        return item.time_stamp!=time_stamp;
	                    });
					}
					if(typeof oldUser.progress_pictures=="undefined") {
						oldUser.progress_pictures = [];
					}

					if(!delete_picture) {
						(oldUser.progress_pictures || []).push(updated_user.progress_pictures);
					}


					if(oldUser._id){
						delete oldUser._id;
					}

					model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: {progress_pictures: oldUser.progress_pictures}}, {}, function(err, doc){
						if(err){
							return sendError(res, "Failed to update progress picture: "+err);
						}

						sendSuccess(res, {progress_pictures: oldUser.progress_pictures});
					});
				};

				if(req.files && req.files.length){
					var baseFolder = path.join(path.dirname(require.main.filename), "uploads/users/");

					Model.uploadFilesEx(req, baseFolder, (oldUser.user).replace(/[^a-zA-Z0-9]/g, '_')+"_", function(succeeded, failed, fields){
						if(!succeeded.length){
							sendError(res, "Failed to upload image");
						}else {
							updated_user.progress_pictures = { time_stamp: time_stamp, date: posted_date, image: config.base_url+"uploads/users/"+succeeded.shift(), weight: weight, privacy: privacy };
							_updateProgressPic();
						}
					});
				}else{
					if(delete_picture){ // delete an object respected to posted timestamp
						_updateProgressPic();
					}else{
						return sendError(res, "Image data is missing");
					}

				}

			});

		});
	});

	router.get("/subscription", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}
			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Failed to fetch user subscription: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong! User does not exists in db!");
				}

				sendSuccess(res, {subscription: user.subscription});
			});
		});
	});

	router.post("/subscription", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var subscription = req.body.subscription || '';

		if(!subscription){
			return sendError(res, "Required parameters missing!");
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}
			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Failed to fetch user subscription: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong! User does not exists in db!");
				}

				_.defaultsDeep(subscription, user.subscription || {});

				model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: {subscription: subscription}}, {}, function(err, doc){
					if(err){
						return sendError(res, "Failed to update user subscription");
					}
					sendSuccess(res, {message: "Subscription updated successfully", subscription: subscription});
				});

			});
		});
	});

	router.get("/transactions", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}
			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Failed to fetch user transactions: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong! User does not exists in db!");
				}

				sendSuccess(res, {transactions: user.transactions || []});
			});
		});
	});

	router.post("/transactions", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var transaction = req.body.transaction || false;

		if(transaction === false){
			return sendError(res, "Required parameters missing!");
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}
			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Failed to fetch user transactions: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong! User does not exists in db!");
				}

				var transactions = user.transactions || [];

				transaction.serverTime = (new Date()).getTime();

				transactions.push(transaction);

				model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: {transactions: transactions}}, {}, function(err, doc){
					if(err){
						return sendError(res, "Failed to update user transactions");
					}
					sendSuccess(res, {message: "Transactions updated successfully", transactions: transactions});
				});

			});
		});
	});

	/**
		@@ Update Nutrition Subscription
		@@ Input user Id
	**/

	router.post("/nutrition_subscription", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var updated_nplansubscription = { "nutrition_subscription": true };

		if(user_id){
			var model_user = Model.load('user', {}, function(err, model_user){
				if(err){
					return sendError(res, "Failed to access db: "+err);
				}
				model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
					if(err){
						return sendError(res, "Failed to fetch user nutrition subscription info: "+err);
					}
					if(!user){
						return sendError(res, "Something went wrong! User does not exists in db!");
					}

					model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: updated_nplansubscription}, {}, function(err, doc){
						if(err){
							return sendError(res, "Failed to update profile: "+err);
						}
						sendSuccess(res, {message: "Nutrition plan has been purchased successfully"});
					});
				});
			});
		}else{

			return sendError(res, "Required parameters missing!");
		}
	});

	/**

		@@ Get Subscription Info
		@@ Input- subscription id

	**/

	function getSubscriptionInfo (subscription_id, cb) {

		var stripe = require("stripe")(
		  "sk_test_eYmARFDIM3AgwbHnodAfWBwR"
		);

		stripe.subscriptions.retrieve(
		  subscription_id,
		  function(err, subscription) {
		  	if(err){
		  		return cb("Stripe API error: " + err.message);
		  	}
		    // asynchronously called
		    cb(undefined, subscription);
		  }
		);

	}

	router.get('/subscription_info', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var subscription_id = req.query.subscription_id || false;
		if(subscription_id === false){
			return sendError(res, "Required parameters missing!");
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}
			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Failed to fetch user subscription: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong! User does not exists in db!");
				}
				getSubscriptionInfo("sub_BdWVT1JLmKtOwW", function(err, result){
					if(err){
						return sendError(res, err);
					}
					sendSuccess(res, {message: "Success", subscription: result});
				});
				// var transactions = user.transactions || [];

				// transaction.serverTime = (new Date()).getTime();

				// transactions.push(transaction);

				// model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: {transactions: transactions}}, {}, function(err, doc){
				// 	if(err){
				// 		return sendError(res, "Failed to update user transactions");
				// 	}
				// 	sendSuccess(res, {message: "Transactions updated successfully", transactions: transactions});
				// });

			});
		});

	});

	/**

		@@ send mail after purchasing nutrition Plan
		@@ input trainer_id, email

	**/

	router.post("/send_nutrition_mail", function(req, res, next){
		var trainer_id = req.body.trainer_id || '57c5310521bbac1d01aa75db';
		var email = req.body.email || false;
		var user_id = req.userinfo.user._id;
		var updated_nplansubscription = { "nutrition_subscription": true };

		if(email && trainer_id){
			var model_user = Model.load('user', {}, function(err, model_user){
				if(err){
					return sendError(res, "Failed to access db: "+err);
				}
				// Fit & Thick App
				model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: updated_nplansubscription}, {}, function(err, doc){
					if(err){
						return sendError(res, "Failed to update profile: "+err);
					}
					if(trainer_id == "57c5310521bbac1d01aa75db"){
						var msg = fs.readFileSync(path.join(path.dirname(require.main.filename), 'views', 'email', 'FnT_nutrition.html'));
						mailer.sendMail({to: email, subject: "Welcome to the 31 Day Plant-Based Power-Up!", html: msg});
					}
					sendSuccess(res, {message: "Mail has been sent successfully", "user_data": doc });
				});
			});
		}else{

			return sendError(res, "Required parameters missing!");
		}
	});

	router.get("/plans", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}
			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Failed to fetch user plans: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong! User does not exists in db!");
				}

				sendSuccess(res, {plans: user.plans});
			});
		});
	});

	router.post("/plans", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var plans = req.body.plans || [];

		if(!plans){
			return sendError(res, "Required parameters missing!");
		}

		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}
			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Failed to fetch user plans: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong! User does not exists in db!");
				}

				// _.defaultsDeep(subscription, user.subscription || {});

				model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: {plans: plans}}, {}, function(err, doc){
					if(err){
						return sendError(res, "Failed to update user plans");
					}
					sendSuccess(res, {message: "Plans updated successfully", plans: plans});
				});
			});
		});
	});

	/** Follower==Following Modules **/
	/**
		@@ API to follow a user
		@@ input follower
		@@ input following
	**/

	router.put('/user_follow', function(req, res, next){
		var userfollow = req.body.userfollow;
		var follower_user = userfollow.follower;
		var following_user = userfollow.following;
		var trainerID = req.body.trainer_id || false
		var model_follow = Model.load('userfollow', {}, function(err, model_follow){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{

				var conds = {
					follower: follower_user , following: following_user
					// $or: [ { follower: follower_user , following: following_user }, { follower: following_user , following: follower_user } ]
					//status: 1 //Here status 0, 1  values references to Pending Follow Request, Confirm Follow Request
				};
				model_follow.find(conds).limit(1).next(function(err, following_data){
					if(err){
						sendError(res, "Failed to retrieve user follower: "+err);
					}else if(following_data){
						var conds2 = { _id: following_data._id };
						var updated_data = {};
						updated_data.updated_at = (new Date()).getTime();
						model_follow.updateOne(conds2, {$set: updated_data }, {}, function(err, r){
							if(err){
								return sendError(res, "Failed to update data");
							}else {
								sendSuccess(res, "Request sent successfully");
							}
						});
					}else{
						var model_user = Model.load('user', {}, function(err, model_user){
							if(err){
								sendError("Failed to access db");
							}else{

								model_user.find({_id: Model.ObjectID(following_user)}, {"email": 1, "profile.name": 1, "profile.privacy_status": 1, "device_token": 1, "profile.device_type": 1 })
									.limit(1).next(function(err, user_data){
									if(err){
										sendError(res, "Failed to retrieve user");
									}else if(!user_data){
										sendError(res, "No user found");
									}else{
										model_user.find({_id: Model.ObjectID(follower_user)}, {"email": 1, "profile.name": 1})
											.limit(1).next(function(err, follower_data){
											if(err){
												sendError(res, "Failed to retrieve user");
											}else if(!user_data){
												sendError(res, "No user found");
											}else{

												if(model_follow.verify(userfollow)){
													userfollow.created_at = (new Date()).getTime();
													userfollow.updated_at = (new Date()).getTime();
													userfollow.status = 1 // Here status 0, 1  values references to Pending Follow Request, Confirm Follow Request
													if(user_data.profile.privacy_status && user_data.profile.privacy_status.toLowerCase()=="private") {
														userfollow.status = 0;
													}
													model_follow.insertOne(userfollow, {}, function(err, inserted_follower){
														if(err) {
															sendError(res, "Failed to insert record: "+err);
														}else{

															var message = (follower_data.profile.name || follower_data.email) + " has started following you";

															if(userfollow.status == 0) {
																var message = "You have received a follow request from " + (follower_data.profile.name || follower_data.email);
															}

															var data = { sender_id: Model.ObjectID(follower_user), message: message, type: 'follow_request' };
															var notification_data = {};
															notification_data.type = 'push';
															notification_data.sub_type = 'follow_request';
					                                        notification_data.data = data;
					                                        notification_data.user_id = user_data._id;
															notification_data.read_status = "n";
															saveNotification(notification_data, function(err, result){

					                                            if(err){
					                                            	sendError(res, "Something went wrong, please try again" +err);
					                                            }else{
					                                            	data.badge = result.unread_notification;
					                                            	if(user_data.device_token && trainerID!="5d8117da4d4a29560d7c86e0") Model.sendPush(user_data.profile.device_type, [user_data.device_token], data.message, data, trainerID);
					                                                sendSuccess(res, {res: inserted_follower, user_follows: userfollow});
					                                            }
					                                        });
														}
													});
												}else{
													sendError(res, "Invalid data for user follows");
												}
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

	/***
        @@Save Notification
    **/

    saveNotification = function(data, callback_func){


        var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification){
			if(err){
				callback_func("Failed to access db: "+err);
			}else{
				if(model_get_notification.verify(data)){
					data.created_at = (new Date()).getTime();
					model_get_notification.insertOne(data, {}, function(errors, dbres){
						if(errors) {
							callback_func(errors);
						}else{
							var conditions = {
								user_id: data.user_id,
								read_status: "n"
						 	};
							var  _loadUnreadNotificationCount = function(conds, callback) {
					            model_get_notification.find(conds)
					            	.count(callback)
					        };
					        _loadUnreadNotificationCount(conditions, function(error, dbres){
								if(error){
									callback_func(error);
								}
				        		$total = parseInt(dbres);
				        		callback_func(undefined, {unread_notification: $total});
							});
				        }
			        });
		        }else{
					callback_func("Invalid data for user notification");
				}
	        }
        });

    }

    /***
        @@Get All Notification
        @@ input user_id
    **/

    router.get('/get_all_notifications', function(req, res, next) {

        var user_id = req.userinfo.user._id;

        var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				sendError("Failed to access db");
			}else{
				var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification){

					if(err){
						callback_func("Failed to access db: "+err);
					}else{
						var conditions = {};
						conditions.user_id = new Model.ObjectID(user_id);
						var  _loadNotificationCount = function(conds, callback) {
				            model_get_notification.find(conds)
				            	.count(callback)
				        };
				        var _sendError = function(err) {
				            if (err) {
				               return sendError(res, err);
				            }
				        };
						_loadNotificationCount(conditions, function(err, notification_count){
							_sendError(err);
			        		$total = parseInt(notification_count);
							model_get_notification.find(conditions).sort({'created_at': -1}).toArray(function(errors, dbres){
								if(errors) {
									sendError(res, errors);
								}else{
									var loadedUsers = 0;
									var fields = {
										"profile.name": 1, "profile.image": 1, "is_trainer": 1,
										"profile.privacy_status": 1
									};
									if(dbres && dbres.length){
		                                dbres.forEach(function(notification, ind) {
		                                	if(typeof notification.data.sender_id !="undefined"){
		                                		var userID = notification.data.sender_id;
			                                    model_user.find({_id: userID}, fields).limit(1).next(function(err, user) {
			                                        if (err) {
			                                            sendError(res, "Something went wrong, please try again" + err);
			                                        } else {
			                                            dbres[ind].user = user;
			                                        }
			                                        if (++loadedUsers >= dbres.length) {

			                                        	sendSuccess(res, {notifications: dbres, recordsTotal: $total});
			                                        }
			                                    });
		                                	}else{
		                                		if (++loadedUsers >= dbres.length) {

		                                        	sendSuccess(res, {notifications: dbres, recordsTotal: $total});
		                                        }
		                                	}
		                                });
		                            }else{
		                            	sendSuccess(res, {notifications: dbres, recordsTotal: $total});
		                            }

						        }
					        });
				        });
			        }
		        });
	        }
        });
    });

    /**
    	@@ Get unread Notification by user_id
    	@@ input user_id
	**/
	router.get('/get_unread_notification', function(req, res, next) {
		var user_id = req.userinfo.user._id;
		if(user_id){
			var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification){
				if(err){
					sendError(res, "Failed to access db: "+err);
				}else{

					var conditions = {
						user_id: new Model.ObjectID(user_id),
						read_status: "n"
				 	};
					var  _loadUnreadNotificationCount = function(conds, callback) {
			            model_get_notification.find(conds)
			            	.count(callback)
			        };
					_loadUnreadNotificationCount(conditions, function(errors, dbres){
						if(errors){
							return sendError(res, errors);
						}
		        		$total = parseInt(dbres);
		        		sendSuccess(res, {unread_notification: $total});
					})
				}
			});
		}else{
			sendError(res, "user id is missing");
		}
	});

	/**
    	@@ Delete Notification
    	@@ input notification_id
	**/

	router.post('/read_notification', function(req, res, next) {
		var user_id = req.userinfo.user._id;
		//var notification_id= req.body.notification_id;
		if(user_id){
			var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification){
				if(err){
					sendError(res, "Failed to access db: "+err);
				}else{
					var conds = {user_id: new Model.ObjectID(user_id)}
					var updated_data = {};
					updated_data.read_status ='y';
					updated_data.updated_at = (new Date()).getTime();
					model_get_notification.update(conds, {$set: updated_data }, {multi:true}, function(err, dbres){
						if(err){
							return sendError(res, "Failed to update notification");
						}else {
							sendSuccess(res, {result: dbres });
						}
					});
				}
			});
		}else{
			sendError(res, "Either notification id or user id is missing");
		}
	});


    /**
    	@@ Delete Notification
    	@@ input notification_id
	**/

	router.post('/delete_notification', function(req, res, next) {
		var user_id = req.userinfo.user._id;
		var notification_id= req.body.notification_id;
		var delete_multiple = req.body.delete_multiple || false;
		if(user_id){
			var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification){
				if(err){
					sendError(res, "Failed to access db: "+err);
				}else{

					var conditions = { };

					if(delete_multiple){
						conditions.user_id = new Model.ObjectID(user_id);
					}else{
						conditions._id = new Model.ObjectID(notification_id);
					}
					model_get_notification.remove(conditions, {}, function(errors, dbres){
						if(errors) {
							sendError(res, "Failed to retrieve record: "+err);
						}else{
							sendSuccess(res, {result: dbres});
						}
					});
				}
			});
		}else{
			sendError(res, "user id is missing");
		}
	});

	/**
		@@ Read Challenge Notification
		@@ save read_status to 'y'
	**/


	router.post('/read_challenge_notification', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var challenge_id = req.body.challenge_id || 0;
		if(user_id && challenge_id) {
			var message = "New push notification for Pop-Up Challenge";

			var data = { type: 'new_challenge', challenge_id: Model.ObjectID(challenge_id), message: message };
			var notification_data = {};
			notification_data.type = 'push';
			notification_data.sub_type = 'new_challenge';
	        notification_data.data = data;
	        notification_data.user_id = Model.ObjectID(user_id);
	        notification_data.read_status = "y";
			var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification){
				if(err){
					callback_func("Failed to access db: "+err);
				}else{
					if(model_get_notification.verify(notification_data))
					{
						notification_data.created_at = (new Date()).getTime();

						model_get_notification.insertOne(notification_data, {}, function(errors, dbres){
							if(errors) {
								callback_func(errors);
							}else{
								sendSuccess( res, {result: dbres} );
							}
						});
					}
				}
			});
		}else{
			sendError(res, "Either user id or challenge id is missing");
		}


	});
	/**
    	@@ Get unread Challenge Notification by user_id
    	@@ input user_id
	**/

	router.get('/get_challenge_notification', function(req, res, next) {
		var user_id = req.userinfo.user._id;
		var trainer_id = req.query.trainer_id || false;
		if(user_id){
			var model_get_notification = Model.load('get_notification', {}, function(err, model_get_notification){
				if(err){
					sendError(res, "Failed to access db: "+err);
				}else{
					var model_tp = Model.load('trainerplan', {}, function(err, model_tp) {
						if(err){
							sendError(res, "Failed to access db: "+err);
						}else{
							var conds = { trainer_id:trainer_id, type: "challenge", challenge: true };

		                    model_tp.find(conds).sort({"modified_date": -1}).limit(1).next(function(err, trainerplan) {
		                        if (err) {
		                            sendError(res, "Failed to retrieve trainer plan: " + err);
		                        } else if (!trainerplan) {
		                            sendError(res, "No Challenge Plan found");
		                        } else {
		                        	sendError(res, "No Challenge Plan found");
									// var conditions = {
									// 	"user_id": new Model.ObjectID(user_id),
									// 	"data.challenge_id": trainerplan._id
								 // 	};

									// var  _loadChallengeNotificationCount = function(conds, callback) {
							  //           model_get_notification.find(conds)
							  //           	.count(callback)
							  //       };
									// _loadChallengeNotificationCount(conditions, function(errors, dbres){
									// 	if(errors){
									// 		return sendError(res, errors);
									// 	}
						   //      		$total = parseInt(dbres);
						   //      		sendSuccess(res, {challenge_notification: $total, challenge_plan_info: trainerplan});
									// });
								}
							});
						}
					});
				}
			});
		}else{
			sendError(res, "user id is missing");
		}
	});


	/***
		@@ update Pending user Status
		@@ input follower and following
	***/

	router.put('/updatePendingRequest', function(req, res, next){
		var userfollow = req.body.userfollow;
		var follower_user = userfollow.follower;
		var following_user = userfollow.following;
		var model_follow = Model.load('userfollow', {}, function(err, model_follow){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{

				var conds = {
					follower: follower_user , following: following_user,
					status: 0
					//status: 1 //Here status 0, 1  values references to Pending Follow Request, Confirm Follow Request
				};
				model_follow.find(conds).limit(1).next(function(err, following_data){
					if(err){
						sendError(res, "Failed to retrieve user follower: "+err);
					}else{
						var updated_data = {};
						updated_data.status =1;
						updated_data.updated_at = (new Date()).getTime();
						model_follow.updateOne(conds, {$set: updated_data }, {}, function(err, r){
							if(err){
								return sendError(res, "Failed to update password");
							}else {
								sendSuccess(res, "Successfully confirmed");
							}
						});
					}
				});
			}
		});
	});

	/**
		@@Social Wall

	**/

	router.get('/get_my_community', function(req, res, next){
		var user_id = req.userinfo.user._id; //loggedIn user Token
		var trainer_id = req.query.trainer_id || false; //trainer id in query string
		if(!trainer_id){
			return sendError(res, "Trainer id is missing, please try again with valid trainer id");
		}
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				sendError(res, "Failed to access db");
			}else{
				var model_post = Model.load('post', {}, function(err, model_post){
					if(err){
						sendError(res, "Failed to access db");
					}else{
						var model_comment = Model.load('comment', {}, function(err, model_comment){
							if(err){
								sendError(res, "Failed to access db");
							}else{
								var model_postlike = Model.load('postlike', {}, function(err, model_postlike){
									if(err){
										sendError(res, "Failed to access db");
									}else{
										getFollowingUsers(user_id, function(err, results){
											if(err){
												return sendError(res, "Fail to fetch following users");
											}
											else{
												var $total = $recordsFiltered = 0;
								                var conditions = { trainer_id: trainer_id }
								                if(req.query.search_caption){
										            conditions.caption = new RegExp('^' + req.query.search_caption + '.*$', "i");
										        }
												var  _loadCommunityPostCount = function(conds, callback) {
										            model_post.find(conds)
										            	.count(callback)
										        };
										        var  _loadCommentCount = function(conds, callback) {
										            model_comment.find(conds)
										            	.count(callback)
										        };
										        var _sendError = function(err) {
										            if (err) {
										               return sendError(res, err);
										            }
										        };
										        var _loadUser = function(conds, callback){
													model_user.findOne(conds, {"profile.name": 1, "profile.image": 1, "profile.privacy_status": 1, "email": 1, "is_trainer": 1}, callback);
												};
										        var _loadRecentComments = function(conds, callback){

													model_comment.find(conds).skip(0).limit(5).sort({'created_at': -1}).toArray(function(err, results){

														if(results && results.length) {
															var comment_count = 0;
															results.forEach(function(dbres, ind) {
																var user_conds = { _id: dbres.user_id };
																_loadUser(user_conds, function(err, user){
																	_sendError(err);
							                            			results[ind].user = user;
						                            				if(++comment_count >= results.length){
							                        					callback(undefined, results);
							                    					}

							                        			});
															});
														}else{
															callback(undefined, results);
														}
													})
												};

												var  _loadPostLikesCount = function(conds1, conds2, callback) {
										            model_postlike.find(conds1)
										            	.count(function(err, like_count){
										            		if(err) callback(err);
										            		else{
									            				model_postlike.find(conds2)
									            					.count(function(err, mylike_count){
									            						if(err) callback(err);
										            					else{
									            							callback(undefined, {likedbyme: mylike_count, like_count:like_count});
										            					}

								            					});
										            		}
									            	});
										        };

												if(results && results.length) {
													var endTime = (new Date()).getTime();
										        	var startTime = endTime - (24 * 2 * 60 * 60 * 1000);
													conditions.$or = [ {"status" : "public", "user_id":{ $in: results }, "created_at": { "$lte":endTime, "$gt":startTime }, "$or": [ {"publishTo":"both" }, {"publishTo":"socialwall"} ] }, { "user_id": user_id, "$or": [ {"publishTo":"both" }, {"publishTo":"socialwall"} ] } ];
												} else{
													conditions.user_id = user_id ;
													conditions.$or = [ {"publishTo":"both" }, {"publishTo":"socialwall"} ];
												}
												_loadCommunityPostCount(conditions, function(err, community_post_count){
													_sendError(err);
									        		$total = parseInt(community_post_count);
								                    $recordsFiltered = parseInt(community_post_count);
								                    var start = (req.query.draw - 1) * req.query.length;
								                    var limit = parseInt(req.query.length);
								                    var draw = parseInt(req.query.draw);

													model_post.find(conditions).skip(start).limit(limit).sort({'created_at': -1}).toArray(function(err, community_posts){
														if(err){
															sendError(res, "Failed to retrieve posts: "+err);
														}else {
															var loadedData = 0;
															var fields = {
																"profile.name": 1, "profile.image": 1, "is_trainer": 1,
																"profile.privacy_status": 1
															};
															if(community_posts && community_posts.length){
								                                community_posts.forEach(function(community_post, ind) {
								                                    var userID = new Model.ObjectID(community_post.user_id);
								                                    var conditions2 = { post_id: community_post._id };
								                                    var conditions3 = { user_id: new Model.ObjectID(user_id), post_id: community_post._id };
								                                    model_user.find({_id: userID}, fields).limit(1).next(function(err, user) {
								                                        if (err) {
								                                            return sendError(res, "Something went wrong, please try again" + err);
								                                        } else {
								                                            community_posts[ind].user = user;
								                                        }
								                                        _loadCommentCount(conditions2, function(err, comment_count){
							                                				_sendError(err);
							                                				community_posts[ind].comment_count = comment_count;
							                                				_loadRecentComments(conditions2, function(err, recent_comments){
								                                				_sendError(err);
								                                				community_posts[ind].recent_comments = recent_comments;
								                                				_loadPostLikesCount(conditions2, conditions3, function(err, post_likes){
									                                				if(err) _sendError(err);
									                                				else{
									                                					community_posts[ind].post_likes = post_likes;

										                                				if (++loadedData >= community_posts.length) {

												                                        	sendSuccess(res, {followings: community_posts, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total, following: results});
												                                        }
									                                				}
										                                        });
									                                        });
							                            				});

								                                    });

								                                });
							                                }else{
							                                	sendSuccess(res, {followings: [], draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total, following: results});
							                                }

														}
													});
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

	/***
		@@ Get User's all post
		@@ order by date DESC
		@@ input profile_id
	***/

	router.get('/get_user_post/:profile_id', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var profile_id = req.params.profile_id || false;
		if(profile_id) {
			var model_user = Model.load('user', {}, function(err, model_user){
				if(err){
					sendError(res, "Failed to access db");
				}else{
					var model_post = Model.load('post', {}, function(err, model_post){
						if(err){
							sendError(res, "Failed to access db");
						}else{
							var model_comment = Model.load('comment', {}, function(err, model_comment){
								if(err){
									sendError(res, "Failed to access db");
								}else{
									var model_postlike = Model.load('postlike', {}, function(err, model_postlike){
										if(err){
											sendError(res, "Failed to access db");
										}else{
											var $total = $recordsFiltered = 0;
							                var conditions = {};
											var  _loadCommunityPostCount = function(conds, callback) {
									            model_post.find(conds)
									            	.count(callback)
									        };
									        var  _loadCommentCount = function(conds, callback) {
									            model_comment.find(conds)
									            	.count(callback)
									        };
									        var  _loadPostLikesCount = function(conds1, conds2, callback) {
									            model_postlike.find(conds1)
									            	.count(function(err, like_count){
									            		if(err) callback(err);
									            		else{
								            				model_postlike.find(conds2)
								            					.count(function(err, mylike_count){
								            						if(err) callback(err);
									            					else{
								            							callback(undefined, {likedbyme: mylike_count, like_count:like_count});
									            					}

							            					});
									            		}
									            	});
									        };
									        var _sendError = function(err) {
									            if (err) {
									               return sendError(res, err);
									            }
									        };
									        conditions.user_id = profile_id
								        	getFollowingUsers(user_id, function(err, following_users){
												if(err){
													return sendError(res, "Fail to fetch following users");
												}
												else{
													_loadCommunityPostCount(conditions, function(err, community_post_count){
														_sendError(err);
										        		$total = parseInt(community_post_count);
									                    $recordsFiltered = parseInt(community_post_count);
									                    var start = (req.query.draw - 1) * req.query.length;
									                    var limit = parseInt(req.query.length);
									                    var draw = parseInt(req.query.draw);
														model_post.find(conditions).skip(start).limit(limit).sort({'created_at': -1}).toArray(function(err, dbres){
															if(err){
																console.error("ERROR==", err);
																sendError(res, "Failed to retrieve posts: "+err);
															}else {
																var loadedUsers = 0;
																var fields = {
																	"profile.name": 1, "profile.image": 1, "is_trainer": 1,
																	"profile.privacy_status": 1
																};
																if(dbres && dbres.length){
									                                dbres.forEach(function(user_post, ind) {
									                                	var userID = new Model.ObjectID(user_post.user_id);
									                                	var conditions2 = { post_id: user_post._id };
									                                	var conditions3 = { user_id: new Model.ObjectID(user_id), post_id: user_post._id };
									                                    model_user.find({_id: userID}, fields).limit(1).next(function(err, user) {
								                                    	 	_sendError(err);
									                                        dbres[ind].user = user;
									                                        _loadCommentCount(conditions2, function(errors, comment_count){
								                                				_sendError(errors);
								                                				dbres[ind].comment_count = comment_count;
								                                				_loadPostLikesCount(conditions2, conditions3, function(err, post_likes){
								                                					if(err) _sendError(err);
								                                					else{
								                                						dbres[ind].post_likes = post_likes;
								                                						if (++loadedUsers >= dbres.length) {

												                                        	sendSuccess(res, {data: dbres, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total, following: following_users});
												                                        }
								                                					}
							                                					});

								                            				});
									                                    });
									                                });
									                            }else{
									                            	sendSuccess(res, {data: dbres, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total, following: following_users});
									                            }

															}
														});
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
		}else{
			sendError(res, "profile id is missing");
		}
	});

	/***
		@@get followers API
		@@input following id
		@@output a list of followers and count of followers

	***/

	router.get('/user_followers/:id', function(req, res, next){
		var following= req.params.id || false;
		var user_id = req.userinfo.user._id;
		if(following === false){
			return sendError(res, "Required parameters missing!");
		}
		var model_follow = Model.load('userfollow', {}, function(err, model_follow){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{

				var conds = {
					following: following,
					status: 1
				};
				var conditions = {};
				var $total = 0;
        		var $recordsFiltered = 0;

				if(req.query.search){
		            conditions = { "profile.name": new RegExp('^' + req.query.search + '.*$', "i") };
		        }

				var  _loadFollowersCount = function(callback) {
		            model_follow.find(conds)
		            	.count(callback)
		        };

	        	_loadFollowersCount(function(err, followers_count){
	        		$total = parseInt(followers_count);
                    $recordsFiltered = parseInt(followers_count);
                    var start = (req.query.draw - 1) * req.query.length;
                    var limit = parseInt(req.query.length);
                    var draw = parseInt(req.query.draw);

                    getFollowingUsers(user_id, function(err, following_users){
						if(err){
							return sendError(res, "Fail to fetch following users");
						}
						else{
							getFollowersUsers(following, function(err, results){
								if(err){
									return sendError(res, "Fail to fetch user's followers list");
								}
								if(results && results.length)
								{
									var model_user = Model.load('user', {}, function(err, model_user){
										conditions._id = {"$in": results};
										var fields = {
											"profile.name": 1, "profile.image": 1, "profile.privacy_status": 1, "email": 1, "is_trainer": 1
										};
										model_user.find(conditions, fields).skip(start).limit(limit).sort({'created_at': -1}).toArray(function(err, user){
											if(err){
												sendError(res, err);
											}else{
												getRequestedFollowingFollowersUserIds(user_id, function(error, pending_follower_following){
													if(error){
														return sendError(res, "Fail to fetch follower following users");
													}else{
														sendSuccess(res, {followers: user, followers_count: $total, my_following: following_users, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total, pending_follower_following: pending_follower_following})
													}
												})
											}

										});

									});
								}else{
									sendSuccess(res, {followers: [], followers_count: $total, my_following: following_users, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total});
								}

							});
						}
					});

	        	});
			}
		});
	});

	/***
		@@get Following Users API
		@@input follower id
		@@output a list of following users and count of following users

	***/

	router.get('/user_following/:id', function(req, res, next){
		var follower= req.params.id || false;
		var user_id = req.userinfo.user._id;
		if(follower) {
			var model_follow = Model.load('userfollow', {}, function(err, model_follow){
				if(err){
					sendError(res, "Failed to access db: "+err);
				}else{

					var conds = {
						follower: follower,
						status: 1
					};

					var conditions = {};
					var $total = 0;
	        		var $recordsFiltered = 0;

					if(req.query.search){
			            conditions = { "profile.name": new RegExp('^' + req.query.search + '.*$', "i") };
			        }

					var  _loadFollowingCount = function(callback) {
			            model_follow.find(conds)
			            	.count(callback)
			        };

		        	_loadFollowingCount(function(err, following_count){
		        		$total = parseInt(following_count);
	                    $recordsFiltered = parseInt(following_count);
	                    var start = (req.query.draw - 1) * req.query.length;
	                    var limit = parseInt(req.query.length);
	                    var draw = parseInt(req.query.draw);

	                    getFollowingUsers(user_id, function(err, following_users){
							if(err){
								return sendError(res, "Fail to fetch following users");
							}
							else{
			                    getFollowingUserIds(follower, function(err, results){
									if(err){
										return sendError(res, "Fail to fetch user's following list");
									}
									if(results && results.length)
									{
										var model_user = Model.load('user', {}, function(err, model_user){
											conditions._id = {"$in": results};
											var fields = {
												"profile.name": 1, "profile.image": 1, "profile.privacy_status": 1, "email": 1, "is_trainer": 1,
											};
											model_user.find(conditions, fields).skip(start).limit(limit).sort({'created_at': -1}).toArray(function(err, user){
												if(err){
													sendError(res, err);
												}else{
													sendSuccess(res, {following: user, my_following: following_users, following_count: $total, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total});
												}

											});

										});
									}else{
										sendSuccess(res, {following: [], my_following: following_users, following_count: $total, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total});
									}

								});
							}
						});

		        	});
				}
			});
		} else{
			sendError(res, " Required parameters are missing");
		}
	});

	/***
		@@ Get a list of Ids of Pending Following-Followers with Object
		@@ input Login user id
		@@ return an array of Pending Following-Followers User List
 	***/

	function getRequestedFollowingFollowersUserIds( user_id, callback ){
		var pending_lists = [];
		var pending_following_lists = [];
		var pending_followers_lists = [];
		var model_follow = Model.load('userfollow', {}, function(err, model_follow){
			if(err){
				callback("Failed to access db");
			}else{
				var conds = {
					$or: [{follower: user_id}, {following: user_id}],
					status: 0
				};
				model_follow.find(conds).toArray(function(err, pending_users){
					if(err) {
						callback("Failed to retrieve record");
					}else{
						if(pending_users && pending_users.length){

							pending_users.forEach(function(fu){
								if(fu.following==user_id){
									pending_lists.push(new Model.ObjectID(fu.follower) );
									pending_followers_lists.push(new Model.ObjectID(fu.follower) );
								}else{
									pending_lists.push(new Model.ObjectID(fu.following) );
									pending_following_lists.push(new Model.ObjectID(fu.following) );
								}
							});
						}
						callback(undefined, { pending_lists: pending_lists, pending_followers_lists: pending_followers_lists, pending_following_lists: pending_following_lists});
					}
				});
			}
		});

	}


	/***
		@@ Get a list of Ids of Following user with Object
		@@ input Login user id
		@@ return an array of Following User List
 	***/


	function getFollowingUserIds( follower_id, callback ){
		var my_following = [];
		var model_follow = Model.load('userfollow', {}, function(err, model_follow){
			if(err){
				callback("Failed to access db");
			}else{
				var conds = {
					follower: follower_id,
					status: 1
				};
				model_follow.find(conds).toArray(function(err, following_users){
					if(err) {
						callback("Failed to retrieve record");
					}else{
						if(following_users && following_users.length){

							following_users.forEach(function(fu){
								my_following.push(new Model.ObjectID(fu.following) );
							});
						}
						callback(undefined, my_following);
					}
				});
			}
		});

	}


	/***
		@@ Get a list of Ids of Following user
		@@ input follower id
		@@ return an array of Following User List with pending status or confirm
 	***/


	function getPendingAndConfirmUsers( follower_id, callback ){
		var my_following = []
		var model_follow = Model.load('userfollow', {}, function(err, model_follow){
			if(err){
				callback("Failed to access db")
			}else{
				var conds = {
					follower: follower_id
				}
				model_follow.find(conds).toArray(function(err, following_users){
					if(err) {
						callback("Failed to retrieve record")
					}else{
						callback(undefined, following_users)
					}
				});
			}
		});

	};

	/***
		@@ Get a list of Ids of Following user
		@@ input Login user id
		@@ return an array of Following User List
 	***/


	function getFollowingUsers( follower_id, callback ){
		var my_following = [];
		var model_follow = Model.load('userfollow', {}, function(err, model_follow){
			if(err){
				callback("Failed to access db");
			}else{
				var conds = {
					follower: follower_id,
					status: 1
				};
				model_follow.find(conds).toArray(function(err, following_users){
					if(err) {
						callback("Failed to retrieve record");
					}else{
						if(following_users && following_users.length){

							following_users.forEach(function(fu){
								my_following.push(fu.following);
							});
						}
						callback(undefined, my_following);
					}
				});
			}
		});

	}

	/***
		@@ Get a list of Ids of Followers user
		@@ input Login user id
		@@ return an array of Followers User List
 	***/


	function getFollowersUsers( following_id, callback ){
		var my_followers= [];
		var model_follow = Model.load('userfollow', {}, function(err, model_follow){
			if(err){
				callback("Failed to access db");
			}else{
				var conds = {
					following: following_id,
					status: 1
				};
				model_follow.find(conds).toArray(function(err, followers_users){
					if(err) {
						callback("Failed to retrieve record");
					}else{
						if(followers_users && followers_users.length){

							followers_users.forEach(function(fu){
								my_followers.push(new Model.ObjectID(fu.follower));
							});
						}
						callback(undefined, my_followers);
					}
				});
			}
		});

	};

	/**
		@@ Get List of Blocked User
		@@ Get List Reported Posts
	**/

	function getReportedPostsAndBlockedUsers( user_id, callback ){
		var model_report_post = Model.load('report_post', {}, function(err, model_report_post){
			if(err){
				callback("Failed to access db")
			}else{
				var model_block_user = Model.load('block_user', {}, function(err, model_block_user){
					if(err){
						callback("Failed to access db")
					}else{
						var conditions = { posted_by: Model.ObjectID(user_id) }
						var conditions2 = { blocker: Model.ObjectID(user_id) }
						model_report_post.find(conditions).toArray(function(err, reported_posts){
							if(err) {
								callback("Failed to retrieve record")
							}else{
								model_block_user.find(conditions2).toArray(function(err, blocked_users){
									if(err) {
										callback("Failed to retrieve record")
									}else{
										var reportedPosts = _.map(reported_posts, function(n) {
	                                        return n.post_id;
	                                    })
	                                    var blockedUsers = _.map(blocked_users, function(n) {
	                                        return n.blocked+"";
	                                    })
										callback(undefined, {reported_posts: reportedPosts, blocked_users: blockedUsers })
									}
								})
							}
						})
					}
				})
			}
		})
	}

	/***
		@@delete follower API
		@@input id
		@@deleted row

	***/

	router.delete('/user_follow/:follower_id/:following_id', function(req, res, next){
		var follower_id= req.params.follower_id;
		var following_id= req.params.following_id;
		var model_follow = Model.load('userfollow', {}, function(err, model_follow){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{

				var conditions = {
					follower: follower_id,
					following: following_id
				};
				model_follow.deleteOne(conditions, {}, function(err, deleted_follow){
					if(err) {
						sendError(res, "Failed to retrieve record: "+err);
					}else{
						sendSuccess(res, {result: deleted_follow});
					}
				});
			}
		});
	});

	/**
		@@Get user/s information
		@@input user id
	**/

	router.get("/user_profile", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var profile_id = req.query.profile_id || false;
		if(profile_id)
		{
			var model_post = Model.load('post', {}, function(err, model_post){
				if(err){
					return sendError(res, "Failed to access db: "+err);
				}
				var model_user = Model.load('user', {}, function(err, model_user){
					if(err){
						return sendError(res, "Failed to access db: "+err);
					}
					var fields = {
						"profile": 1, "device_token": 1, "email": 1, "is_trainer": 1, "joined_on": 1
					};
					var  _loadCommunityPostCount = function(conds, callback) {
			            model_post.find(conds)
			            	.count(callback)
			        };
			        var _sendError = function(err) {
			            if (err) {
			               return sendError(res, err);
			            }
			        };

					model_user.find({_id: Model.ObjectID(profile_id)}, fields).limit(1).next(function(err, user){
						if(err){
							return sendError(res, "Something went wrong while fetch user profile: "+err);
						}
						if(!user){
							return sendError(res, "Something went wrong, there is no such user!");
						}
						getFollowingUserIds(profile_id, function(err, following_results){
							if(err){
								return sendError(res, "Fail to fetch user's following list");
							}else{
								getFollowersUsers(profile_id, function(err, follower_results){
									if(err){
										return sendError(res, "Fail to fetch user's followers list");
									}else{
										var conditions = { user_id: profile_id };
										_loadCommunityPostCount(conditions, function(err, community_post_count){
											_sendError(err);
											var active_plan_key = user.profile.active_plan_key || false;
											if(active_plan_key && active_plan_key.length == 24 && user.profile['savedData_' + active_plan_key] && typeof user.profile['savedData_' + active_plan_key] !="undefined")
							                {
							            		var sorted_array = workout_history_array = [];
							            		var streak_count = current_streak_count = longest_streak_count = skipped_count = completed_workout = 0;
							            		var streak_count_yes = hstreak_count_yes = false;
							                	var today_date = new Date();
							                	var previous_date = new Date(today_date.getFullYear(), today_date.getMonth(), today_date.getDate(), 0,0,0,0)
							            		// Make an array of all dates available in Workout History
							                	if(typeof user.profile['workout_history_' + active_plan_key]!="undefined" && user.profile['workout_history_' + active_plan_key]){
							                		var workout_history = JSON.parse(user.profile['workout_history_' + active_plan_key]);
							                		// // sort in descending order of workout history to count Completed Workout
							                		workout_history.sort(function(a,b) {
							                            return (new Date(a.date).getTime() < new Date(b.date).getTime()) ? 1 : ((new Date(b.dtea).getTime() < new Date(a.date).getTime()) ? -1 : 0);
							                        });
							                        //filter those dates <= currentdate
							                        workout_history = workout_history.filter(function(item){
							                            return new Date(item.date).getTime() <= today_date.getTime();
							                        });

							                    	(workout_history).forEach(function(wh){
							                            if(parseInt(wh.indexOfWorkout) == -1) workout_history_array.push(new Date(wh.date).getTime())
							                        });

							                        // calculate completed Workout
							                        (workout_history).forEach(function(wh){
							                            var hdate = new Date(wh.date)
									                    if(parseInt(wh.indexOfWorkout) == -1) {
									                    	completed_workout++
									                    	if(!streak_count && previous_date.getTime() == hdate.getTime()){
								                            	// check else if workout history
								                        		streak_count++//Increase streak_count
								                        		current_streak_count = streak_count;
								                            }else{
								                            	if(previous_date.getTime() - hdate.getTime() == 86400 * 1000){// sequential date
									                                streak_count++//Increase streak_count
									                                if(!hstreak_count_yes) {
									                        			current_streak_count = streak_count
									                        		}
									                            }
									                            else if(previous_date.getTime() - hdate.getTime() < 86400 * 1000){ //same date repettition
									                        		if(!hstreak_count_yes) {
									                        			current_streak_count = streak_count
									                        		}
								                                }else {
								                                	//non sequential date
									                        		// break streak
									                        		if(longest_streak_count < streak_count){
									                        			longest_streak_count = streak_count
									                        		}
									                        		if(!hstreak_count_yes) {
									                        			current_streak_count = streak_count
									                        			hstreak_count_yes = true
									                        		}
									                        		streak_count = 1
									                        	}
								                            }
								                            if(longest_streak_count < streak_count){
								                    			longest_streak_count = streak_count
								                    		}
									                    }
									                    previous_date = hdate

							                        })
							                    }
							                    var saved_user_data = JSON.parse(user.profile['savedData_' + active_plan_key]);
							                    if( saved_user_data.length ) {
								                    if(Array.isArray(saved_user_data[0])==false){
								                        // for ANDROID users
								                        var date = new Date();
								                        var current_date = prev_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0,0);
								                        // Make an array of all dates available in Saved Data
								                        saved_user_data.forEach(function(item){
								                            sorted_array.push(item);
								                        });
								                        // sort them in descending order of date
								                        sorted_array.sort(function(a,b) {
								                            return (new Date(a.dateWithYear).getTime() < new Date(b.dateWithYear).getTime()) ? 1 : ((new Date(b.dateWithYear).getTime() < new Date(a.dateWithYear).getTime()) ? -1 : 0);
								                        });
								                        //filter those dates <= currentdate
								                        sorted_array = sorted_array.filter(function(item){
								                            return new Date(item.dateWithYear).getTime() <= current_date.getTime();
								                        });

								                        sorted_array.forEach(function(json){
								                        	var dateWithYear = new Date(json.dateWithYear);
								                            if(json.workoutComplete.toLowerCase() == 'yes'){
								                            	completed_workout++;
								                            	// check if previous date  is current date
								                                if(!streak_count && prev_date.getTime() == dateWithYear.getTime()){
								                                    streak_count++;
								                                    current_streak_count = streak_count;
								                                }
								                                else{// check if sequential date
								                                	if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
								                                        if(!streak_count_yes) {
								                                			current_streak_count = streak_count;
								                                		}
								                                    }
								                                    else if(prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000){
								                                        streak_count++;
								                                        if(!streak_count_yes) {
								                                			current_streak_count = streak_count;
								                                		}
								                                    }else{ //Non Sequntials date
								                                		if(longest_streak_count < streak_count){
								                                			longest_streak_count = streak_count;
								                                		}
								                                		if(!streak_count_yes) {
								                                			current_streak_count = streak_count;
								                                			streak_count_yes = true;
								                                		}
								                                		streak_count = 0;
								                                    }
								                                }
								                            }
								                            else if(json.workoutComplete.toLowerCase() == 'skipped'){
								                                skipped_count++;

								                                // check else if workout history
								                                if(workout_history_array.indexOf(dateWithYear.getTime()) >= 0 && (!streak_count || prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000)){
								                            		//streak_count++;
								                            		current_streak_count = streak_count;
								                            	}else if(prev_date.getTime() - dateWithYear.getTime() >= 86400 * 1000){
								                            		if(longest_streak_count < streak_count){
								                            			longest_streak_count = streak_count;
								                            		}
								                            		if(!streak_count_yes) {
								                            			current_streak_count = streak_count;
								                            			streak_count_yes = true;
								                            		}
								                            		streak_count = 0;

								                            	}
								                            }
								                            else if(json.workoutComplete.toLowerCase() == 'no'){

								                            	if(/rest/i.test(json.label)) { // check if rest comes in Workout Label String
								                            		if((prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000))  {
									                                	streak_count++;
										                            	current_streak_count = streak_count;
									                            	}
									                            	else if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
									                                	if(!streak_count_yes) {
								                                			current_streak_count = streak_count;
								                                			streak_count_yes = true;
								                                		}
									                                }
								                                }else{ //break streak
								                                	if(!hstreak_count_yes) { // If manual workout history not processed
									                            		if(longest_streak_count < streak_count){
								                                			longest_streak_count = streak_count;
								                                		}
								                                		if(!streak_count_yes) {
									                            			current_streak_count = streak_count;
									                            			streak_count_yes = true;
									                            		}
									                            		streak_count = 0;
								                            		}
								                            	}
								                            }
								                            if(longest_streak_count < streak_count){
								                    			longest_streak_count = streak_count;
								                    		}
								                            prev_date = dateWithYear;
								                        });
								                        user.profile.longest_streak_count = longest_streak_count;
								                        user.profile.current_streak_count = current_streak_count;
								                        user.profile.skipped_workout = skipped_count;
								                        user.profile.completed_workout = completed_workout;

								                    }else{
								                     	// for IOS users
								                     	var date = new Date();
								                        var current_date = prev_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0,0);
								                        var json_array = JSON.parse(user.profile['savedData_' + active_plan_key]);
								                        json_array.forEach(function(json){

								                            json.forEach(function(item){
								                                sorted_array.push(item);
								                            });
								                        });
								                        // sort them in descending order of date
								                        sorted_array.sort(function(a,b) {
								                            return (new Date(a.dateWithYear).getTime() < new Date(b.dateWithYear).getTime()) ? 1 : ((new Date(b.dateWithYear).getTime() < new Date(a.dateWithYear).getTime()) ? -1 : 0);
								                        });
								                        //filter those date <= current date
								                        sorted_array = sorted_array.filter(function(item){
								                            return new Date(item.dateWithYear).getTime() <= current_date.getTime();
								                        });
								                        sorted_array.forEach(function(json, index){
								                        	var dateWithYear = new Date(json.dateWithYear);
								                            if(json.workoutComplete.toLowerCase() == 'yes'){
								                            	completed_workout++;
								                                // check if previous date  is current date
								                                if(!streak_count && prev_date.getTime() == dateWithYear.getTime()){
								                                    streak_count++;
								                                    current_streak_count = streak_count;
								                                }
								                                else{// check if sequential date
								                                	if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
								                                        if(!streak_count_yes) {
								                                			current_streak_count = streak_count;
								                                		}
								                                    }
								                                    else if(prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000){
								                                        streak_count++;
								                                        if(!streak_count_yes) {
								                                			current_streak_count = streak_count;
								                                		}
								                                    }else{ //Non Sequntials date
								                                		if(longest_streak_count < streak_count){
								                                			longest_streak_count = streak_count;
								                                		}
								                                		if(!streak_count_yes) {
								                                			current_streak_count = streak_count;
								                                			streak_count_yes = true;
								                                		}
								                                		streak_count = 0;
								                                    }
								                                }
								                            }
								                            else if(json.workoutComplete.toLowerCase() == 'skipped'){
								                                skipped_count++;

								                                // check else if workout history
								                                if(workout_history_array.indexOf(dateWithYear.getTime()) >= 0 && (!streak_count || prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000)){
								                            		//streak_count++;
								                            		current_streak_count = streak_count;
								                            	}else if(prev_date.getTime() - dateWithYear.getTime() >= 86400 * 1000){
								                            		if(longest_streak_count < streak_count){
								                            			longest_streak_count = streak_count;
								                            		}
								                            		if(!streak_count_yes) {
								                            			current_streak_count = streak_count;
								                            			streak_count_yes = true;
								                            		}
								                            		streak_count = 0;

								                            	}
								                            }
								                            else if(json.workoutComplete.toLowerCase() == 'no'){

								                            	if(/rest/i.test(json.label)) { // check if rest comes in Workout Label String
								                            		if((prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000))  {
									                                	streak_count++;
										                            	current_streak_count = streak_count;
									                            	}
									                            	else if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
									                                	if(!streak_count_yes) {
								                                			current_streak_count = streak_count;
								                                			streak_count_yes = true;
								                                		}
									                                }
								                                }else{ //break streak
								                                	if(!hstreak_count_yes) { // If manual workout history not processed
									                            		if(longest_streak_count < streak_count){
								                                			longest_streak_count = streak_count;
								                                		}
								                                		if(!streak_count_yes) {
									                            			current_streak_count = streak_count;
									                            			streak_count_yes = true;
									                            		}
									                            		streak_count = 0;
								                            		}
								                            	}
								                            }
								                            if(longest_streak_count < streak_count){
								                    			longest_streak_count = streak_count;
								                    		}
								                            prev_date = dateWithYear;
								                        });
								                        user.profile.longest_streak_count = longest_streak_count;
								                        user.profile.current_streak_count = current_streak_count;
								                        user.profile.skipped_workout = skipped_count;
								                        user.profile.completed_workout = completed_workout;
								                    }
							                    }

							                }
							                delete user.profile['savedData_' + active_plan_key];
											sendSuccess(res, {user: user, community_post_count: community_post_count, following: following_results.length, followers: follower_results.length});
										});
									}
								});

							}
						});

					});

				});
			});
		}else{
			sendError(res, "You are missing profile ID");
		}

	});


	/***
		@@Get List of Follower-Following request
		@@input user_id

	***/

	router.get("/pending_follower_following", function(req, res, next){
		var user_id = req.userinfo.user._id;
		if(user_id)
		{
			var model_follow = Model.load('userfollow', {}, function(err, model_follow){
				if(err){
					return sendError(res, "Failed to access db: "+err);
				}
				var conds = {
					$or: [{follower: user_id}, {following: user_id}],
					status: 0
				};

				var conditions = {};
				var $total = 0;
        		var $recordsFiltered = 0;

				if(req.query.search){
		            conditions = { "profile.name": new RegExp('^' + req.query.search + '.*$', "i") };
		        }

				var  _loadRequestedFollowingFollowersCount = function(callback) {
		            model_follow.find(conds)
		            	.count(callback)
		        };

	        	_loadRequestedFollowingFollowersCount(function(err, pending_count){
	        		$total = parseInt(pending_count);
                    $recordsFiltered = parseInt(pending_count);
                    var start = (req.query.draw - 1) * req.query.length;
                    var limit = parseInt(req.query.length);
                    var draw = parseInt(req.query.draw);

					getRequestedFollowingFollowersUserIds(user_id, function(err, results){
						if(err){
							return sendError(res, "Fail to fetch user's requested follower-following list");
						}
						if(results.pending_lists && results.pending_lists.length)
						{
							var model_user = Model.load('user', {}, function(err, model_user){
								conditions._id = { "$in": results.pending_lists };
								var fields = {
									"profile.name": 1, "profile.image": 1, "profile.privacy_status": 1, "email": 1
								};
								model_user.find(conditions, fields).skip(start).limit(limit).sort({'created_at': -1}).toArray(function(err, user){
									if(err){
										sendError(res, "Something went wrong, please try again: ", err);
									}else{
										sendSuccess(res, {pending_follower_following: user, pending_lists: results, pending_follower_following_count: $total, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total});
									}

								});

							});
						}else{
							sendSuccess(res, {pending_follower_following: [], pending_lists: {}, pending_follower_following_count: $total, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total});
						}

					});
				});

			});
		}else{
			sendError(res, "You are missing user ID");
		}

	});


	/***
		@@ Contact Us
		@@ input - name, email, subject, message

	**/
	router.post('/contact_to_trainer', function(req, res, next){
		var posted_data = req.body;
		var trainer_id = req.body.trainer_id || false
		var user_id = req.userinfo.user._id
		if(user_id && posted_data.user_id && user_id != posted_data.user_id){
			return sendError(res, "Not authorized to call this API")
		}
		if(trainer_id){
			var model_trainer = Model.load('trainer', {}, function(err, model_trainer) {
	            if (err) {
	                sendError(res, "Failed to access db: " + err);
	            } else {
	                model_trainer.find({_id: Model.ObjectID(trainer_id)}).toArray(function(err, trainer) {
	                    if (err) {
	                        sendError(res, "Failed to retrieve trainers: " + err);
	                    } else {
	                    	var html_content = 'Hello Tianna, <br> <p> A user wants to contact to you. His/Her information is given as follows:<br></p><p> <strong>Name: </strong>'+ posted_data.name + '</p><p> <strong>Email: </strong>'+ posted_data.email+ '</p><p><strong>Message: </strong>'+ posted_data.message+ '</p>';

	                    	if(posted_data.cityname && posted_data.phonenumber){
	                    		html_content+= '<p><strong>City: </strong>'+ posted_data.cityname+'</p><p><strong>Instagram: </strong>'+ posted_data.instagram+'</p><p><strong>Phone Number: </strong>' + posted_data.phonenumber+ '</p>'
	                    	}
	                    	html_content+= '<br><br><p> Thanks & Regards, <br> Plankk Support';

	                    	if(trainer_id == "5a690da90379ce6d1fed04ac") {
	                    		mailer.sendMail({from: 'Contact Support <support@plankk.com>', to: "app@tiannag.com", subject: posted_data.subject, html: html_content});
	                    	} else if(trainer_id == "5acd3eb90780015c1e9cc568"){
	                    		mailer.sendMail({from: 'Contact Support <support@plankk.com>', to: "GLUmentor@koyawebb.com", subject: posted_data.subject, html: html_content});
	                    	} else if(trainer_id == "5aa6e4c527d727022ed0a9a8" ){
	                    		var html_content = 'Dear Lift With Cass Team, <br> <p> My problem with the app is: </p> <p><strong>Username/email:</strong> ' + posted_data.email + '</p><p><strong>Message: </strong>' + posted_data.message + '</p>';
	                    		mailer.sendMail({from: 'Contact Support <support@plankk.com>', to: "support@plankk.com", subject: posted_data.subject, html: html_content});
	                    	} else{
	                    		mailer.sendMail({from: 'Contact Support <support@plankk.com>', to: trainer.email, subject: posted_data.subject, html: html_content});
	                    	}
	                    	sendSuccess(res, {message: "Thanks for contacting us, we will contact you soon"});

	                    }
	                })
	            }
	        })
		}else{
			return sendError(res, "trainer id is missing")
		}
	})

	/***
		@@Send Mail to Influencer
		@@input user_id

	***/

	router.post('/send_mail_to_influencer', function(req, res, next){
		var post = req.body
		var trainer_id = req.body.trainer_id || false
		var user_id = req.userinfo.user._id
		if(user_id && post.user_id && user_id != post.user_id){
			return sendError(res, "Not authorized to call this API")
		}
		if(req.files && req.files.length){

			var baseFolder = path.join(path.dirname(require.main.filename), "uploads/community/")

			Model.uploadFiles(req, baseFolder, post.user_id + "_", function(succeeded, failed, succeeded_images, succeeded_videos){
				if(!succeeded_images.length){
					sendError(res, "Failed to upload all file(s)")
				}else{
					post.image = succeeded_images.shift();
					var attachment = config.base_url+"uploads/community/"+post.image;
					var model_user = Model.load('user', {}, function(err, model_user){
						var conditions = { _id: Model.ObjectID(user_id) }
						model_user.findOne(conditions, {"email": 1 }, function(error, dbres){

							if(error) sendError(res, error)
								else{

									var email = dbres.email || "";
									var mailConfiguraion ={

										"597b8a331b54472074c2dd1a": { //SSP
											"to": "sugarysixpack@gmail.com, plankkprogresspics@gmail.com",
											"subject": "SugarySixpack Before/After",
											"html": "Hi Niki, <p>"+post.username+ "(" +email+ ") has shared a post with you.</p><p><b>Before Data: </b></p><p>Weight: "+post.before_weight+" </p><p>Weekday: "+post.before_week+" </p><p>Date: "+post.before_date+" </p> <br><p><b>After Data: </b></p><p>Weight: "+post.after_weight+" </p><p>Weekday: "+post.after_week+" </p><p>Date: "+post.after_date+" </p> <p> Thanks & Regards, <br> Plankk</p>",
											"attachments": [{filename: post.image, path:  attachment}]
										},
										"57c5310521bbac1d01aa75db": { // FnT
											"to": "info@getfitandthick.com, plankkprogresspics@gmail.com",
											"subject": "F+T Before/After",
											"html": "Hi Nicole, <p>"+post.username+ "(" +email+ ") has shared a post with you.</p><p><b>Before Data: </b></p><p>Weight: "+post.before_weight+" </p><p>Weekday: "+post.before_week+" </p><p>Date: "+post.before_date+" </p> <br><p><b>After Data: </b></p><p>Weight: "+post.after_weight+" </p><p>Weekday: "+post.after_week+" </p><p>Date: "+post.after_date+" </p> <p> Thanks & Regards, <br> Plankk</p>",
											"attachments": [{filename: post.image, path:  attachment}]
										},
										"5a8c7aff14d55f7ad445a6f3": {// Boothcamp
											"to": "sboothmedia@gmail.com, plankkprogresspics@gmail.com",
											"subject": "Boothcamp Before/After",
											"html": "Hi Shawn, <p>"+post.username+ "(" +email+ ") has shared a post with you.</p><p><b>Before Data: </b></p><p>Weight: "+post.before_weight+" </p><p>Weekday: "+post.before_week+" </p><p>Date: "+post.before_date+" </p> <br><p><b>After Data: </b></p><p>Weight: "+post.after_weight+" </p><p>Weekday: "+post.after_week+" </p><p>Date: "+post.after_date+" </p> <p> Thanks & Regards, <br> Plankk</p>",
											"attachments": [{filename: post.image, path:  attachment}]
										},
										"5a848f72c3b5c3530a8d05f1": {// ZBody
											"to": "zoe20359@gmail.com, plankkprogresspics@gmail.com",
											"subject": "ZBody Before/After",
											"html": "Hi Zoe, <p>"+post.username+ "(" +email+ ") has shared a post with you.</p><p><b>Before Data: </b></p><p>Weight: "+post.before_weight+" </p><p>Weekday: "+post.before_week+" </p><p>Date: "+post.before_date+" </p> <br><p><b>After Data: </b></p><p>Weight: "+post.after_weight+" </p><p>Weekday: "+post.after_week+" </p><p>Date: "+post.after_date+" </p> <p> Thanks & Regards, <br> Plankk</p>",
											"attachments": [{filename: post.image, path:  attachment}]
										},
										"5aa6e4c527d727022ed0a9a8": {// Lift With Cass
											"to": "cass@wrkethicsupps.com, plankkprogresspics@gmail.com",
											"subject": "LIFT with Cass Martin Before/After",
											"html": "Hi Cass, <p>"+post.username+ "(" +email+ ") has shared a post with you.</p><p><b>Before Data: </b></p><p>Weight: "+post.before_weight+" </p><p>Weekday: "+post.before_week+" </p><p>Date: "+post.before_date+" </p> <br><p><b>After Data: </b></p><p>Weight: "+post.after_weight+" </p><p>Weekday: "+post.after_week+" </p><p>Date: "+post.after_date+" </p> <p> Thanks & Regards, <br> Plankk</p>",
											"attachments": [{filename: post.image, path:  attachment}]
										},
										"5a690da90379ce6d1fed04ac": {// Tianna
											"to": "app@tiannag.com, plankkprogresspics@gmail.com",
											"subject":"Tianna Before/After",
											"html": "Hi Tianna, <p>"+post.username+ "(" +email+ ") has shared a post with you.</p><p><b>Before Data: </b></p><p>Weight: "+post.before_weight+" </p><p>Weekday: "+post.before_week+" </p><p>Date: "+post.before_date+" </p> <br><p><b>After Data: </b></p><p>Weight: "+post.after_weight+" </p><p>Weekday: "+post.after_week+" </p><p>Date: "+post.after_date+" </p> <p> Thanks & Regards, <br> Plankk</p>",
											"attachments": [{filename: post.image, path:  attachment}]
										},
										"591c8094da9386315f51787e": {// Gabriela
											"to": "cgabrielabandy@gmail.com, plankkprogresspics@gmail.com",
											"subject":"Gabriela Before/After",
											"html": "Hi Gabriela, <p>"+post.username+ "(" +email+ ") has shared a post with you.</p><p><b>Before Data: </b></p><p>Weight: "+post.before_weight+" </p><p>Weekday: "+post.before_week+" </p><p>Date: "+post.before_date+" </p> <br><p><b>After Data: </b></p><p>Weight: "+post.after_weight+" </p><p>Weekday: "+post.after_week+" </p><p>Date: "+post.after_date+" </p> <p> Thanks & Regards, <br> Plankk</p>",
											"attachments": [{filename: post.image, path:  attachment}]
										},
										"5ababddaecc1ec1ffbd08c30": {// Bikni Boss
											"to": "theresa@bikinibossfitness.com, plankkprogresspics@gmail.com",
											"subject":"Theresa Before/After",
											"html": "Hi Theresa, <p>"+post.username+ "(" +email+ ") has shared a post with you.</p><p><b>Before Data: </b></p><p>Weight: "+post.before_weight+" </p><p>Weekday: "+post.before_week+" </p><p>Date: "+post.before_date+" </p> <br><p><b>After Data: </b></p><p>Weight: "+post.after_weight+" </p><p>Weekday: "+post.after_week+" </p><p>Date: "+post.after_date+" </p> <p> Thanks & Regards, <br> Plankk</p>",
											"attachments": [{filename: post.image, path:  attachment}]
										}
									}

									if(mailConfiguraion[trainer_id]) mailer.sendMail(mailConfiguraion[trainer_id]);

									sendSuccess(res, {message: "Mail is sent successfully"})
								}
						})
					})
				}
			})
		}else{
			sendError(res, "Image data is missing")
		}
	})


	var _updateUserChallengePlan = function(userID){
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				console.error("Error in updating user");
			}else{
				model_user.updateOne({_id: Model.ObjectID(userID)}, {$set: {"profile.if_challenge_joined": true}}, {}, function(err, dbres){ })
			}
		})
	}

	/**
		Send Push Notification if Trainer-User has completed Workout
	**/

	var  __sendPushToAllUsers = function(userInfo, callback){
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				callback("Failed to retrieve users: " + err);
			}else{
				var fields = {"device_token": 1}
				var conditions = { trainer_id: userInfo.trainer_id }
				model_user.find(conditions, fields).sort({
		    	'joined_on': -1
		        }).toArray(function(err, all_users) {
		            if (err) {
		            	callback("Failed to retrieve users: " + err);
		            } else {
		            	// Multiple destinations
		                const registrationIds = [];
		            	var message = userInfo.profile.name+ " has just completed a workout";
		                if (all_users && all_users.length) {
		                    all_users.forEach(function(user) {
		                    	if(user.device_token) registrationIds.push(user.device_token);

		                    });
		                    if( registrationIds && registrationIds.length ){
		                        const data = { type: 'workout_complete', message: message };
		                        data.badge = 1;
		                        Model.sendPush(["iOS", "Android"], registrationIds, message, data, posted_data.trainer_id);
		                        callback(undefined, "Push notifications has been sent successfully");

		                    }else{
		                        callback(undefined, "Can not send push as device tokens not found for users");
		                    }
		                }
		            }

		        });
			}
		})
	}

	/***
		@@user-community post API
		@@input user_id

	***/

	router.put('/post_picture_to_community', function(req, res, next){
		var post = req.body;
		var trainer_id = req.body.trainer_id || '597b8a331b54472074c2dd1a';
		var user_id = req.userinfo.user._id;
		if(user_id && post.user_id && user_id != post.user_id){
			return sendError(res, "Not authorized to insert this post");
		}
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
					sendError(res, "Failed to access db: "+err);
			}else{
				var model_post = Model.load('post', {}, function(err, model_post){
					if(err){
						sendError(res, "Failed to access db: "+err);
					}else{
						post.trainer_id = req.body.trainer_id || '597b8a331b54472074c2dd1a';
						post.type = post.type || "";
						post.status = post.status || "public";
						post.created_at = (new Date()).getTime();
						if(model_post.verify(post)) {

							var savePost = function() {
			                    model_post.insertOne(post, {}, function(err, dbres) {
			                        if (err) {
			                            sendError(res, "Failed to insert record: " + err);
			                        } else {
			                        	if( post.type.toLowerCase() == "challenge_plan" )_updateUserChallengePlan(post.user_id)
			                            sendSuccess(res, {res: dbres, community_post: post})
			                        }
			                    });
			                };

							if(req.files && req.files.length){

								var baseFolder = path.join(path.dirname(require.main.filename), "uploads/community/");

								Model.uploadFiles(req, baseFolder, post.user_id + "_", function(succeeded, failed, succeeded_images, succeeded_videos){
									if(!succeeded_images.length){
										sendError(res, "Failed to upload all file(s)");
									}else{
										post.image = succeeded_images.shift();
										var attachment = config.base_url+"uploads/community/"+post.image;
										if(trainer_id == "597b8a331b54472074c2dd1a"){
											var message = "A user has posted picture to Sugary Community";
											mailer.sendMail({to: "sugarysixpack@gmail.com", subject: "Sugary Community", html: message, attachments: [{filename: post.image, path:  attachment}]});
										}

										savePost();
									}
								});
							}else{
								post.image = "";
								post.workout_info = {};

								if( post.type.toLowerCase() == "workout" ){

									var fields = {
										"profile": 1, "trainer_id": 1, "email": 1, "is_trainer": 1
									};
									model_user.find({_id: Model.ObjectID(user_id)}, fields).limit(1).next(function(err, user){
										if(err){
											return sendError(res, "Something went wrong while fetch user profile: "+err);
										}
										var active_plan_key = user.profile.active_plan_key || false;
										if( post.type=="workout" && active_plan_key && user.profile['savedData_' + active_plan_key] && typeof user.profile['savedData_' + active_plan_key] !="undefined")
						                {
						            		var sorted_array = workout_history_array = [];
						            		var streak_count = current_streak_count = longest_streak_count = skipped_count = completed_workout = 0;
						            		var streak_count_yes = hstreak_count_yes = false;
						                	var today_date = new Date();
						                	var previous_date = new Date(today_date.getFullYear(), today_date.getMonth(), today_date.getDate(), 0,0,0,0)
						            		// Make an array of all dates available in Workout History
						                	if(typeof user.profile['workout_history_' + active_plan_key]!="undefined" && user.profile['workout_history_' + active_plan_key] && user.profile['workout_history_' + active_plan_key].length){
						                		var workout_history = JSON.parse(user.profile['workout_history_' + active_plan_key]);
						                		// // sort in descending order of workout history to count Completed Workout
						                		workout_history.sort(function(a,b) {
						                            return (new Date(a.date).getTime() < new Date(b.date).getTime()) ? 1 : ((new Date(b.dtea).getTime() < new Date(a.date).getTime()) ? -1 : 0);
						                        });
						                        //filter those dates <= currentdate
						                        workout_history = workout_history.filter(function(item){
						                            return new Date(item.date).getTime() <= today_date.getTime();
						                        });

						                    	(workout_history).forEach(function(wh){
						                            if(parseInt(wh.indexOfWorkout) == -1) workout_history_array.push(new Date(wh.date).getTime())
						                        });

						                        // calculate completed Workout
						                        (workout_history).forEach(function(wh){
						                            var hdate = new Date(wh.date)
								                    if(parseInt(wh.indexOfWorkout) == -1) {
								                    	completed_workout++
								                    	if(!streak_count && previous_date.getTime() == hdate.getTime()){
							                            	// check else if workout history
							                        		streak_count++//Increase streak_count
							                        		current_streak_count = streak_count;
							                            }else{
							                            	if(previous_date.getTime() - hdate.getTime() == 86400 * 1000){// sequential date
								                                streak_count++//Increase streak_count
								                                if(!hstreak_count_yes) {
								                        			current_streak_count = streak_count
								                        		}
								                            }
								                            else if(previous_date.getTime() - hdate.getTime() < 86400 * 1000){ //same date repettition
								                        		if(!hstreak_count_yes) {
								                        			current_streak_count = streak_count
								                        		}
							                                }else {
							                                	//non sequential date
								                        		// break streak
								                        		if(longest_streak_count < streak_count){
								                        			longest_streak_count = streak_count
								                        		}
								                        		if(!hstreak_count_yes) {
								                        			current_streak_count = streak_count
								                        			hstreak_count_yes = true
								                        		}
								                        		streak_count = 1
								                        	}
							                            }
							                            if(longest_streak_count < streak_count){
							                    			longest_streak_count = streak_count
							                    		}
								                    }
								                    previous_date = hdate
						                        });
						                    }
						                    var saved_user_data = JSON.parse(user.profile['savedData_' + active_plan_key]);

						                    if( saved_user_data.length ) {
							                    if( Array.isArray(saved_user_data[0])==false ){
							                        // for ANDROID users
							                        var date = new Date();
							                        var current_date = prev_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0,0);
							                        // Make an array of all dates available in Saved Data
							                        saved_user_data.forEach(function(item){
							                            sorted_array.push(item);
							                        });
							                        // sort them in descending order of date
							                        sorted_array.sort(function(a,b) {
							                            return (new Date(a.dateWithYear).getTime() < new Date(b.dateWithYear).getTime()) ? 1 : ((new Date(b.dateWithYear).getTime() < new Date(a.dateWithYear).getTime()) ? -1 : 0);
							                        });
							                        //filter those dates <= currentdate
							                        sorted_array = sorted_array.filter(function(item){
							                            return new Date(item.dateWithYear).getTime() <= current_date.getTime();
							                        });

							                        sorted_array.forEach(function(json){
							                        	var dateWithYear = new Date(json.dateWithYear);
							                            if(json.workoutComplete.toLowerCase() == 'yes'){
							                            	completed_workout++;
							                            	// check if previous date  is current date
							                                if(!streak_count && prev_date.getTime() == dateWithYear.getTime()){
							                                    streak_count++;
							                                    current_streak_count = streak_count;
							                                }
							                                else{// check if sequential date
							                                	if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
							                                        if(!streak_count_yes) {
							                                			current_streak_count = streak_count;
							                                		}
							                                    }
							                                    else if(prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000){
							                                        streak_count++;
							                                        if(!streak_count_yes) {
							                                			current_streak_count = streak_count;
							                                		}
							                                    }else{ //Non Sequntials date
							                                		if(longest_streak_count < streak_count){
							                                			longest_streak_count = streak_count;
							                                		}
							                                		if(!streak_count_yes) {
							                                			current_streak_count = streak_count;
							                                			streak_count_yes = true;
							                                		}
							                                		streak_count = 0;
							                                    }
							                                }
							                            }
							                            else if(json.workoutComplete.toLowerCase() == 'skipped'){
							                                skipped_count++;

							                                // check else if workout history
							                                if(workout_history_array.indexOf(dateWithYear.getTime()) >= 0 && (!streak_count || prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000)){
							                            		//streak_count++;
							                            		current_streak_count = streak_count;
							                            	}else if(prev_date.getTime() - dateWithYear.getTime() >= 86400 * 1000){
							                            		if(longest_streak_count < streak_count){
							                            			longest_streak_count = streak_count;
							                            		}
							                            		if(!streak_count_yes) {
							                            			current_streak_count = streak_count;
							                            			streak_count_yes = true;
							                            		}
							                            		streak_count = 0;

							                            	}
							                            }
							                            else if(json.workoutComplete.toLowerCase() == 'no'){
						                            		if(/rest/i.test(json.label)) { // check if rest comes in Workout Label String
							                            		if((prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000))  {
								                                	streak_count++;
									                            	current_streak_count = streak_count;
								                            	}
								                            	else if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
								                                	if(!streak_count_yes) {
							                                			current_streak_count = streak_count;
							                                			streak_count_yes = true;
							                                		}
								                                }
							                                }else{ //break streak
							                                	if(!hstreak_count_yes) { // If manual workout history not processed
								                            		if(longest_streak_count < streak_count){
							                                			longest_streak_count = streak_count;
							                                		}
							                                		if(!streak_count_yes) {
								                            			current_streak_count = streak_count;
								                            			streak_count_yes = true;
								                            		}
								                            		streak_count = 0;
							                            		}

							                            	}
							                            }
							                            if(longest_streak_count < streak_count){
							                    			longest_streak_count = streak_count;
							                    		}
							                            prev_date = dateWithYear;
							                        });

							                    }else{
							                     	// for IOS users
							                     	var date = new Date();
							                        var current_date = prev_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0,0);
							                        var json_array = JSON.parse(user.profile['savedData_' + active_plan_key]);
							                        json_array.forEach(function(json){

							                            json.forEach(function(item){
							                                sorted_array.push(item);
							                            });
							                        });
							                        // sort them in descending order of date
							                        sorted_array.sort(function(a,b) {
							                            return (new Date(a.dateWithYear).getTime() < new Date(b.dateWithYear).getTime()) ? 1 : ((new Date(b.dateWithYear).getTime() < new Date(a.dateWithYear).getTime()) ? -1 : 0);
							                        });
							                        //filter those date <= current date
							                        sorted_array = sorted_array.filter(function(item){
							                            return new Date(item.dateWithYear).getTime() <= current_date.getTime();
							                        });
							                        sorted_array.forEach(function(json, index){
							                        	var dateWithYear = new Date(json.dateWithYear);
							                            if(json.workoutComplete.toLowerCase() == 'yes'){
							                            	completed_workout++;
							                                // check if previous date  is current date
							                                if(!streak_count && prev_date.getTime() == dateWithYear.getTime()){
							                                    streak_count++;
							                                    current_streak_count = streak_count;
							                                }
							                                else{// check if sequential date
							                                	if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
							                                        if(!streak_count_yes) {
							                                			current_streak_count = streak_count;
							                                		}
							                                    }
							                                    else if(prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000){
							                                        streak_count++;
							                                        if(!streak_count_yes) {
							                                			current_streak_count = streak_count;
							                                		}
							                                    }else{ //Non Sequntials date
							                                		if(longest_streak_count < streak_count){
							                                			longest_streak_count = streak_count;
							                                		}
							                                		if(!streak_count_yes) {
							                                			current_streak_count = streak_count;
							                                			streak_count_yes = true;
							                                		}
							                                		streak_count = 0;
							                                    }
							                                }
							                            }
							                            else if(json.workoutComplete.toLowerCase() == 'skipped'){
							                                skipped_count++;

							                                // check else if workout history
							                                if(workout_history_array.indexOf(dateWithYear.getTime()) >= 0 && (!streak_count || prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000)){
							                            		//streak_count++;
							                            		current_streak_count = streak_count;
							                            	}else if(prev_date.getTime() - dateWithYear.getTime() >= 86400 * 1000){
							                            		if(longest_streak_count < streak_count){
							                            			longest_streak_count = streak_count;
							                            		}
							                            		if(!streak_count_yes) {
							                            			current_streak_count = streak_count;
							                            			streak_count_yes = true;
							                            		}
							                            		streak_count = 0;

							                            	}
							                            }
							                            else if(json.workoutComplete.toLowerCase() == 'no'){
						                            		if(/rest/i.test(json.label)) { // check if rest comes in Workout Label String
							                            		if( (prev_date.getTime() - dateWithYear.getTime() == 86400 * 1000))  {
								                                	streak_count++;
									                            	current_streak_count = streak_count;
								                            	}
								                            	else if(prev_date.getTime() - dateWithYear.getTime() < 86400 * 1000){
								                                	if(!streak_count_yes) {
							                                			current_streak_count = streak_count;
							                                			streak_count_yes = true;
							                                		}
								                                }
							                                }else{ //break streak
							                                	if(!hstreak_count_yes) { // If manual workout history not processed
								                            		if(longest_streak_count < streak_count){
							                                			longest_streak_count = streak_count;
							                                		}
							                                		if(!streak_count_yes) {
								                            			current_streak_count = streak_count;
								                            			streak_count_yes = true;
								                            		}
								                            		streak_count = 0;
							                            		}
							                            	}
							                            }
							                            if(longest_streak_count < streak_count){
							                    			longest_streak_count = streak_count;
							                    		}
							                            prev_date = dateWithYear;
							                        });
							                    }
							                    post.workout_info.longest_streak_count = longest_streak_count;
						                        post.workout_info.current_streak_count = current_streak_count;
						                        post.workout_info.skipped_workout = skipped_count;
						                        post.workout_info.completed_workout = completed_workout;
							                }

							                post.workout_info.latest_workout_summary = user.profile['latest_workout_summary_' + active_plan_key] || "";
						                }

										// Send Push to all users if Trainer user has completed workout
						                if(typeof user.is_trainer!="undefined" && user.is_trainer){
						                	// __sendPushToAllUsers(user, function(err, response){
							                // })
						                }
						                savePost();

									})
								} else{

									savePost();
								}

							}
						}else{
							sendError(res, "Invalid data for post");
						}
					}
				});
			}
		});
	});


	/***
		@@Get Community Feed API
		@@input user_id
		@@return All public post of Following Users
		@@with respect to login user id

	***/

	router.get('/get_community_feed', async function(req, res, next){
		var user_id = req.userinfo.user._id; //loggedin user token
		var trainer_id = req.query.trainer_id || ""; //trainer id in query string
		if(!trainer_id){
			return sendError(res, "Trainer id is missing, please try again with valid trainer id");
		}
		var model_user = Model.load('user', {}, async function(err, model_user){

			var model_post = Model.load('post', {}, async function(err, model_post){
				if(err){
					sendError(res, "Failed to access db: "+err);
				}else{
					var model_comment = Model.load('comment', {}, async function(err, model_comment){
						if(err){
							sendError(res, "Failed to access db: "+err);
						}else{
							var model_postlike = Model.load('postlike', {}, async function(err, model_postlike){
								if(err){
									sendError(res, "Failed to access db: "+err);
								}else{
									var conditions = { };
									// Get blocked users and reported posts for loggedin User
									getReportedPostsAndBlockedUsers(user_id, async function(err, reported_posts_blocked_users){
										if(err){ return sendError(res, "Fail to fetch user's repoted post or blocked lists"); }
										else {
											getPendingAndConfirmUsers(user_id, async function(err, results){
												if(err){
													return sendError(res, "Fail to fetch user's post");
												}
												else{
													var my_following = [], pending_following = [];
													if(results && results.length){

														results.forEach(function(fu){
															if(fu.status) my_following.push(fu.following)
															else pending_following.push(fu.following)
														})
													}
													var $total = $recordsFiltered = 0;
													var _loadUser = function(conds, callback){
														model_user.findOne(conds, {"profile.name": 1, "profile.image": 1, "profile.privacy_status": 1, "email": 1, "is_trainer": 1}, callback);
													};

													var  _loadCommunityPostCount = async function(conds, callback) {
											            model_post.find(conds)
											            	.count(callback)
											        };

											        var  _loadCommentCount = async function(conds, callback) {
											            model_comment.find(conds)
											            	.count(callback)
											        };

											        var  _loadPostLikesCount = async function(conds1, conds2, callback) {
											            model_postlike.find(conds1)
											            	.count(function(err, like_count){
											            		if(err) callback(err);
											            		else{
										            				model_postlike.find(conds2)
										            					.count(function(err, mylike_count){
										            						if(err) callback(err);
											            					else{
										            							callback(undefined, {likedbyme: mylike_count, like_count:like_count});
											            					}

									            					});
											            		}
											            	});
											        };

											        var _sendError = async function(err) {
											            if (err) {
											               return sendError(res, err);
											            }
											        };

											        var _loadRecentComments = async function(conds, callback){

														model_comment.find(conds).skip(0).limit(5).sort({'created_at': -1}).toArray(function(err, results){

															if(results && results.length) {
																var comment_count = 0;
																results.forEach(function(dbres, ind) {
																	var user_conds = { _id: dbres.user_id };
																	_loadUser(user_conds, function(err, user){
																		_sendError(err);
								                            			results[ind].user = user;
							                            				if(++comment_count >= results.length){
								                        					callback(undefined, results);
								                    					}

								                        			});
																});
															}else{
																callback(undefined, results);
															}
														})
													};

													var end = (new Date()).getTime()
											        var start = end - (24 * 2 * 60 * 60 * 1000)
													conditions = { "status" : "public", "$or": [ {"publishTo":"both" }, {"publishTo":"mycommunity"} ] }
													if(trainer_id) conditions.trainer_id = trainer_id

													// conditions for blocked users and reported posts
													if(reported_posts_blocked_users.reported_posts && reported_posts_blocked_users.reported_posts.length) conditions._id = { '$nin': reported_posts_blocked_users.reported_posts }

													if(reported_posts_blocked_users.blocked_users && reported_posts_blocked_users.blocked_users.length) conditions.user_id = { '$nin': reported_posts_blocked_users.blocked_users }

													_loadCommunityPostCount(conditions, async function(err, community_post_count){
														_sendError(err)
										        		$total = parseInt(community_post_count)
									                    $recordsFiltered = parseInt(community_post_count)
									                    var start = (req.query.draw - 1) * req.query.length
									                    var limit = parseInt(req.query.length)
									                    var draw = parseInt(req.query.draw)
														model_post.find(conditions).skip(start).limit(limit).sort({'created_at': -1}).toArray( async function(err, community_posts){
															if(err){
																return sendError(res, "Failed to retrieve posts: "+err);
															}else {
																var loadedUsers = 0
																var fields = {
																	"profile.name": 1, "profile.image": 1, "profile.privacy_status": 1, "email": 1, "is_trainer": 1
																}
																if(community_posts && community_posts.length){
																	community_posts.forEach(async function(community_post, ind) {
									                                    var userID = new Model.ObjectID(community_post.user_id),
									                                    	conditions2 = { post_id: community_post._id },
									                                    	conditions3 = { user_id: new Model.ObjectID(user_id), post_id: community_post._id }
								                                    	var user_data = await model_user.find({_id: userID}, fields).limit(1).next();
								                                        community_posts[ind].user = user_data
								                                        _loadCommentCount(conditions2, function(err, comment_count){
							                                				_sendError(err)
							                                				community_posts[ind].comment_count = comment_count
							                                				_loadRecentComments(conditions2, function(err, recent_comments){
								                                				_sendError(err)
								                                				community_posts[ind].recent_comments = recent_comments
								                                				_loadPostLikesCount(conditions2, conditions3, function(err, post_likes){
								                                					if(err) _sendError(err)
								                                					else{
								                                						community_posts[ind].post_likes = post_likes

										                                				if(++loadedUsers >= community_posts.length){

										                                					sendSuccess(res, {data: community_posts, community_post_count: $total, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total, following: my_following, pending_following: pending_following})
										                            					}
								                                					}
								                            					})
							                            					})
							                            				})
									                                })
								                                }else{
								                                	sendSuccess(res, {data: [], community_post_count: $total, draw: draw, recordsFiltered: $recordsFiltered, recordsTotal: $total, following: my_following, pending_following: pending_following})
								                                }

															}
														});
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
			})
		})
	})


	/**
    	@@ Script to fetch All Users
    	@@ Get Fifty records each time
    	@@ input trainer_id
    	@@
	**/

	router.get('/get_users', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var trainer_id = req.query.trainer_id || "";
		if(trainer_id){
			var model_user = Model.load('user', {}, function(err, model_user){
				if(err){
					sendError(res, "Failed to access db: "+err);
				}else{
					var $total = 0;
	        		var $recordsFiltered = 0;
					var conditions = {
						_id: { $nin: [ new Model.ObjectID(user_id) ] },
						// excluding wegile emails...
						//email: /^((?!wegile).)*$/i
					};
					if(req.query.search){
						conditions.$or = [{
                        	"profile.name": new RegExp('^' + req.query.search + '.*$', "i")
		                    }, {
		                        email: new RegExp('^' + req.query.search + '.*$', "i")
		                    }];
			        }

					if(trainer_id){
						conditions.trainer_id = trainer_id;
					}

					var fields = {
						"profile.name": 1, "profile.image": 1,"email": 1, "facebook_id": 1,
						"google_id": 1, "progress_pics": 1, "profile.paid": 1,
						"profile.subscribed_plan": 1, "profile.device_type": 1,
						"profile.startPlan_date": 1, "profile.endPlan_date": 1,
						"joined_on": 1, "profile.last_seen": 1,"profile.join_now": 1,
						"profile.privacy_status": 1, "is_trainer": 1
					};
					var  loadUserCount = function(callback) {
			            model_user.find(conditions)
			            	.count(callback)
			        };
			        model_user.count(conditions, {}, function(e, users_count){
			        	if(e){
			        		return sendError(res, "Failed to retrieve users: "+err);
			        	}
			        	$total = parseInt(users_count);
	                    $recordsFiltered = parseInt(users_count);
	                    // var start = (req.query.draw - 1) * (req.query.length);
	                    // var limit = parseInt(req.query.length);
	                    // var draw = parseInt(req.query.draw);

	                    model_user.find(conditions, fields).sort({'joined_on': -1}).toArray(function(err, all_users){
							if(err){
								sendError(res, "Failed to retrieve users: "+err);
							}else {
								getFollowingUsers(user_id, function(err, following){
									if(err){
										return sendError(res, "Fail to fetch following users");
									}
									else{
										getRequestedFollowingFollowersUserIds(user_id, function(error, pending_follower_following){
											if(error){
												return sendError(res, "Fail to fetch follower following users");
											}else{
												sendSuccess(res, {data: all_users, draw: 1, recordsTotal: $total, recordsFiltered: $recordsFiltered, following: following, pending_follower_following: pending_follower_following});
											}
										})
									}
								});
							}
						});

			    	});

				}
			});
		}else{
			sendError(res, "Trainer id is missing");
		}
	});

	/**
    	@@script to add Comments/Reply
    	@@ input user_id, post_id, created_at
    	@@input parent_id if reply is sent to a particular comment
	**/

	router.put('/comment', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var comment_data = req.body;
		comment_data.user_id = Model.ObjectID(user_id);
		comment_data.post_id = Model.ObjectID(comment_data.post_id);
		if(comment_data.parent_id) comment_data.parent_id = Model.ObjectID(comment_data.parent_id);
		var model_comment = Model.load('comment', {}, function(err, model_comment){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{
				if(model_comment.verify(comment_data)){
					comment_data.created_at = (new Date()).getTime();
					comment_data.updated_at = (new Date()).getTime();
					comment_data.status = true
					model_comment.insertOne(comment_data, {}, function(err, inserted_comment){
						if(err) {
							sendError(res, "Failed to insert record: "+err);
						}else{
							sendSuccess(res, {res: inserted_comment, post_comment: inserted_comment});
						}
					});
				}else{
					sendError(res, "Invalid data for post comment");
				}
			}
		});
	});

	/**
		@@ Get all comment w.r.t. Post id
		@@ input post_id
		@@ Fetch with pagination
	**/

	router.get('/comment/:post_id', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var post_id = req.params.post_id;
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{
				var model_comment = Model.load('comment', {}, function(err, model_comment){
					if(err){
						sendError(res, "Failed to access db: "+err);
					}else{
						var conditions = { post_id: Model.ObjectID(post_id), "parent_id": { $not: { "$exists": true } } };
						var fields = {
							"profile.name": 1, "profile.image": 1, "profile.privacy_status": 1, "email": 1,"is_trainer": 1
						};

						var _loadUser = function(conds, callback){

							model_user.findOne(conds, fields, callback);
						};

						var _sendError = function(err) {
				            if (err) {
				               return sendError(res, err);
				            }
				        };

						var _loadReplies = function(conds, callback){

							var _sendError = function(err) {
				                if (err) {
				                    callback(err);
				                }
				            };
							model_comment.find(conds).toArray(function(err, results){

								if(results && results.length) {
									var reply_count = 0;
									results.forEach(function(reply, ind) {
										var user_conds = { _id: reply.user_id };
										_loadUser(user_conds, function(err, user){
											_sendError(err);
	                            			results[ind].user = user;
                            				if(++reply_count >= results.length){
	                        					callback(undefined, results);
	                    					}

	                        			});
									});
								}else{
									callback(undefined, results);
								}
							})
						};

	                    model_comment.find(conditions).sort({'created_at': -1}).toArray(function(err, comments){
							if(err){
								sendError(res, err);
							}else{
								var loadedUsers = 0;
								if(comments && comments.length){
									var loadedReplies = 0;
	                            	comments.forEach(function(comment, ind) {
	                            		var conditions2 = { _id: comment.user_id };
	                            		var conditions3 = { parent_id : comment._id };
	                            		_loadUser(conditions2, function(err, user){
	                            			_sendError(err);
                            				comments[ind].user = user;
                                			_loadReplies(conditions3, function(err, replies){
                                				_sendError(err);
                                				comments[ind].replies = replies;
                                				if(++loadedReplies >= comments.length){

                                					sendSuccess(res, {comments: comments});
                            					}
                            				});

	                                    });
	                                });
	                            }else{
	                            	sendSuccess(res, {comments: comments});
	                            }
							}

						});
					}
				});
			}
		});
	});

	/**
    	@@script to Post Like/Unlike
    	@@ input user_id, post_id, created_at
    	@@ input like_status true for like and false for unlike
	**/

	router.put('/likePost', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var like_data = req.body;
		like_data.user_id = Model.ObjectID(user_id);
		like_data.post_id = Model.ObjectID(like_data.post_id);
		var like_status = like_data.like;
		var model_postlike = Model.load('postlike', {}, function(err, model_postlike){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{
				if(like_status){
					if(model_postlike.verify(like_data)){
						like_data.created_at = (new Date()).getTime();
						like_data.updated_at = (new Date()).getTime();
						like_data.like = true
						model_postlike.insertOne(like_data, {}, function(err, inserted_postlike){
							if(err) {
								sendError(res, "Failed to insert record: "+err);
							}else{
								sendSuccess(res, {res: inserted_postlike, post_like: inserted_postlike});
							}
						});
					}else{
						sendError(res, "Invalid data for post like");
					}
				}else{
					var conditions = {
						user_id: like_data.user_id,
						post_id: like_data.post_id
					};

					model_postlike.deleteOne(conditions, {}, function(err, deleted_postlike){
						if(err) {
							sendError(res, "Failed to retrieve record: "+err);
						}else{
							sendSuccess(res, {result: deleted_postlike});
						}
					});
				}
			}
		});
	});

	/**
    	@@ Delete User Post
    	@@ input post_id
	**/

	router.post('/delete_user_post', function(req, res, next) {
		var user_id = req.userinfo.user._id;
		var post_id = req.body.post_id;
		if(user_id){
			var model_post = Model.load('post', {}, function(err, model_post){
				if(err){
					sendError(res, "Failed to access db: "+err);
				}else{
					var model_comment = Model.load('comment', {}, function(err, model_comment){
						if(err){
							sendError(res, "Failed to access db");
						}else{
							var model_postlike = Model.load('postlike', {}, function(err, model_postlike){
								if(err){
									sendError(res, "Failed to access db: "+err);
								}else{
									var conditions = { _id: new Model.ObjectID(post_id), "user_id": user_id }
									var conditions2 = { post_id: new Model.ObjectID(post_id) }
									model_post.remove(conditions, {}, function(errors, dbres){
										if(errors) {
											sendError(res, "Failed to retrieve record: "+err);
										}else{
											model_postlike.remove(conditions2, {}, function(errors, deleted_post_likes){
												if(errors) {
													sendError(res, "Failed to retrieve record: "+err);
												}else{
													model_comment.remove(conditions2, {}, function(errors, deleted_comments){
														if(errors) {
															sendError(res, "Failed to retrieve record: "+err);
														}else{
															sendSuccess(res, {result: deleted_comments});
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
		}else{
			sendError(res, "user id is missing");
		}
	})

	/**
		@@ Report any post
		@@ Imput user_id, post_id
	**/

	router.post('/report_post', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var posted_data = req.body;
		posted_data.posted_by = Model.ObjectID(user_id);
		posted_data.post_id = Model.ObjectID(posted_data.post_id);
		var model_report_post = Model.load('report_post', {}, function(err, model_report_post){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{
				if(model_report_post.verify(posted_data)){
					var conditions2 = { posted_by: posted_data.posted_by, post_id: posted_data.post_id }
					model_report_post.find(conditions2).limit(1).next(function(err, reportedExists){
						if(reportedExists){
							return sendError(res, "You have reported this post already.");
						}
						else{
							posted_data.created_at = (new Date()).getTime();
							posted_data.updated_at = (new Date()).getTime();
							posted_data.status = true
							model_report_post.insertOne(posted_data, {}, function(err, inserted_report_post){
								if(err) {
									sendError(res, "Failed to insert record: "+err);
								}else{
									sendSuccess(res, {res: inserted_report_post, report_post: posted_data});
								}
							})
						}
					})
				}else{
					sendError(res, "Invalid data for reporting post");
				}
			}
		})
	})


	/**
		@@ Block User
		@@ input Blocker and blocked
	**/

	router.post('/block_user', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var posted_data = req.body;
		posted_data.blocker = Model.ObjectID(user_id);
		posted_data.blocked = Model.ObjectID(posted_data.blocked);
		posted_data.trainer_id = Model.ObjectID(posted_data.trainer_id);
		var model_block_user = Model.load('block_user', {}, function(err, model_block_user){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{
				if(model_block_user.verify(posted_data)){
					var conditions2 = { blocker: posted_data.blocker, blocked: posted_data.blocked }

					model_block_user.count(conditions2, {}, function(err, blockedExists){
						if(blockedExists){
							return sendError(res, "You have already blocked this user.");
						}else{
							posted_data.created_at = (new Date()).getTime();
							posted_data.updated_at = (new Date()).getTime();
							posted_data.status = true
							model_block_user.insertOne(posted_data, {}, function(err, blocked_user){
								if(err) {
									sendError(res, "Failed to insert record: "+err);
								}else{
									sendSuccess(res, {res: blocked_user, blocked_user: posted_data});
								}
							})
						}
					})
				}else{
					sendError(res, "Invalid data for reporting post");
				}
			}
		})
	})

	/**
		@@ send invitation for challenge
	**/

	router.post('/send_invitation_for_challenge', function(req, res, next){
		var user_id = req.userinfo.user._id;
		var posted_data = req.body;
		posted_data.user_id = Model.ObjectID(user_id);
		var receiverIds = posted_data.receiverIds || [];
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				sendError(res, "Failed to access db: "+err);
			}else{
				var my_receivers = [];
				if(receiverIds && receiverIds.length){
					receiverIds.forEach(function(rID){
						my_receivers.push(new Model.ObjectID(rID) );
					})
				}
				var subject = "Invititation for Challenge";
				var fields = {
                    "device_token": 1,
                };
                var _loadUser = function(callback) {
					model_user.findOne({_id: posted_data.user_id }, {"profile.name": 1, "profile.image": 1,"email": 1 }, callback);
				};

				var loadChallengePlan = function(callback) {
					var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
		                if (err) {
		                	callback("Failed to access db: " + err);
		                } else {
							var conds = { trainer_id: posted_data.trainer_id, type: "challenge", challenge: true };

		                    model_tp.find(conds).sort({"modified_date": -1}).limit(1).next(function(err, dbres) {
		                        if (err) {
		                           callback("Failed to retrieve trainer plan: " + err);
		                        } else if (!dbres) {
		                        	callback("No Challenge Plan found");
		                        } else {
		                        	callback(undefined, dbres);
		                    	}
		                	});
	                	}
                	});
				};

				var conditions = {};

                conditions._id = {
                    "$in": my_receivers
                };
                _loadUser(function(err, result){
                	if(err){
                		return sendError(res, "Error found when fetching user's info "+ err);
                	}
                	if(result){
                		loadChallengePlan(function(err, plan_info){
                			if(err){
                				sendError(res, err);
                			}else{
                				model_user.find(conditions, fields).sort({
			                	'joined_on': -1
				                }).toArray(function(err, all_users) {
				                    if (err) {
				                    	sendError(res, "Failed to retrieve users: " + err);
				                    } else {
				                    	// Multiple destinations
			                            const registrationIds = [];
				                    	var message = result.profile.name+ " has just invited you for a Workout Challenge";
				                        if (all_users && all_users.length) {
				                            all_users.forEach(function(user) {
				                            	if(user.device_token) registrationIds.push(user.device_token);
				                                // mailer.sendMail({
				                                //     to: user.email,
				                                //     subject: subject,
				                                //     html: message
				                                // });

				                            });
				                            if( registrationIds && registrationIds.length ){
			                                    const data = { type: 'new_challenge', message: message, challenge_plan_info: plan_info };
			                                    data.badge = 1;
			                                    Model.sendPush(["iOS", "Android"], registrationIds, "New push notification for Pop-Up Challenge", data, posted_data.trainer_id);
			                                    sendSuccess(res, {message: "Invititation has been sent successfully"});

			                                }else{
			                                    sendSuccess(res, "Can not send push as device tokens not found for users");
			                                }
				                        }
				                    }

				                });
                			}

                		});

                	}else{
            			sendError(res, "User doesn't exists in our database");
                	}

                });
			}
		});
	});

	/**
        @@ Get All Plans Key
        @@ Web API
    **/

    router.get('/custom_plan', function(req, res, next) {
        var trainer_id = req.query.trainer_id;
        var user_id = req.userinfo.user._id;
        var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
            	var conditions = { type: "custom", trainer_id: trainer_id, user_id: Model.ObjectID(user_id) }

                model_tp.find(conditions).toArray(function(err, customplans) {
                    if (err) {
                        sendError(res, "Failed to retrieve custom plans: " + err);
                    } else {
                        /****** End Code Here*****/
                        sendSuccess(res, {
                            customplans: customplans
                        });
                    }
                })
            }
        })
    })

    // Get Custom Plan Data
    // input user token,
    // trainer_id in Query

    router.get('/customplan/:id', function(req, res, next) {
        var trainer_id = req.query.trainer_id;
        var id = req.params.id;
        var app_version = req.query.app_version || 0;
        var webapp = req.query.webapp || 0;
        var without_workout = req.query.without_workout || false;
        var user_id = req.userinfo.user._id;

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
                        sendError(res, "Failed to retrieve user custom plan: " + err);
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
                                })
                            }
                        })

                    }
                })
            }
        })
    })

	/**
		@@ Get All Workout Notes
		@@ Input workout_id and user_id
	**/

	router.get('/exercise_notes/:id', function(req, res, next) {
        var workout_id = req.params.id;
        var user_id = req.userinfo.user._id;
        var trainer_id = req.query.trainer_id;
        var model_workout_notes = Model.load('workoutnotes', {}, function(err, model_workout_notes) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                model_workout_notes.find({workout_id: workout_id, user_id: user_id, trainer_id: trainer_id}).toArray(function(err, workout_notes) {
                    if (err) {
                        sendError(res, "Failed to retrieve exercise notes: " + err);
                    } else {
                        sendSuccess(res, {
                            workout_notes: workout_notes
                        })
                    }
                })
            }
        })
    })

    /**
    	@@ Add Exercise Notes
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
                	posted_data['read_status'] = 'n';
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
		@@ Get Workoutday Notes
		@@ Input workoutday_id, user_id
	**/

	router.get('/workoutday_notes/:id', function(req, res, next) {
        var workout_id = req.params.id;
        var user_id = req.userinfo.user._id;
        var trainer_id = req.query.trainer_id;
        var model_workoutday_notes = Model.load('workoutdaynotes', {}, function(err, model_workoutday_notes) {
            if (err) {
                sendError(res, "Failed to access db: " + err);
            } else {
                model_workoutday_notes.find({workoutday_id: workout_id, user_id: user_id, trainer_id: trainer_id}).toArray(function(err, workoutday_notes) {
                    if (err) {
                        sendError(res, "Failed to retrieve workoutday notes: " + err);
                    } else {
                        sendSuccess(res, {
                            workoutday_notes: workoutday_notes
                        })
                    }
                })
            }
        })
    })

	/**
    	@@ Add Workoutday Notes
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
		@@ Add User Exercise Weight
		@@ Weight Tracking Logs

	**/

	router.post('/exercise_weight', function(req, res, next) {
        var posted_data = req.body;
        if (
            typeof(posted_data.workout_id)==='undefined' ||
            typeof(posted_data.changed_by)==='undefined' ||
            typeof(posted_data.user_weight)==='undefined'

        ) {
            sendError(res, "Invalid parameters");
        } else if (
            posted_data.workout_id === '' ||
            posted_data.changed_by === '' ||
            posted_data.user_weight === ''

        ) {
            sendError(res, "Empty parameters \n खाली पैरामीटर");
        }else{
            var model_workout = Model.load('workout', {}, function(err, model_workout) {
                if (err) {
                    sendError(res, "Failed to access db: " + err);
                } else {
                    posted_data['changed_on'] = (new Date()).getTime();

                    model_workout.update({"_id": Model.ObjectID(posted_data.workout_id)}, { $set: { "user_weight": posted_data.user_weight }, "$push": {
				     	"user_weight_tracking": {
			         		"_id": new Model.ObjectID(), "user_weight": posted_data.user_weight, "changed_by": posted_data.changed_by, "changed_on": posted_data['changed_on'], "read_status": "n"
				     	}
					  } }, { }, function(err, doc) {

					    if (err) sendError(res, "Failed to update record: " + err);
					    else
					    	model_workout.findOne({
		                        "_id": Model.ObjectID(posted_data.workout_id)
		                    }, {}, function(err, workout_detail) {

		                    if(err) sendError(res, "Failed to find record: " + err);
		                    else
		                    	sendSuccess(res, {
	                            workout_detail: workout_detail
	                        })
                 		})
					  }
					)
                }
            })
        }
    })

	/**
		@@ Add User Exercise Reps
		@@ Reps Tracking Logs

	**/

	router.post('/exercise_reps', function(req, res, next) {
        var posted_data = req.body;
        if (
            typeof(posted_data.workout_id)==='undefined' ||
            typeof(posted_data.changed_by)==='undefined' ||
            typeof(posted_data.user_repeat)==='undefined'

        ) {
            sendError(res, "Invalid parameters");
        } else if (
            posted_data.workout_id === '' ||
            posted_data.changed_by === '' ||
            posted_data.user_repeat === ''

        ) {
            sendError(res, "Empty parameters \n खाली पैरामीटर");
        }else{
            var model_workout = Model.load('workout', {}, function(err, model_workout) {
                if (err) {
                    sendError(res, "Failed to access db: " + err);
                } else {
                    posted_data['changed_on'] = (new Date()).getTime();

                    model_workout.update({"_id": Model.ObjectID(posted_data.workout_id)}, { $set: { "user_repeat": posted_data.user_repeat }, "$push": {
				     	"user_reps_tracking": {
			         		"_id": new Model.ObjectID(), "user_repeat": posted_data.user_repeat, "changed_by": posted_data.changed_by, "changed_on": posted_data['changed_on'], "read_status": "n"
				     	}
					  } }, { }, function(err, doc) {

					    if (err) sendError(res, "Failed to update record: " + err);
					    else
					    	model_workout.findOne({
		                        "_id": Model.ObjectID(posted_data.workout_id)
		                    }, {}, function(err, workout_detail) {

		                    if(err) sendError(res, "Failed to find record: " + err);
		                    else
		                    	sendSuccess(res, {
	                            workout_detail: workout_detail
	                        })
                 		})
					  }
					)
                }
            })
        }
    })

	/**
        @@ Onboarding Questions Module
        @@ Get API to get All Questions
    **/

    router.get('/questions', function(req, res, next) {
    	var trainer_id = req.query.trainer_id || false;
    	var user_id = req.userinfo.user._id || false;
    	if(trainer_id && user_id) {
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
												                            questions: dbres
												                        })
										                            }
					                                    		})
				                                    		}else{
				                                    			questionTagDone++;
				                                    			dbres[ind].question_tag = "";
				                                    			if((failed_user_answer.length + succeeded_user_answer.length) >= dbres.length &&  questionTagDone == dbres.length ){
									                                sendSuccess(res, {
											                            questions: dbres
											                        })
									                            }
				                                    		}
					                    				}

				                    				})
					                    		})
					                    	}else{
					                    		sendSuccess(res, {
						                            questions: dbres
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
    	}else{
    		sendError(res, "Trainer id is missing.")
    	}

    })

	/**
		@@ Save User Question Answer
		@@ input user_id, question_id,user_answer
	**/

	router.post('/save_question_answer', function(req, res, next) {
        var posted_data = req.body;

        if (
            typeof(posted_data.user_id)==='undefined' ||
            typeof(posted_data.question_id)==='undefined' ||
            typeof(posted_data.user_answer)==='undefined'

        ) {
            sendError(res, "Invalid parameters");
        } else if (
            posted_data.user_id === '' ||
            posted_data.question_id === '' ||
            posted_data.user_answer === ''

        ) {
            sendError(res, "Empty parameters \n खाली पैरामीटर");
        }else{

	        var model_user_question_answer = Model.load('user_question_answer', {}, function(err, model_user_question_answer) {
	            if (err) {
	                sendError(res, "Failed to access db: " + err);
	            } else {

	                var saveQuestionAnswer = function() {
	                    model_user_question_answer.insertOne(posted_data, {}, function(err, dbres) {
	                        if (err) {
	                            sendError(res, "Failed to insert record: " + err);
	                        } else {
	                            sendSuccess(res, {
	                                res: dbres,
	                                result: posted_data,
	                            })
	                        }
	                    })
	                }

	                if (model_user_question_answer.verify(posted_data)) {

	                	posted_data.user_id = Model.ObjectID(posted_data.user_id);
	                	posted_data.question_id = Model.ObjectID(posted_data.question_id);

	                    posted_data.created_at = (new Date()).getTime();
	                    posted_data.updated_at = (new Date()).getTime();

	                    saveQuestionAnswer();

	                } else {
	                    sendError(res, "Invalid data for question answer");
	                }
	            }
	        })
		}
    })


	/**
		@@ GET Recommended Plans
		@@ According to Onboarding Questions Answer
	**/

	router.get("/recommended_plans", function(req, res, next){
		var user_id = req.userinfo.user._id;
		var trainer_id = req.query.trainer_id || false;
		if(!trainer_id){
			return sendError(res, "Trainer id is missing")
		}
		var model_user = Model.load('user', {}, function(err, model_user){
			if(err){
				return sendError(res, "Failed to access db: "+err);
			}

			model_user.find({_id: Model.ObjectID(user_id)}).limit(1).next(function(err, user){
				if(err){
					return sendError(res, "Something went wrong while fetch user profile: "+err);
				}
				if(!user){
					return sendError(res, "Something went wrong, there is no such user!");
				}
				var model_tp = Model.load("trainerplan", {}, function(err, model_tp) {
		            if (err) {
		                sendError(res, "Failed to access db: " + err);
		            } else {
		                var conds = {};
		                if (trainer_id) {
		                    conds.trainer_id = trainer_id;
		                }
		                conds.$or = [{"type":"main"}, {"type":"side"}, {"type":"challenge"}];

		                model_tp.find(conds).toArray(function(err, trainerplans) {
		                    if (err) {
		                        sendError(res, "Failed to retrieve trainer plans: " + err);
		                    } else {
		                        /**
		                            @@ Extra Check for ZBODY Trainer
		                            @@ Order Plans according to On-Boarding Question Answers
		                        **/
		                        let valueToHave = [];
		                        var sort_arr = [];
		                        if( user.profile.time && user.profile.time == "30"){

									valueToHave = [ "5d0933a956dc011a1b637241", "5b732c1cba58ac72321805d6", "5dea9dd69791377ef513132c" ];
									sort_arr = ["5d0933a956dc011a1b637241", "5b732c1cba58ac72321805d6", "5dea9dd69791377ef513132c"];
								}
		                        else if( user.profile.locale && user.profile.locale.toLowerCase()=="home" && user.profile.days && user.profile.days =="3-4" && user.profile.time!="30"){

									valueToHave = [ "5d5477a02248df1fd78f250d", "5c80541384359b0ef52b1db0", "5d0933a956dc011a1b637241" ];
									sort_arr = ["5d5477a02248df1fd78f250d", "5c80541384359b0ef52b1db0", "5d0933a956dc011a1b637241"];
								}
		                        else if( user.profile.locale && user.profile.locale.toLowerCase()=="gym" && user.profile.days && user.profile.days =="3-4" && user.profile.time!="30"){

									valueToHave = [ "5d5477a02248df1fd78f250d", "5a849144c3b5c3530a8d05f4", "5d0933a956dc011a1b637241"];
									sort_arr = ["5d5477a02248df1fd78f250d", "5a849144c3b5c3530a8d05f4", "5d0933a956dc011a1b637241"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="either" && user.profile.days && user.profile.days =="3-4" && user.profile.time!="30"){

									valueToHave = [ "5d5477a02248df1fd78f250d", "5c3bdc68bdd5df6be15b8680", "5a849134c3b5c3530a8d05f3" ];
									sort_arr = ["5d5477a02248df1fd78f250d", "5c3bdc68bdd5df6be15b8680", "5a849134c3b5c3530a8d05f3"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="home" && user.profile.experience =="Beginner"  && user.profile.goal =="Full Body" && user.profile.time!="30" ){

									valueToHave = [ "5c80541384359b0ef52b1db0", "5a849134c3b5c3530a8d05f3", "5d0933a956dc011a1b637241" ];
									sort_arr = ["5c80541384359b0ef52b1db0", "5a849134c3b5c3530a8d05f3", "5d0933a956dc011a1b637241"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="home" && user.profile.experience =="Beginner"  && user.profile.goal =="Booty" && user.profile.time!="30" ){

									valueToHave = [ "5d5477a02248df1fd78f250d", "5e877bde9791377ef513b514", "5c80541384359b0ef52b1db0", "5d0933a956dc011a1b637241" ];
									sort_arr = ["5d5477a02248df1fd78f250d", "5e877bde9791377ef513b514", "5c80541384359b0ef52b1db0", "5d0933a956dc011a1b637241"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="home" && user.profile.experience =="Advanced"  && user.profile.goal =="Full Body" && user.profile.time!="30"){

									valueToHave = [ "5a849134c3b5c3530a8d05f3", "5d5477a02248df1fd78f250d", "5b732c1cba58ac72321805d6" ];
									sort_arr = ["5a849134c3b5c3530a8d05f3", "5d5477a02248df1fd78f250d", "5b732c1cba58ac72321805d6"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="home" && user.profile.experience =="Advanced"  && user.profile.goal =="Booty" && user.profile.time!="30"){

									valueToHave = [ "5d5477a02248df1fd78f250d", "5e877bde9791377ef513b514", "5a849134c3b5c3530a8d05f3", "5b732c1cba58ac72321805d6" ];
									sort_arr = ["5d5477a02248df1fd78f250d", "5e877bde9791377ef513b514", "5a849134c3b5c3530a8d05f3", "5b732c1cba58ac72321805d6"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="gym" && user.profile.experience =="Beginner"  && user.profile.goal =="Full Body" && user.profile.time!="30"){

									valueToHave = [ "5a849144c3b5c3530a8d05f4", "5b732c1cba58ac72321805d6", "5d0933a956dc011a1b637241" ];
									sort_arr = ["5a849144c3b5c3530a8d05f4", "5b732c1cba58ac72321805d6", "5d0933a956dc011a1b637241"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="gym" && user.profile.experience =="Beginner"  && user.profile.goal =="Booty" && user.profile.time!="30"){

									valueToHave = [ "5d5477a02248df1fd78f250d", "5a849144c3b5c3530a8d05f4", "5d0933a956dc011a1b637241" ];
									sort_arr = ["5d5477a02248df1fd78f250d", "5a849144c3b5c3530a8d05f4", "5d0933a956dc011a1b637241"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="gym" && user.profile.experience =="Advanced"  && user.profile.goal =="Full Body" && user.profile.time!="30"){

									valueToHave = [ "5c3bdc68bdd5df6be15b8680", "5a849144c3b5c3530a8d05f4", "5b732c1cba58ac72321805d6" ];
									sort_arr = ["5c3bdc68bdd5df6be15b8680", "5a849144c3b5c3530a8d05f4", "5b732c1cba58ac72321805d6"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="gym" && user.profile.experience =="Advanced"  && user.profile.goal =="Booty" && user.profile.time!="30"){

									valueToHave = [ "5d5477a02248df1fd78f250d", "5c3bdc68bdd5df6be15b8680", "5b732c1cba58ac72321805d6" ];
									sort_arr = ["5d5477a02248df1fd78f250d", "5c3bdc68bdd5df6be15b8680", "5b732c1cba58ac72321805d6"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="either" && user.profile.experience =="Beginner"  && user.profile.goal =="Full Body" && user.profile.time!="30"){

									valueToHave = [ "5c80541384359b0ef52b1db0", "5a849144c3b5c3530a8d05f4", "5d0933a956dc011a1b637241" ];
									sort_arr = ["5c80541384359b0ef52b1db0", "5a849144c3b5c3530a8d05f4", "5d0933a956dc011a1b637241"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="either" && user.profile.experience =="Beginner"  && user.profile.goal =="Booty" && user.profile.time!="30"){

									valueToHave = [ "5d5477a02248df1fd78f250d", "5a849144c3b5c3530a8d05f4", "5a849134c3b5c3530a8d05f3" ];
									sort_arr = ["5d5477a02248df1fd78f250d", "5a849144c3b5c3530a8d05f4", "5a849134c3b5c3530a8d05f3"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="either" && user.profile.experience =="Advanced"  && user.profile.goal =="Full Body" && user.profile.time!="30"){

									valueToHave = [ "5c3bdc68bdd5df6be15b8680", "5a849134c3b5c3530a8d05f3", "5d0933a956dc011a1b637241" ];
									sort_arr = ["5c3bdc68bdd5df6be15b8680", "5a849134c3b5c3530a8d05f3", "5d0933a956dc011a1b637241"];
								}
								else if( user.profile.locale && user.profile.locale.toLowerCase()=="either" && user.profile.experience =="Advanced"  && user.profile.goal =="Booty" && user.profile.time!="30"){

									valueToHave = [ "5d5477a02248df1fd78f250d", "5c3bdc68bdd5df6be15b8680", "5a849144c3b5c3530a8d05f4" ];
									sort_arr = ["5d5477a02248df1fd78f250d", "5c3bdc68bdd5df6be15b8680", "5a849144c3b5c3530a8d05f4"];
								}
		                        if(sort_arr) {
		                            trainerplans.sort(function(a,b){
		                                var ia = sort_arr.indexOf(a._id.toString());
		                                var ib = sort_arr.indexOf(b._id.toString());
		                                return ia > ib? 1 : (ia<ib ? -1 : 0);
		                            });
		                        }

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
		})
	})


	/**
		@@ Save User Rating
		@@ input user_id, trainer_id, rating
	**/

	router.post('/save_rating', function(req, res, next) {
        var posted_data = req.body;
        
        if (
            typeof(posted_data.user_id)==='undefined' || 
            typeof(posted_data.trainer_id)==='undefined' || 
            typeof(posted_data.rating)==='undefined'

        ) {
            sendError(res, "Invalid parameters");
        } else if (
            posted_data.user_id === '' || 
            posted_data.trainer_id === '' ||
            posted_data.rating === ''

        ) {
            sendError(res, "Empty parameters \n खाली पैरामीटर");
        }else{

	        var model_rating = Model.load('rating', {}, function(err, model_rating) {
	            if (err) {
	                sendError(res, "Failed to access db: " + err);
	            } else {
	                
	                var saveRating = function() {
	                    model_rating.insertOne(posted_data, {}, function(err, dbres) {
	                        if (err) {
	                            sendError(res, "Failed to insert record: " + err);
	                        } else {
	                            sendSuccess(res, {
	                                res: dbres,
	                                result: posted_data,
	                            })
	                        }
	                    })
	                }
	                
	                if (model_rating.verify(posted_data)) {

	                	posted_data.user_id = Model.ObjectID(posted_data.user_id);
	                	posted_data.trainer_id = Model.ObjectID(posted_data.trainer_id);

	                    posted_data.created_at = (new Date()).getTime();
	                    posted_data.updated_at = (new Date()).getTime();

	                    saveRating();

	                } else {
	                    sendError(res, "Invalid data for app rating");
	                }
	            }
	        })
		}
    })
	
	/**
		@@ GET User APP Rating
		@@ input user_id, trainer_id
	**/

	router.post('/get_rating', function(req, res, next) {
    	var posted_data = req.body;
    	var model_rating = Model.load('rating', {}, function(err, model_rating) {
	        if (err) {
	            sendError(res, "Failed to access db: " + err);
	        } else {
	        	model_rating.findOne({
	                "trainer_id": Model.ObjectID(posted_data.trainer_id),
	                "user_id": Model.ObjectID(posted_data.user_id),

	            }, { }, function(err, dbres) {

	            if(err) sendError(res, "Failed to find record: " + err);
	            else {
	            		if(!dbres){
	            			sendSuccess(res, {
	                            message: "No rating given",
	                            rating_given: false,
	                        })
		            	}else{
		            		sendSuccess(res, {
	                            message: "You have already posted rating to this APP",
	                            rating_given: true,
	                        })
		            	}
	            	}
	            })
	    	}
    	})

    });


    /**
        @@ ScheduledCheckIns Modules
        @@ Add/Edit/Delete ScheduledCheckIn

    **/

   router.get('/scheduledCheckIn', function (req, res, next) {
    var model_scheduledCheckIn = Model.load('scheduledCheckIn', {}, function (err, model_scheduledCheckIn) {
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

        model_scheduledCheckIn.find(conds).sort({
          'created_at': -1
        }).toArray(function (err, dbres) {
          if (err) {
            sendError(res, "Failed to retrieve scheduledCheckIns: " + err);
          } else {
            sendSuccess(res, {
              scheduledCheckIns: dbres
            });
          }
        });
      }
    });
  });

  router.get('/scheduledCheckIn/:id', function (req, res, next) {
    var id = req.params.id;
    var model_scheduledCheckIn = Model.load('scheduledCheckIn', {}, function (err, model_scheduledCheckIn) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };
        model_scheduledCheckIn.find(conds).limit(1).next(function (err, dbres) {
          if (err) {
            sendError(res, err);
          } else if (!dbres) {
            sendError(res, "Not found");
          } else {
            sendSuccess(res, {
              scheduledCheckIn: dbres
            });
          }
        });
      }
    });
  });

  router.post('/scheduledCheckIn/:id', function (req, res, next) {
    var posted_data = req.body.scheduledCheckIn;
    var id = req.params.id;
    var replace = req.body.replace || false;

    var model_scheduledCheckIn = Model.load('scheduledCheckIn', {}, function (err, model_scheduledCheckIn) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {

        var conditions = {
          _id: new Model.ObjectID(id)
        };
        model_scheduledCheckIn.find(conditions).limit(1).next(function (err, result) {
          if (err) {
            sendError(res, err);
          } else if (!result) {
            sendError(res, "Not found");
          } else {
            if (!replace) {
              _.defaults(posted_data, result);
              delete posted_data._id;
            }

            if (model_scheduledCheckIn.verify(posted_data)) {

              if (replace) {
                model_scheduledCheckIn.replaceOne(conditions, posted_data, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to replace record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      scheduledCheckIn: posted_data
                    });
                  }
                });
              } else {
                model_scheduledCheckIn.updateOne(conditions, {
                  $set: posted_data
                }, {}, function (err, dbres) {
                  if (err) {
                    sendError(res, "Failed to update record: " + err);
                  } else {
                    sendSuccess(res, {
                      res: dbres,
                      scheduledCheckIn: posted_data
                    });
                  }
                });
              }
            } else {
              sendError(res, "Invalid data for scheduledCheckIn");
            }
          }
        });
      }
    });
  });

  router.put('/scheduledCheckIn', function (req, res, next) {
    var posted_data = req.body.scheduledCheckIn;

    var model_scheduledCheckIn = Model.load('scheduledCheckIn', {}, function (err, model_scheduledCheckIn) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        if (model_scheduledCheckIn.verify(posted_data)) {

          model_scheduledCheckIn.insertOne(posted_data, {}, function (err, dbres) {
            if (err) {
              sendError(res, "Failed to insert record: " + err);
            } else {
              sendSuccess(res, {
                res: dbres,
                scheduledCheckIn: posted_data
              });
            }
          });
        } else {
          sendError(res, "Invalid data for video category");
        }
      }
    });
  });

  router.delete('/scheduledCheckIn/:id', function (req, res, next) {
    var id = req.params.id;
    var model_scheduledCheckIn = Model.load('scheduledCheckIn', {}, function (err, model_scheduledCheckIn) {
      if (err) {
        sendError(res, "Failed to access db: " + err);
      } else {
        var conds = {
          _id: new Model.ObjectID(id)
        };

        model_scheduledCheckIn.deleteOne(conds, {}, function (err, response) {
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


/*

var count=0;
var ucount=0;
db.users.find().forEach(function(u){

	var img_prefix = u.user.replace(/[^a-zA-Z0-9]/g, '_');

	if(u.progress_pics){
		var found = false;
		for(var k in u.progress_pics){
			if(u.progress_pics[k].indexOf(img_prefix) < 0) {
				count++;
				print("Trainer: "+u.trainer_id+"Email: "+u.email+", User: "+u.user+", Prefix: "+img_prefix+", Image: "+ u.progress_pics[k]);
				db.deletedPics.insert({
					trainer_id: u.trainer_id,
					email: u.email,
					facebook_id: u.facebook_id,
					google_id: u.google_id,
					user: u.user,
					img_prefix: img_prefix,
					removed_pic: u.progress_pics[k]
				});
				delete u.progress_pics[k];
				found = true;
			}
		}

		if(found) ucount++;

		db.users.save(u);
	}

});

*/