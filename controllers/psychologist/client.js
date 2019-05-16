const Psy = require('./../../models/psychologist');
const Client = require('./../../models/client');
const User = require('./../../models/user');
const Mood = require('./../../models/moodEntry');
const MoodAnswer = require('./../../models/moodAnswer');
const Goal = require('./../../models/goal');
const Session = require('./../../models/session');
const Note = require('./../../models/note');
const QuestionList = require('./../../models/questionList');
const Question = require('./../../models/evaluationQuestion');
const Answer = require('./../../models/evaluationAnswer');
const Contact = require('./../../models/contact');
const sequelize = require('./../../util/database');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const aFE = require('./../../util/asyncForEach');

exports.inviteClient = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id);
        const invite = await psy.createInvite({
            clientName: req.body.name,
            clientEmail: req.body.email,
        })
        const user = await User.findOne({
            where: {
                email: req.body.email
            }
        })
        if (!user) {
            //TODO: send an invitation email
        }
        res.status(201).json({message: 'invitation has been sent', data: invite});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}

exports.getClients = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id);
        let clients = await psy.getClients({
            attributes: ['id', 'diagnosis', 'userId'],
        });
        clients = clients.map((client) => {
            return {
                id: client.id,
                userId: client.userId
            }
        })
        
        if(clients.length <= 0){
            const error = new Error('You don\'t have any clients yet');
            error.statusCode = 404;
            throw error;
        }
        const clientsPlus = [];
        await aFE.asyncForEach(clients, async (client) => {
            const contact = await Contact.findOne({
                where: {
                    userId: client.userId
                }
            });
            console.log(contact);
            //console.log(client);
            client.name = contact.firstName + ' ' + contact.familyName;

            const mood = await Mood.findOne({
                where: {
                    clientId: client.id
                },
                order: [ [ 'createdAt', 'DESC' ]]
            });
            if(mood) {
                client.mood = mood.mood;
            } else {
                client.mood = null;
            }
            //add latest session evaluation
            const lastAnsweredAnswer = await Answer.findAll({
                limit: 1,
                where: {
                    clientId: client.id
                },
                order: [ [ 'createdAt', 'DESC' ]]

            });
            if(lastAnsweredAnswer.length <= 0) {
                console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!true');
                clientsPlus.push(client);
            } else {
                console.log('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffalse');
                console.log(lastAnsweredAnswer);

            const session = await Session.findOne({
                where: {
                    id: lastAnsweredAnswer[0].sessionId,
                },
            });
            console.log(session);

            const questionList = await session.getQuestionLists({
                limit: 1, 
                where: {
                    title: 'Session rating'
                },
                order: [ [ 'createdAt', 'DESC' ]]
            });
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            //console.log(questionList);
            const question = await Question.findOne({
                where: {
                    questionListId: questionList[0].id,
                    question: 'Algemene Beoordeeling'
                },
            });
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            //console.log(question);
            //console.log(session[0].id);
            const answer = await Answer.findOne({
                where: {
                    sessionId: session.id,
                    evaluationQuestionId: question.id
                }
            });
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            //console.log(answer);
            if(answer) {
                client.score = answer.value;
            } else {
                client.score = null;
            }
            if(session) {
                client.session = session;
            }
            else {
                client.session = null;
            }

            const contact = await Contact.findOne({
                where: {
                    userId: client.userId
                }
            });
            client.name = contact.firstName + ' ' + contact.familyName;
            clientsPlus.push(client);
            }
            if(client.id === clients[clients.length -1].id) {
                res.status(200).json({data: clientsPlus});
            }
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}

exports.getClient = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id); 
        const client = await psy.getClients({
            where: {
                id: req.params.clientId
            }, 
            attributes: ['id', 'diagnosis', 'userId'],
            raw: true        
        })   
        if(!client){
            const error = new Error('There is no client with id:' + req.params.clientId);
            error.statusCode = 404;
            throw error;
        }
        const contact = await Contact.findOne({
            where: {
                userId: client[0].userId
            }
        });
        console.log(contact);
        client[0].name = contact.firstName + ' ' + contact.familyName;
        res.status(200).json({
            data: client[0],
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}
exports.getClientMoods = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id); 
        const client = await psy.getClients({
            where: {
                id: req.params.clientId
            },
        })   
        if(!client){
            const error = new Error('There is no client with id:' + req.params.clientId);
            error.statusCode = 404;
            throw error;
        }
        const moods = await Mood.findAll({
            where: {
                clientId: client[0].id
            },
            order: [
                ['createdAt', 'DESC']
            ]
        });
        const moodsWithData = [];
        await aFE.asyncForEach(moods, async (mood) => {
            const questions = await mood.getMoodQuestions();
            const emotions = await mood.getEmotions();
            moodsWithData.push({
                mood: mood,
                questions: questions,
                emotions: emotions
            });
        })
        res.status(200).json({data: {
            moods: moodsWithData,
        }});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}
exports.getClientMood = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id); 
        const client = await psy.getClients({
            where: {
                id: req.params.clientId
            },
        });
        if(client.length <= 0) {
            const error = new Error('Client does not belong to this psychologist');
            error.statusCode = 401;
            throw error;
        }
        const startDate = new Date(req.params.moodDate);
        const endDate = new Date(startDate.getTime() + 24 * 60 * 60 *1000);
        console.log(startDate);
        console.log(endDate);
        const entries = await Mood.findAll({
            where: {
                //id: req.params.moodId,
                clientId: req.params.clientId,
                createdAt: {
                    $lt: endDate,
                    $gt: startDate
                }
            }
        })
        console.log('entries');
        console.log(entries);
        if (entries.length > 0) {
            const allEntries  = [];
            await aFE.asyncForEach(entries, async entry => {            
                const emotions= await entry.getEmotions();
                const questions= await entry.getMoodQuestions();
                allEntries.push ({
                    entry: entry,
                    questions: questions,
                    emotions: emotions,
                });
                if (entry === entries[entries.length - 1]) {
                    res.status(201).json({entries: allEntries});
                } 
            });
        } else {
            const error = new Error('An entry for date: '+ req.params.moodDate +' could not be found');
            error.statusCode = 404;
            throw error;
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.getClientGoals = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id); 
        const client = await psy.getClients({
            where: {
                id: req.params.clientId
            },
        })   
        if(!client){
            const error = new Error('There is no client with id:' + req.params.clientId);
            error.statusCode = 404;
            throw error;
        }
        const goals = await Goal.findAll({
            where: {
                clientId: client[0].id
            }
        });
        res.status(200).json({data: {
            goals: goals,
        }});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}
exports.getClientSessions = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id); 
        const client = await psy.getClients({
            where: {
                id: req.params.clientId
            },
            raw: true
        })   
        if(!client){
            const error = new Error('There is no client with id:' + req.params.clientId);
            error.statusCode = 404;
            throw error;
        }
        const sessions = await Session.findAll({
            where: {
                clientId: client[0].id
            },
            order: [
                ['date', 'DESC'],
                ['startTime', 'DESC']
            ]
        });
        const mappedSessions = [];
        await aFE.asyncForEach(sessions, async (session) => {
            const questionLists = await session.getQuestionLists()
            await aFE.asyncForEach(questionLists, async (questionList) => {
                
                const questions = await Question.findAll({
                    where: {
                        questionListId: questionList.id,
                    }
                });
                console.log(questions);
                const mappedQuestions = [];
                await aFE.asyncForEach(questions, async (question) => {
                    const answer = await Answer.findOne({
                        where: {
                            evaluationQuestionId: question.id,
                            sessionId: session.id,
                        }
                    });
                    const questionAnswer = {
                        question: question,
                        answer: answer
                    }
                    mappedQuestions.push(questionAnswer);
                });
                const sessionQuestion = {
                    session: session,
                    questions: mappedQuestions,
                }
                mappedSessions.push(sessionQuestion);
            })

        })
        res.status(200).json({data: {
            sessions: mappedSessions,
        }});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}
exports.getClientSession = async (req, res, next) => {
    try {
        //TODO: add all evaluationscores

        const session = await Session.findByPk(req.params.sessionId);
        const questionLists = await session.getQuestionLists();
        const allQuestions = [];
        const answers = [];

        if(!session){
            const error = new Error('No session with id :' + req.params.sessionId + ' was found!');
            error.statusCode = 404;
            throw error;
        }
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
                }
            });
            if(answer) {
                answers.push(answer);
            }
        });

        res.status(200).json({
            data: session,
            questions: allQuestions,
            answers: answers,
        });
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.getClientNotes = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id); 
        const client = await psy.getClients({
            where: {
                id: req.params.clientId
            },
            raw: true
        })   
        if(!client){
            const error = new Error('There is no client with id:' + req.params.clientId);
            error.statusCode = 404;
            throw error;
        }
        const notes = await Note.findAll({
            where: {
                clientId: client[0].id
            }
        });
        res.status(200).json({data: {
            notes: notes
        }});

        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}

exports.updateClient = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id); 
        const client = await psy.getClients({
            where: {
                id: req.params.clientId
            },
        })   
        if(!client){
            const error = new Error('There is no client with id:' + req.params.clientId);
            error.statusCode = 404;
            throw error;
        }
        console.log(client[0]);
        client[0].diagnosis = req.body.diagnosis;
        await client[0].save();

        res.status(200).json({data: {
            client: client[0]
        }});

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}

exports.getClientContact = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id); 
        console.log('logggggggggggginglogggggggggggginglogggggggggggginglogggggggggggging');
        console.log('logggggggggggginglogggggggggggginglogggggggggggginglogggggggggggging');
        console.log('logggggggggggginglogggggggggggginglogggggggggggginglogggggggggggging');
        console.log('logggggggggggginglogggggggggggginglogggggggggggginglogggggggggggging');
        console.log('logggggggggggginglogggggggggggginglogggggggggggginglogggggggggggging');
        console.log('logggggggggggginglogggggggggggginglogggggggggggginglogggggggggggging');
        console.log('logggggggggggginglogggggggggggginglogggggggggggginglogggggggggggging');
        const client = await psy.getClients({
            where: {
                id: req.params.clientId
            }, 
            raw: true        
        })   
        if(!client){
            const error = new Error('There is no client with id:' + req.params.clientId);
            error.statusCode = 404;
            throw error;
        }
        const contact = await Contact.findOne({
            where: {
                userId: client[0].userId
            }
        });

        const user = await User.findByPk(client[0].userId, {
            attributes: ['id', 'email'],

        })
        client[0].contact = contact;
        client[0].user = user;
        res.status(200).json({
            data: client[0],
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}