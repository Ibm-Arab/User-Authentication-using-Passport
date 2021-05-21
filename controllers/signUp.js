const User = require('../model/user');
const bcrypt = require('bcryptjs');

module.exports = (req,res,next) => {
    let name = req.body.name;
    let gender = req.body.gender;
    let email = req.body.email;
    let number = req.body.number;
    let role = req.body.role;
    let pwd = req.body.pwd;
        User.findOne({email: email})
        .then(result => {
            if(result) {
                return res.status(403).json({inUse: 'Email already in use!'});
            }
            return bcrypt.hash(pwd, 12);
        })
        .then(password => {
            if(password) {
            const user = new User({
                name: name,
                gender: gender,
                email: email,
                number: number,
                role: role,
                password: password
            });
            user.save()
            res.status(200).json({message: 'Registered Successfully'});
            }
        })
        .catch(err => {
            console.log(err);
        })
}