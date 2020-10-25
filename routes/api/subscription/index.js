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

    /**
        @@ Update Subscription Status
        @@ IN APP Purchase
    **/

    router.post('/updateStatus', function(req, res, next) {
       
        var json_data = req.body;

        var model_user = Model.load('user', {}, function(err, model_user){
            if(err){
                return sendError(res, "Failed to access db: "+err);
            }
            
            var notification_type = json_data.notification_type // INITIAL_BUY, RENEWAL
            
            if(notification_type == "RENEWAL" || notification_type == "DID_CHANGE_RENEWAL_STATUS" ||  notification_type == "DID_CHANGE_RENEWAL_PREF" || notification_type == "INTERACTIVE_RENEWAL" ){
                var latest_receipt;
                if(json_data.latest_receipt_info) {
                    var purchase_date = json_data.latest_receipt_info.purchase_date
                    purchase_date = purchase_date.substr(0, 10);
                    var expires_date = json_data.latest_receipt_info.expires_date_formatted; // '2019-08-09 05:24:08 Etc/GMT'
                    var product_id = json_data.auto_renew_product_id; // 'com.colin.FitwithWhit.monthly'
                    var original_transaction_id = json_data.latest_receipt_info.original_transaction_id;
                    latest_receipt = json_data.latest_receipt;
                }else{
                    var purchase_date = json_data.latest_expired_receipt_info.purchase_date
                    purchase_date = purchase_date.substr(0, 10);
                    var expires_date = json_data.latest_expired_receipt_info.expires_date_formatted; // '2019-08-09 05:24:08 Etc/GMT'
                    var product_id = json_data.auto_renew_product_id; // 'com.colin.FitwithWhit.monthly'
                    var original_transaction_id = json_data.latest_expired_receipt_info.original_transaction_id;
                    latest_receipt = json_data.latest_expired_receipt;

                }

                model_user.find({"profile.original_transaction_id": original_transaction_id}).limit(1).next(function(err, user){
                    if(err){
                        console.error("Failed to fetch user transactions")
                        return sendError(res, "Failed to fetch user transactions: "+err);
                    }
                    if(!user){
                        console.error("User doesn't exist in our record");
                        return sendError(res, "Something went wrong! User does not exists in db!");
                    }
                    var paid = 0;
                    if(json_data.auto_renew_status == 'true' || json_data.auto_renew_status == '1') paid = 2 ;

                    if(json_data.auto_renew_status_change_date) {
                        var sExpiration;
                        if(json_data.latest_receipt_info) {
                            sExpiration = new Date(parseInt(json_data.latest_receipt_info.expires_date));
                        }else{
                            sExpiration = new Date(parseInt(json_data.latest_expired_receipt_info.expires_date));
                        }
                        var auto_renew_status_change_date_ms = new Date(parseInt(json_data.auto_renew_status_change_date_ms));
                        if( sExpiration > auto_renew_status_change_date_ms) { paid = 2; }
                    }

                    var updated_data = { "profile.subscription_plan_name": product_id, "profile.expire_date": expires_date, "profile.startPlan_date": purchase_date, "profile.paid": paid, "profile.payment_receipt": latest_receipt, "profile.s2s_notification": true }
                    model_user.updateOne({"profile.original_transaction_id": original_transaction_id}, {$set: updated_data }, {}, function(err, doc){
                        if(err){
                            return sendError(res, "Failed to update user s2s in-app purchase update status");
                        }
                        console.log("S2S In-APP Purchase updated successfully");
                        sendSuccess(res, {message: "S2S In-APP Purchase updated successfully", response: doc});
                    });

                })
            } else if(notification_type == "CANCEL" ){

                var expires_date = json_data.cancellation_date; // '2019-08-09 05:24:08 Etc/GMT'
                console.log("cancellation date == ", json_data.cancellation_date)
                var latest_receipt;
                var cancellation_reason = "";
                if(json_data.latest_receipt_info) {
                    var purchase_date = json_data.latest_receipt_info.purchase_date
                    purchase_date = purchase_date.substr(0, 10);
                    var expires_date = json_data.latest_receipt_info.expires_date_formatted; // '2019-08-09 05:24:08 Etc/GMT'
                    var product_id = json_data.auto_renew_product_id; // 'com.colin.FitwithWhit.monthly'
                    var original_transaction_id = json_data.latest_receipt_info.original_transaction_id;
                    latest_receipt = json_data.latest_receipt;
                    console.log("original_transaction_id", original_transaction_id)
                }else{
                    var purchase_date = json_data.latest_expired_receipt_info.purchase_date
                    purchase_date = purchase_date.substr(0, 10);
                    var expires_date = json_data.latest_expired_receipt_info.expires_date_formatted; // '2019-08-09 05:24:08 Etc/GMT'
                    var product_id = json_data.auto_renew_product_id; // 'com.colin.FitwithWhit.monthly'
                    var original_transaction_id = json_data.latest_expired_receipt_info.original_transaction_id;
                    latest_receipt = json_data.latest_expired_receipt;
                    cancellation_reason = json_data.latest_expired_receipt_info.cancellation_reason
                    console.log("original_transaction_id", original_transaction_id)

                }

                model_user.find({"profile.original_transaction_id": original_transaction_id}).limit(1).next(function(err, user){
                    if(err){
                        return sendError(res, "Failed to fetch user transactions: "+err);
                    }
                    if(!user){
                        console.error("User doesn't exist in our record");
                        return sendError(res, "Something went wrong! User does not exists in db!");
                    }
                    var paid = 0;
                    var updated_data = { "profile.subscription_plan_name": product_id, "profile.expire_date": expires_date, "profile.paid": paid, "profile.cancellation_reason": cancellation_reason, "profile.s2s_notification": true }
                    model_user.updateOne({"profile.original_transaction_id": original_transaction_id}, {$set: updated_data }, {}, function(err, doc){
                        if(err){
                            return sendError(res, "Failed to update user s2s in-app purchase update status");
                        }
                        console.info("S2S In-APP Purchase updated successfully");
                        sendSuccess(res, {message: "S2S In-APP Purchase updated successfully", response: doc});
                    });

                })
            }else{
                res.json({
                    error: false,
                    message: "success",
                    response: req.body,
                })
            }
        })
    })

    module.exports = router;

    // Optionally set a different controller name...this defaults to current file path, excluding base route dir path and file extension.
    // So, for a file, /routes/foo/bar/foobar.js, where /routes/ is base route dir, controller will default to foo/bar/foobar
    // Also, if some file is named index.js, then the full name is ignored, but the path is taken into consideration for defining controller name

    //module.exports.controller = "api";
})();