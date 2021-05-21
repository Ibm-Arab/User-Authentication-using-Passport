const Router = require('express').Router();

module.exports = Router.use((req,res,next) => {
    res.status(200).json({message: 'Welcome to Sign Up Page'});
});