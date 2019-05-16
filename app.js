const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const sequelize = require('./util/database');
const aFE = require('./util/asyncForEach');

//model imports
const User = require('./models/user');
const Contact = require('./models/contact');

const Client = require('./models/client');
const Goal = require('./models/goal');
const MoodDay = require('./models/moodDay');
const MoodEntry = require('./models/moodEntry');
const Emotion = require('./models/emotion');
const MoodQuestion = require('./models/moodQuestion');
const MoodAnswer = require('./models/moodAnswer');
const EvaluationAnswer = require('./models/evaluationAnswer');

const Psy = require('./models/psychologist');
const Note = require('./models/note');
const Invite = require('./models/invite');
const Todo = require('./models/todo');
const Session = require('./models/session');
const QuestionList = require('./models/questionList');
const EvaluationQuestion = require('./models/evaluationQuestion');

const ClientPsy = require('./models/clientPsy');
const EmotionEntry = require('./models/emotionEntry');
const ListSession = require('./models/listSession');
const SessionClient = require('./models/sessionClient');

// route imports
const authRoutes = require('./routes/auth');
const psyRoutes = require('./routes/psy');
const clientRoutes = require('./routes/client');

const app = express();

app.use(bodyParser.json());

// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', 'http://localhost:8100')
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT,  PATCH, DELETE');
//     res.header('Access-Control-Allow-headers', 'Content-Type, Authorization');
//     next();
// });

app.use( (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-requested-With, Content-Type, Accep, Authorization");
    if(req.method === "OPTIONS"){
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
      return res.status(200).json({});
    }
    next();
  });

//routes
app.use('/', (req, res, next) => {
    res.send('<marquee>server is running</marquee>')
})
app.use('/auth', authRoutes);
app.use('/client', clientRoutes);
app.use('/psy', psyRoutes);

//relationships
Client.belongsTo(User);
User.hasOne(Client);
Client.belongsToMany(Psy, { through: ClientPsy });
Client.hasMany(Goal);
Client.hasMany(MoodDay);
Client.hasMany(MoodEntry);
Client.hasMany(EvaluationAnswer);
//Client.belongsToMany(Session, {through: SessionClient});

Psy.belongsTo(User);
User.hasOne(Psy);
Psy.belongsToMany(Client, { through: ClientPsy });
Psy.hasMany(Invite);
Psy.hasMany(Session);
Psy.hasMany(QuestionList);
Psy.hasMany(Todo);
Psy.hasMany(Note);

Emotion.belongsToMany(MoodEntry, { through: EmotionEntry });
MoodEntry.belongsToMany(Emotion, { through: EmotionEntry });

EvaluationAnswer.belongsTo(EvaluationQuestion);
EvaluationAnswer.belongsTo(Client);
EvaluationAnswer.belongsTo(Session);

QuestionList.hasMany(EvaluationQuestion);
EvaluationQuestion.belongsTo(QuestionList);
QuestionList.belongsTo(Psy);

QuestionList.belongsToMany(Session, { through: ListSession });
Session.belongsToMany(QuestionList, { through: ListSession });

Goal.belongsTo(Client);

Invite.belongsTo(Psy);

MoodDay.belongsTo(Client);
MoodDay.hasMany(MoodEntry);

MoodEntry.belongsTo(MoodDay);
MoodQuestion.belongsToMany(MoodEntry, {through: MoodAnswer});
MoodEntry.belongsToMany(MoodQuestion, {through: MoodAnswer});

Note.belongsTo(Psy);
Note.belongsTo(Session);
Note.belongsTo(Client);

Session.hasMany(QuestionList);
Session.belongsTo(Psy)
Client.hasMany(Session);

Todo.belongsTo(Psy);

User.hasOne(Contact);
Contact.belongsTo(User);

//errorhandler
app.use((error, req, res, next) => {
    console.log(error)
     const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({message: message, errors: error});
})



//connection
// sequelize.sync({ force: true })
sequelize.sync()
.then(result => {
    startingData();
    app.listen(3000);

}) 
.catch(err => console.error(err));

const startingData = async () => {
    const emotions = [
        {
            title: 'Boos',
            description: 'Boos'
        },
        {
            title: 'Opgelaten',
            description: 'Opgelaten'
        },
        {
            title: 'Geërgerd',
            description: 'Geërgerd'
        },
        {
            title: 'Gespannen',
            description: 'Gespannen'
        },
        {
            title: 'Verlangend',
            description: 'Verlangend'
        },
        {
            title: 'Kwetsbaar',
            description: 'Kwetsbaar'
        },
        {
            title: 'Afwezig',
            description: 'Afwezig'
        },
        {
            title: 'Bang',
            description: 'Bang'
        },
        {
            title: 'Onrustig',
            description: 'Onrustig'
        },
        {
            title: 'Pijn',
            description: 'Pijn'
        },
        {
            title: 'Treurig',
            description: 'Treurig'
        },
        {
            title: 'Afkeer',
            description: 'Afkeer'
        },
        {
            title: 'Verdriet',
            description: 'Verdriet'
        },
        {
            title: 'Vermoeid',
            description: 'Vermoeid'
        },
        {
            title: 'Verward',
            description: 'Verward'
        }
    ]
    const moodQuestions = [
        {
            question: 'Voelt u zich hopeloos?', 
            description: '/', 
            type: 'ja/nee'
        },
        {
            question: 'Voelt u zich kalm?', 
            description: 'test2', 
            type: 'ja/nee'
        },
        {
            question: 'Waar verlang je naar?', 
            description: '/', 
            type: 'text'
        },
        {
            question: 'Kies een kleur', 
            description: 'test2', 
            type: 'select',
            data: JSON.stringify({
                options: [
                    'Rood',
                    'Blauw',
                    'Groen',
                    'Geel',
                ]
            })
        },
        {
            question: 'Kan u zich concentreren?', 
            description: '/', 
            type: 'ja/nee'
        },
        {
            question: 'Je bent productief bezig', 
            description: '/', 
            type: 'range',
            data: JSON.stringify({
                value: '5',
                labelMin: 'Niet akkoord',
                labelMax: 'Akkoord'
            })
        }
    ]
        //add emotions to db
        // await aFE.asyncForEach(emotions, async (emotion) => {
        //     const dbEmotion = await Emotion.findOne({
        //         where: emotion
        //     });
        //     if(!dbEmotion) {
        //         await Emotion.create(emotion);
        //     } else {
        //         console.log('emotionExists');
        //     }
        // })
    
        // //add questions to db
        // await aFE.asyncForEach(moodQuestions, async (question) => {
        //     await MoodQuestion.create(question);
        // })
        // await aFE.asyncForEach(moodQuestions, async (question) => {
        //     const dbQuestion = await MoodQuestion.findOne({
        //         where: question
        //     });
        //     console.log('ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddbquestion')
        //     if(!dbQuestion) {
        //         await MoodQuestion.create(question);
        //     } else {
        //         console.log('questionExists');
        //     }
        // })
}