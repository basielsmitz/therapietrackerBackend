const User = require('../models/user');
const Client = require('../models/client');
const Psy = require('../models/psychologist');
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    } 
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, 12)
    .then(hashedPw => {
        return User.create({
            email: email,
            password: hashedPw,
            role: req.body.role,
        })
    })
    .then(result => {
        console.log(result);
        res.status(201).json({message: 'User created', userId: result.id});
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    })
}
exports.login = (req, res, next) => {
    const email = req.body.email; 
    const password = req.body.password;
            hasProfile = true;


    User.findOne({where: { email: email }})
    .then(user => {
        if (!user) {
            const error = new Error('A user could not be found');
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
        if(!isEqual) {
            const error = new Error('Password is incorrect');
            error.statusCode = 401;
            throw error;
        }
        switch(loadedUser.role) {
            case 'client' :{
                console.log('this is a client');
                return Client.findOne({
                    where: {
                        userId: loadedUser.id 
                    }
                });
            }
            case 'psychologist': {
                console.log('this is a psychologist');
                return Psy.findOne({
                    where: {
                        userId: loadedUser.id 
                    }
                });
            }
        }
    }).then(result => {
        const token = jwt.sign({
            email: loadedUser.email,
            userId: loadedUser.id,
            role: {
                role: loadedUser.role,
                id: result?result.id:false,
            },
        // }, process.env.JWT_STRING, { expiresIn: '1h' });
        }, process.env.JWT_STRING);
    res.status(200).json({
            token: token,
            userId: loadedUser.id,
            role: {
                role: loadedUser.role,
                id: result?result.id:false,
            },
        }); 
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    });


}