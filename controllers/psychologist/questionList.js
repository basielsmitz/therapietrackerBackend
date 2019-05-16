const Psy = require('./../../models/psychologist');
const QuestionList = require('./../../models/questionList');
const Question = require('./../../models/evaluationQuestion');

const aFE = require('./../../util/asyncForEach');


exports.addQuestionList = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id);
    const questionList = await psy.createQuestionList({
        title: req.body.title,
        description: req.body.description
    });

    const questions = [];

    await aFE.asyncForEach(req.body.questions, async (question) => {
        const newQuestion = await Question.create({
            question: question.question,
            description: question.description,
            type: question.type,
            data: question.data,
        })
        console.log(req.body.questions);
        questions.push(newQuestion);
        await newQuestion.setQuestionList(questionList);
    });
    res.status(201).json({message: 'new question list created!', data: {
        questionList: questionList, 
        questions: questions,
    }});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.getQuestionLists = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id);
        const questionLists = await psy.getQuestionLists({
            order: [['createdAt', 'DESC']],
        });

        if(questionLists.length <= 0){
            res.status(204).json({
                message: 'You don\'t have any questionlists yet',
                data: []
            });  
        }

    res.status(201).json({ data: {
        entries: questionLists, 
    }});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.getQuestionList = async (req, res, next) => {
    try {
        const questionListId = req.params.questionListId;
        const questionList = await QuestionList.findByPk(questionListId);
        const questions = await Question.findAll({
            where: {
                questionListId: questionListId,
            }
        })

        if(!questionList){
            const error = new Error('there is no question list with id: ' + questionListId);
            error.statusCode = 401;
            throw error;
        }
        questionList.questions = questions;

    res.status(201).json({ data: {
        entry: questionList, 
        questions: questions
        
    }});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}

exports.deleteQuestionList = async (req, res, next) => {
    try {
        const questionListId = req.params.questionListId;
        const questionList = await QuestionList.findByPk(questionListId);
        const questions = await Question.findAll({
            where: {
                questionListId: questionListId,
            }
        })

        if(!questionList){
            const error = new Error('there is no question list with id: ' + questionListId);
            error.statusCode = 401;
            throw error;
        }
        await aFE.asyncForEach(questions, async (question) => {
            console.log('destroying question');
            console.log(question);
            await question.destroy({force: true});
        });
        await questionList.destroy();
        questionList.questions = questions;

    res.status(202).json({ message: 'questionlist with id: ' + questionListId + ' has been removed'});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.updateQuestionList = async (req, res, next) => {
    try {
        const questionListId = req.params.questionListId;
        const questionList = await QuestionList.findByPk(questionListId);
        const questions = await Question.findAll({
            where: {
                questionListId: questionListId,
            }
        })

        if(!questionList){
            const error = new Error('there is no question list with id: ' + questionListId);
            error.statusCode = 401;
            throw error;
        }
        questionList.title = req.body.title;
        questionList.description = req.body.description;
        await questionList.save();

        await aFE.asyncForEach(questions, async (question) => {
            console.log('destroying question');
            question.destroy();
        });
        const allQuestions = [];
        await aFE.asyncForEach(req.body.questions, async (question) => {
            const newQuestion = await Question.create({
                question: question.question,
                description: question.description,
                type: question.type,
                data: question.data,
            })
            allQuestions.push(newQuestion);
            await newQuestion.setQuestionList(questionList);
        });

    res.status(202).json({ 
        message: 'questionlist with id: ' + questionListId + ' has been updated', 
        data: {
            entry: questionList,
            questions: allQuestions
        }
    });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}