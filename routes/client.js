const express = require('express');

const { body } = require('express-validator/check');

const User = require('../models/user');
const isClient = require('../middleware/is-client');
const moodController = require('../controllers/client/mood');
const goalController = require('../controllers/client/goal');
const sessionController = require('../controllers/client/session');
const psyController = require('../controllers/client/psy');


const router = express.Router();

router.post('/profile', isClient ,(req, res, next) => {
    let currentUser;
    let currentClient;
    User.findByPk(req.userId)
    .then(user => {
        currentUser = user;
        return user.createClient();
    })
    .then(client => {
        currentClient = client;
        return currentUser.createContact({
            familyName: req.body.familyName,
            firstName: req.body.firstName,
            phone: req.body.phone,
            birthdate: req.body.birthdate,
        });
    })
    .then(contact => {
        res.status(200).json({message: "Profile and Contact created", data: {
            profile: currentClient,
            contact: contact
        }});
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    })
});

//moods
router.post('/mood', isClient, moodController.addMood);
router.get('/mood/data', isClient, moodController.getMoodData);
router.get('/mood', isClient, moodController.getMoods);
router.get('/mood/:moodDate', isClient, moodController.getMood);

//goals
router.post('/goal', isClient, goalController.addGoal);
router.get('/goal', isClient, goalController.getGoals);
router.get('/goal/:goalId', isClient, goalController.getGoal);
router.put('/goal/:goalId', isClient, goalController.goalStatusChange);
router.delete('/goal/:goalId', isClient, goalController.deleteGoal);

//sessions
router.get('/session', isClient, sessionController.getSessions);
router.get('/session/:sessionId', isClient, sessionController.getSession);
router.post('/session/:sessionId', isClient, sessionController.evaluateSession);

//psy
router.get('/psychologist/invite', isClient,  psyController.getInvites);
router.post('/psychologist/invite', isClient,  psyController.answerInvite);

module.exports = router;