const Router = require('express').Router();
const User = require('../model/user');

module.exports = Router.use((req,res,next) => {
        if(req.isAuthenticated()) {
            res.status(200).json({message: "Welcome you have logged In successfully",
                                  logInSession: req.session});
        } else {
            res.status(403).json({message : "Please Log In"});
        }
})