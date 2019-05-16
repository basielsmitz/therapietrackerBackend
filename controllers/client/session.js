const Session = require('./../../models/session');
const Client = require('./../../models/client');
const EvaluationQuestion = require('./../../models/evaluationQuestion');
const EvaluationAnswer = require('./../../models/evaluationAnswer');

const aFE = require('./../../util/asyncForEach');

exports.getSessions = async (req, res, next) => {
    try {
        //TODO: add general evaluationscore
        const sessions = await Session.findAll({
            where: {
                clientId: req.role.id
            },
            order: [
                ['date', 'DESC'],
                ['startTime', 'DESC']
            ],
            raw: true,
        });
        if(sessions.length <= 0){
            res.status(204).json({
                message: 'There are no sessions yet',
                data: []
            });  
        }
        const answers = await EvaluationAnswer.findAll();
        console.log(answers);
        const questions = await EvaluationQuestion.findAll();
        const modifiedSessions = [];
        sessions.forEach(session => {
            const sessionAnswers = answers.filter(answer => {
                return answer.sessionId === session.id;
            })
            const sessionQuestions = []
            if(sessionAnswers.length > 0) {
                sessionAnswers.forEach(answer => {
                    const answerQuestion = questions.find(question => {
                        return question.id === answer.evaluationQuestionId;
                    })
                    sessionQuestions.push(answerQuestion);
                    if(answer === sessionAnswers[sessionAnswers.length - 1]) {
                        modifiedSessions.push({
                            entry: session,
                            questions: sessionQuestions,
                            answers: sessionAnswers,
                        })
                    }
                })
            }
            else {
                modifiedSessions.push({
                    entry: session,
                    questions: sessionQuestions,
                    answers: sessionAnswers,
                });
            }
            if(session === sessions[sessions.length - 1] ) {
                res.status(200).json({
                    data: modifiedSessions
                });  
            }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}

exports.getSession = async (req, res, next) => {
    try {
        //TODO: add all evaluationscores

        const session = await Session.findByPk(req.params.sessionId);
        const questionLists = await session.getQuestionLists({
            order: [['createdAt', 'ASC']]
        });
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
            console.log(session);
            const answer = await EvaluationAnswer.findOne({
                where: {
                    evaluationQuestionId: question.id,
                    sessionId: session.id,
                }
            });
            console.log('answer??????????????????????????????????????????????????');
            console.log(answer);

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

exports.evaluateSession = async (req, res, next) => {
    try {
        const client = await Client.findByPk(req.role.id);
        const answers = [];
        const messages =[];
        const questions = [];
        // add answers
        await aFE.asyncForEach(req.body.answers, async (answer) => {
            const dbAnswer = await EvaluationAnswer.findOne({
                where: {
                    evaluationQuestionId: answer.questionId,
                    sessionId: req.params.sessionId,
                }
            });
            if(dbAnswer){
                messages.push(
                    {
                        message: 'question with id: ' + dbAnswer.evaluationQuestionId + ' has already been answered',
                        answer: dbAnswer
                    }
                );
            } else {
                const question = await EvaluationQuestion.findByPk(answer.id);
                if(question) {
                    questions.push(question); 
                    const newAnswer = await client.createEvaluationAnswer({
                        value: answer.value
                    });
                    await newAnswer.setEvaluationQuestion(question.id);
                    await newAnswer.setSession(req.params.sessionId);
                    answers.push(newAnswer);
                    
                }
                else {
                    messages.push(
                        {
                            message: 'question with id: ' + answer.questionId + ' has not been found',
                        }
                    );

                }
                if (answer === req.body.answers[req.body.answers.length - 1]) {
                    res.status(200).json({
                        questions: questions,
                        answers: answers,
                        messages: messages
                    });
                }
                
            }
        });
        
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}