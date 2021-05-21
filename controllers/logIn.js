const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../model/user');
const bcrypt = require('bcryptjs');

function initialize() {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
    done(err, user);
    });
});
passport.use(new LocalStrategy({
        usernameField: 'email',
    }, function (email,password,done) {
    User.findOne({email: email}, function (err, user) {
        if(err) return done(err);
        if(!user) return done(null, false, {message: 'Incorrect Email'});
        User.findOne({email: email})
        .then(result => {
            bcrypt.compare(password, result.password, function (err, res) {
                if(err) return done(err);
                if(res) {
                    return done(null, result);
                } else {
                    return done(null, false, {message: 'Incorrect Password'});
                }
            });
        })
        .catch(err => {
            console.log(err);
        })
    });
}));
}

module.exports = initialize;