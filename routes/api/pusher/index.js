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

    const Chatkit = require('@pusher/chatkit-server');

    const chatkit = new Chatkit.default({
        instanceLocator: 'v1:us1:988888b6-2843-435f-a58f-3ea70518d861',
        key: 'bdb5287a-d4b4-4462-9dfe-e7a1a4738530:yDTXa6bqdQ09+fo++dW2VTRLACcqPXce0z7442XYguM='
    });
    
    /**
        @@ Create a token on StreamChat
        @@ input username and user_id
        @@ Save token into user profile
    **/

    router.post('/create_user', function(req, res, next) {
        var user_id = req.body.user_id;
        if(!user_id) {
            sendError(res, "User id is missing");
        }
        const StreamChat = require('stream-chat').StreamChat;
        var APPID = process.env.APPID;
        var CHAT_API_SECRET = process.env.CHAT_API_SECRET;
        const client = new StreamChat(APPID, CHAT_API_SECRET);
        const token = client.createToken(user_id);
        if(token){
            var model_user = Model.load('user', {}, function(err, model_user) {
                if (err) {
                    sendError(res, "Failed to access db: " + err);
                } else {
                    var updatedUserData = { "profile.stream_chat_token": token };
                    model_user.updateOne({_id: Model.ObjectID(user_id)}, {$set: updatedUserData }, {}, function(err, r){
                        if(err){
                            return sendError(res, "Failed to update user data: "+err);
                        }
                        sendSuccess(res, {
                            message: "Token generated successfully",
                            token: token
                        })
                    })
                }
            })
        }else{
            sendError(res, "Something went wrong, while getting token from stream chat");
        }
    })

    /**
        @@ Authentication on Pusher
        @@ input user_id
    **/

    router.post('/auth', (req, res, next) => {
        
        var user_id = req.query.user_id || false
        if(!user_id){
            res.json({
                error: true,
                message: "user id is missing in query parameters",
                responseCode: 0
            });
            res.end();
            return;
        }
        const authData = chatkit.authenticate({
            userId: req.query.user_id
        });

        res.status(authData.status)
            .send(authData.body);
    })

    module.exports = router;

    // Optionally set a different controller name...this defaults to current file path, excluding base route dir path and file extension.
    // So, for a file, /routes/foo/bar/foobar.js, where /routes/ is base route dir, controller will default to foo/bar/foobar
    // Also, if some file is named index.js, then the full name is ignored, but the path is taken into consideration for defining controller name

    //module.exports.controller = "api";
})();