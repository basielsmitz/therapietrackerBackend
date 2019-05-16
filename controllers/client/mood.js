const User = require('../../models/user');
const Client = require('../../models/client');
const Psy = require('../../models/psychologist');
const Mood = require('../../models/moodEntry')
const MoodQuestion = require('../../models/moodQuestion');
const Emotion = require('../../models/emotion');
const { validationResult } = require('express-validator/check');

exports.addMood = async (req, res, next) => {
    try {
        const client = await Client.findByPk(req.role.id);
        const entry = await client.createMoodEntry({
            mood: req.body.mood,
            thought: req.body.thought
        });
        if(entry) {
            await asyncForEach(req.body.questions, async (question) => {
                const moodQuestion = await MoodQuestion.findByPk(question.id);
                if(moodQuestion) {
                    await entry.addMoodQuestion(moodQuestion, {
                        through: {
                            value: question.value
                        }
                    });
                } else {
                    const questions = await entry.getMoodQuestions();
                    await asyncForEach(questions, async (question) => {
                        await question.moodAnswer.destroy({force: true});
                    })
                    await entry.destroy();
                    const error = new Error('A question with id: '+ question.id +' could not be found');
                    error.statusCode = 401;
                    throw error;
                }
            });
            //Add new emotion
            const allEmotionIds = [...req.body.emotions];
            if(req.body.newEmotions) {
                await asyncForEach(req.body.newEmotions, async (emotion) => {
                    const newEmotion = await Emotion.create({
                        title: emotion.title
                    });
                    allEmotionIds.push({id: newEmotion.id});
    
                })
                console.log(allEmotionIds);
            }
            const moodEmotions =[]
            await asyncForEach(allEmotionIds, async (emotion) => {

                const moodEmotion = await Emotion.findByPk(emotion.id);
                if(moodEmotion) {
                    await entry.addEmotion(moodEmotion);
                    moodEmotions.push(moodEmotion);
                } else {
                    const questions = await entry.getMoodQuestions();
                    await asyncForEach(questions, async (question) => {
                        question.moodAnswer.destroy({force: true});
                    })
                    const emotions = await entry.getEmotions();
                    await asyncForEach(emotions, async (emotion) => {
                        await emotion.emotionEntry.destroy({force: true});
                    })
                    await entry.destroy();
                    const error = new Error('A mood with id: '+ emotion.id +' could not be found');
                    error.statusCode = 401;
                    throw error;
                }
            });

            //finialize
            res.status(201).json({message: 'new mood log created!', data: {
                entry: entry, 
                questions: req.body.questions,
                emotions: moodEmotions
            }});
            //else entry if
        } else {
            const error = new Error('Entry has not been created');
            error.statusCode = 401;
            throw error;
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.getMoods = async (req, res, next ) => {
    try {
        const client = await Client.findByPk(req.role.id);
        const entries = await client.getMoodEntries({
            order: [['createdAt', 'DESC']],
        });
        if(entries.length > 0){
            res.status(201).json({data: {entries: entries}});
        } else {
            const error = new Error('No moods found');
            error.statusCode = 401;
            throw error;
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.getMoodData = async (req, res, next ) => {
    try {
        const emotions = await Emotion.findAll();
        const questions = await MoodQuestion.findAll();
        if(emotions.length <= 0){
            const error = new Error('No emotions found');
            error.statusCode = 401;
            throw error;
        }
        if(questions.length <= 0){
            const error = new Error('No questions found');
            error.statusCode = 401;
            throw error;
        }
        res.status(201).json({data: {
            emotions: emotions,
            questions: questions
        }});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}
exports.getMood = async (req, res, next ) => {
    try {
        // const psy = await Psy.findByPk(req.role.id); 
        // const client = await psy.getClients({
        //     where: {
        //         id: req.params.clientId
        //     },
        // });
        // if(client.length <= 0) {
        //     const error = new Error('Client does not belong to this psychologist');
        //     error.statusCode = 401;
        //     throw error;
        // }
        const startDate = new Date(req.params.moodDate);
        const endDate = new Date(startDate.getTime() + 24 * 60 * 60 *1000);
        console.log(startDate);
        console.log(endDate);
        const entries = await Mood.findAll({
            where: {
                clientId: req.role.id,
                createdAt: {
                    $lt: endDate,
                    $gt: startDate
                }
            }
        })
        if (entries.length > 0) {
            const allEntries  = [];
            await asyncForEach(entries, async entry => {            
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
    // try {
    //     const moodId = req.params.moodId;
    //     const entry = await Mood.findByPk(moodId);
    //     if (entry) {
    //         const questions= await entry.getMoodQuestions();
    //         const emotions= await entry.getEmotions();
    //         res.status(201).json({data: {
    //             entry: entry,
    //             questions: questions,
    //             emotions: emotions
    //         }});
    //     } else {
    //         const error = new Error('An entry with id: '+ moodId +' could not be found');
    //         error.statusCode = 401;
    //         throw error;
    //     }
    // } catch (err) {
    //     if (!err.statusCode) {
    //         err.statusCode = 500;
    //       }
    //       next(err);
    // }
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }