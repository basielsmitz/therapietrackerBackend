const express = require('express');

const { body } = require('express-validator/check');

const User = require('../models/user');
const Psy = require('../models/psychologist');
const authController = require('../controllers/auth');
const sessionController = require('../controllers/psychologist/session');
const questionListController = require('../controllers/psychologist/questionList');
const toDoController = require('../controllers/psychologist/todo');
const clientController = require('../controllers/psychologist/client');
const isPsy = require('../middleware/is-psy');
const createStartData = require('../util/createStartData');

const router = express.Router();

router.post('/profile', isPsy ,async(req, res, next) => {
    try {
        const currentUser = await User.findByPk(req.userId);
        const dbPsy = await Psy.findAll(
            {
                where: {
                    userId: req.userId
                }
            }
        );
        console.log(dbPsy.length);
        if (dbPsy.length > 0) {
            console.log('hellooo??')
            const error = new Error('profile already exists');
            error.statusCode = 401;
            throw error;
        }
        const psy = await currentUser.createPsychologist();
        createStartData(psy, next);
        const contact = await currentUser.createContact({
                familyName: req.body.familyName,
                firstName: req.body.firstName,
                phone: req.body.phone,
                birthdate: req.body.birthdate,
            });
        res.status(200).json({message: "Profile and Contact created", data: {
            profile: psy,
            contact: contact
        }});

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
});

// router.post('/profile', isPsy ,async(req, res, next) => {
//     let currentUser;
//     let currentPsy;
//     User.findByPk(req.userId)
//     .then(user => {
//         currentUser = user;
//         return user.createPsychologist();
//     })
//     constPsy.findAll(
//         {
//             where: {
//                 userId: req.userId
//             }
//         }
//     )
//     .then(psy => {
//         currentPsy = psy;
//         createStartData(psy, next);
//         return currentUser.createContact({
//             familyName: req.body.familyName,
//             firstName: req.body.firstName,
//             phone: req.body.phone,
//             birthdate: req.body.birthdate,
//         });
//     })
//     .then(contact =>{

//         res.status(200).json({message: "Profile and Contact created", data: {
//             profile: currentPsy,
//             contact: contact
//         }});
//     })
//     .catch(err => {
//         if (!err.statusCode) {
//             err.statusCode = 500;
//           }
//           next(err);
//     })
// });

//sessions
router.post('/session', isPsy, sessionController.addSession);
router.get('/session', isPsy, sessionController.getSessions);
router.get('/session/today/:date', isPsy, sessionController.getSessionsToday);
router.get('/session/:sessionId', isPsy, sessionController.getSession);
router.delete('/session/:sessionId', isPsy, sessionController.deleteSession);
router.put('/session/:sessionId', isPsy, sessionController.updateSession);

//question lists

router.post('/questionlist', isPsy, questionListController.addQuestionList);
router.get('/questionlist', isPsy, questionListController.getQuestionLists);
router.get('/questionlist/:questionListId', isPsy, questionListController.getQuestionList);
router.delete('/questionlist/:questionListId', isPsy, questionListController.deleteQuestionList);
router.put('/questionlist/:questionListId', isPsy, questionListController.updateQuestionList);

//todo's
router.post('/todo', isPsy, toDoController.addToDo);
router.get('/todo', isPsy, toDoController.getAllTodos);
router.get('/todo/:todoId', isPsy, toDoController.getTodo);
router.delete('/todo/:todoId', isPsy, toDoController.deleteTodo);
router.put('/todo/:todoId', isPsy, toDoController.todoStatusChange);

//clients
router.post('/client', 
[
    body('name').isLength({min: 1}),
    body('email').isEmail().isLength({min: 1}),

], isPsy, clientController.inviteClient);
router.get('/client', isPsy, clientController.getClients);
router.get('/client/:clientId', isPsy, clientController.getClient);
router.put('/client/:clientId', isPsy, clientController.updateClient);
router.get('/client/:clientId/contact', isPsy, clientController.getClientContact);
router.get('/client/:clientId/goal', isPsy, clientController.getClientGoals);
router.get('/client/:clientId/session', isPsy, clientController.getClientSessions);
router.get('/client/:clientId/session/:sessionId', isPsy, clientController.getClientSession);
router.get('/client/:clientId/mood', isPsy, clientController.getClientMoods);
router.get('/client/:clientId/mood/:moodDate', isPsy, clientController.getClientMood);
router.get('/client/:clientId/note', isPsy, clientController.getClientNotes);

module.exports = router;