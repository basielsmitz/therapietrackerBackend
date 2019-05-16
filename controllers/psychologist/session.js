const Psy = require('./../../models/psychologist');
const Client = require('./../../models/client');
const Session = require('./../../models/session');
const Note = require('./../../models/note');
const QuestionList = require('./../../models/questionList');
const EvaluationQuestion = require('./../../models/evaluationQuestion');
const EvaluationAnswer = require('./../../models/evaluationAnswer');
const Mood = require('./../../models/moodEntry');
const Contact = require('./../../models/contact');

const aFE = require('./../../util/asyncForEach');

exports.addSession = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id);
        const client = await Client.findByPk(req.body.clientId);
        if (!client) {
            const error = new Error('Client with id: ' + clientId + ' has not been found');
            error.statusCode = 401;
            throw error;
        }
        const session = await psy.createSession({
            date: req.body.date,
            endTime: req.body.endTime,
            startTime: req.body.startTime,
            location: req.body.location
        });
        if (!session) {
            const error = new Error('Session was not created');
            error.statusCode = 401;
            throw error;
        }
        await client.addSession(session);
        await aFE.asyncForEach(req.body.questionLists, async (entry) => {

            const questionList = await QuestionList.findByPk(entry.id);
            if (questionList) {
                await session.addQuestionList(questionList);
            } else {
                const questionLists = await session.getQuestionLists();
                await aFE.asyncForEach(questionLists, async (list) => {
                    await list.listSession.destroy({force: true});
                });
                await session.destroy();
                const error = new Error('Question list with id: ' + entry.id + ' does not exist');
                error.statusCode = 401;
                throw error;
            }
        });
        await aFE.asyncForEach(req.body.notes, async (entry) => {
            const note = await psy.createNote({
                body: entry.body
            });
            if (note) {
                await note.setClient(client);
                await note.setSession(session);
            }
        });
        res.status(201).json({message: 'new session created!', data: {
            entry: session, 
            client: client,
            questionLists: req.body.questionLists,
            notes: req.body.notes,
        }});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.getSessions = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id);
        const sessions = await psy.getSessions();
        if(sessions.length <= 0){
            const error = new Error('No sessions found');
            error.statusCode = 404;
            throw error;
        }
        res.status(201).json({data: {entries: sessions}});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.getSessionsToday = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id);
        const sessions = await psy.getSessions({
            where: {
                date: req.params.date
            }
        });
        if(sessions.length <= 0){
            const error = new Error('No sessions found');
            error.statusCode = 404;
            throw error;
        }
        res.status(201).json({data: {entries: sessions}});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.getSession = async (req, res, next) => {
    try {
        const sessionId = req.params.sessionId;
        const session = await Session.findByPk(sessionId);
        if(!session){
            const error = new Error('No session with id: ' + sessionId +' was found');
            error.statusCode = 404;
            throw error;
        }
        const questionLists = await session.getQuestionLists();
        const notes = await Note.findAll({ 
            where: {
                sessionId: sessionId
            },
            order: [['createdAt', 'DESC']],

        })
        const allQuestions = [];
        const answers = [];
        // get all questions
        await aFE.asyncForEach(questionLists, async (questionList) => {
            const questions = await EvaluationQuestion.findAll({
                where: {
                    questionListId: questionList.id,
                },
                raw: true
            });
            allQuestions.push(...questions);

        });
        // TODO check questions for answers
        await aFE.asyncForEach(allQuestions, async (question) => {
            const answer = await EvaluationAnswer.findOne({
                where: {
                    evaluationQuestionId: question.id,
                    sessionId: session.id,
                }
            });
            if(answer) {
                answers.push(answer);
            }
        });
        const client = await Client.findByPk(session.clientId);
        const lastAnsweredAnswer = await EvaluationAnswer.findAll({
            limit: 1,
            where: {
                clientId: client.id
            },
            order: [ [ 'createdAt', 'DESC' ]]

        });
        const lastRatedSession = await Session.findOne({
            where: {
                id: lastAnsweredAnswer[0].sessionId,
            },
        });
        console.log(session);
        
        const questionList = await lastRatedSession.getQuestionLists({
            limit: 1, 
            where: {
                title: 'Session rating'
            },
            order: [ [ 'createdAt', 'DESC' ]]
        });
        
        const question = await EvaluationQuestion.findOne({
            where: {
                questionListId: questionList[0].id,
                question: 'Algemene Beoordeeling'
            },
        });
        
        const answer = await EvaluationAnswer.findOne({
            where: {
                sessionId: lastRatedSession.id,
                evaluationQuestionId: question.id
            }
        });
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!works!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log(answer);
        let lastRating = null
        if (answer) {
            lastRating = answer.value;
        }
        const contact = await Contact.findOne({
            where: {
                userId: client.userId
            }
        });
        const mood = await Mood.findOne({
            where: {
                clientId: client.id
            },
            order: [ [ 'createdAt', 'DESC' ]]
        });
        console.log(notes);
        res.status(201).json({data: {
            entry: session,
            questionLists: questionLists,
            client: {
                name: contact.firstName + ' ' + contact.familyName,
                entry: client,
                lastSessionRating: lastRating,
                lastMood: mood.mood
            },
            notes: notes,
            questions: allQuestions,
            answers: answers,
        }});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.deleteSession = async (req, res, next) => {
    try {
        const session = await Session.findByPk(req.params.sessionId);
        if(!session){
            const error = new Error('No session with id: ' + sessionId +' was found');
            error.statusCode = 404;
            throw error;
        }
        session.destroy();
        res.status(202).json({message: 'session with id: ' + req.params.sessionId + ' has been deleted'});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.updateSession = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id);
        const sessionId = req.params.sessionId;
        const session = await Session.findByPk(sessionId);
        if(!session){
            const error = new Error('No session with id: ' + sessionId +' was found');
            error.statusCode = 404;
            throw error;
        }
        //update session
        session.startTime = req.body.startTime;
        session.endTime = req.body.endTime;
        session.location = req.body.location;
        await session.save();

        //get questionlists from session
        let questionLists = await session.getQuestionLists();

        //get client
        const client = await Client.findByPk(session.clientId);

        //remove lists
        await aFE.asyncForEach(questionLists, async (list) => {
            await list.listSession.destroy({force: true});
        });

        //add lists
        await aFE.asyncForEach(req.body.questionLists, async (entry) => {
            const questionList = await QuestionList.findByPk(entry.id);
            if (questionList) {
                await session.addQuestionList(questionList);
            }
        });
        questionLists = await session.getQuestionLists();
        await aFE.asyncForEach(req.body.newNotes, async (entry) => {
            const note = await psy.createNote({
                body: entry.body
            });
            if (note) {
                await note.setClient(client);
                await note.setSession(session);
            }
        });
        const notes = await Note.findAll({ 
            where: {
                sessionId: sessionId
            },
            order: [['createdAt', 'DESC']],
        })

        res.status(201).json({data: {
            entry: session,
            questionLists: questionLists,
            client: client,
            notes: notes,
        }});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}