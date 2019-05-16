const aFE = require('./asyncForEach');
const Question = require('./../models/evaluationQuestion');

const createStartData = async (psy, next) => {
   
    try {
        const questionlists = [
            {title: 'Session rating',
            description: 'Beoordeel aspecten van de sessie',
            questions: [
                {
                    question: 'Algemene Beoordeeling', 
                    description: 'Beoordeeling die de gehele sessie omvat', 
                    type: 'range'
                },
                {
                    question: 'Ik werd gehoord, verstaan en gerespecteerd', 
                    description: 'relatie tussen client/psycholoog', 
                    type: 'range',
                },
                {
                    question: 'De topics die ik wou bespreken werden aangehaald', 
                    description: 'topics', 
                    type: 'range',
                },
                {
                    question: 'De aanpak van de psycholoog past bij mij', 
                    description: 'aanpak', 
                    type: 'range',
                },
            ]}
        ]
        await aFE.asyncForEach(questionlists, async questionlist => {
            addQuestionList(questionlist, psy, next);
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
    
}
module.exports = createStartData;

  const addQuestionList = async (entry, psy, next) => {
    try {
    const questionList = await psy.createQuestionList({
        title: entry.title,
        description: entry.description
    });

    const questions = [];

    await aFE.asyncForEach(entry.questions, async (question) => {
        const newQuestion = await Question.create({
            question: question.question,
            description: question.description,
            type: question.type,
        })
        questions.push(newQuestion);
        await newQuestion.setQuestionList(questionList);
    });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
  }