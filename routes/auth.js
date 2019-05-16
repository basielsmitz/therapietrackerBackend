const express = require('express');

const { body } = require('express-validator/check');

const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.put('/signup', [
    body('email').isEmail()
    .withMessage('Please enter a valid email')
    .custom((value, {req}) => {
        return User.findAll({
            where: {
              email: value
            }
          })
          .then(users => {
              if(users.length) {
                  return Promise.reject('Email already in use');
              }
          });
    }),
], authController.signup);


router.post('/login', authController.login);

module.exports = router;