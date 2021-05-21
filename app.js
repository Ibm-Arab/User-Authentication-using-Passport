//Getting .env file variables
if(process.env.NODE_ENV !== 'production')  {
    require('dotenv').config();
}
//Including Modules
const express = require('express');
const app = express();
const path = require('path');
const compression = require('compression');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('express-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');
//Including required files
const rootDir = require('./util/path');
const index = require('./routes/index');
const pageNotFound = require('./routes/pageNotFound');
const signup = require('./routes/signup');
const signUpAs = require('./controllers/signUp');
const login = require('./routes/login');
const logIn = require('./controllers/logIn');
const logOut = require('./controllers/logOut');

//For fetching the posted data
app.use(express.urlencoded({extended:false}));
app.use(express.json());
//For making the file available to link with
app.use(express.static(path.join(rootDir,'public')));
//For compressing the file size
app.use(compression());
//For getting errors message
app.use(flash());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
//For initializing the user authentication
app.use(passport.initialize());
app.use(passport.session());
//For including serialiazation, deserialization and passport function
logIn();

//For running the .ejs files
app.set('view engine','ejs');
app.set('views','views');

app.get('/',index);
app.get('/home',index);
app.get('/signup',signup);
app.post('/signup/signup/',signUpAs);
app.get('/login',login);
app.post('/login/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));
app.get('/logout',logOut);
app.use('/',pageNotFound);

mongoose
.connect('mongodb+srv://LMSAdmin:LMSAdmin123@lms.qej4l.mongodb.net/LMS?retryWrites=true&w=majority',{
    //For removing the warnings
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    app.listen(3000,() => {
        console.log('Server Port is 3000');
    });
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.log(err);
})