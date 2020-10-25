(function(){
	var nodemailer = require("nodemailer");
	var _ = require("lodash");

	// var transporter = nodemailer.createTransport("smtps://support%40fitandthickapp.com:F1tness!@smtp.gmail.com");
	var transporter = nodemailer.createTransport("smtps://AKIAJO4DY54OY2FBQGFA:AvUMHMj4SZZPFZqbK6kY8DpFwXijj4cY7H6KvHxDHIM9@email-smtp.us-east-1.amazonaws.com");
	

	var defaultMailOptions = {
		from: "support@plankk.com",
		to: "support@plankk.com"
	};

	module.exports.sendMail = function(mailOptions, callback){
		if(typeof callback == 'undefined'){
			callback = function(err, info){
				if(err){
					console.error("Mail sending failed: "+err);
				}else{
					console.log("Mail sent: "+info.response);
				}
			};
		}
		_.defaults(mailOptions, defaultMailOptions);
		transporter.sendMail(mailOptions, callback);
	};
})();