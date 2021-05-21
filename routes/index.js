const Router = require('express').Router();
const User = require('../model/user');

module.exports = Router.use((req,res,next) => {
        if(req.isAuthenticated()) {
            User.findById(req.session.passport.user)
            .then(result => {
                res.status(200).json({message: "Welcome you have logged In successfully",
                                  logInSession: req.session,
                                loggedInAs: result});
            })
            .catch(err => {
                console.log(err);
            })
        } else {
            res.status(403).json({message : "Please Log In"});
        }
})
