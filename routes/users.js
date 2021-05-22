const User = require('../model/user');
const Router = require('express').Router();

module.exports = Router.use((req,res) => {
    User.find()
    .then(result => {
        res.status(200).json({registeredUsers : result});
    })
    .catch(error => {
        console.log(error);
    })
});