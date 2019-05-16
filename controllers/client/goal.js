const Client = require('../../models/client');
const Goal = require('../../models/goal')

exports.addGoal = async (req, res, next) => {
    try {
        const client = await Client.findByPk(req.role.id);
        const entry = await client.createGoal({
            title: req.body.title,
            description: req.body.description,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
        });
        if (entry) {
            res.status(201).json({message: 'new goal created!', data: {
                entry: entry
            }});
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
        next(err);
    }
}
exports.getGoals = async (req, res, next) => {
    try {
        const client = await Client.findByPk(req.role.id);
        const goals = await client.getGoals();
        if (goals.length <= 0) {
            res.status(204).json({
                message: 'There are no goals yet',
                data: []
            });  
        }
        res.status(200).json({data: goals});

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
        next(err);
    }
}
exports.getGoal = async (req, res, next) => {
    try {
        const goal = await Goal.findByPk(req.params.goalId);
        if(!goal) {
            const error = new Error('There are no goal with id: ' + req.params.goalId);
            error.statusCode = 404;
            throw error;
        }
        res.status(201).json({data: goal});

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
        next(err);
    }
}
exports.goalStatusChange = async (req, res, next) => {
    try {
       const goal = await Goal.findByPk(req.params.goalId);
        if(!goal) {
            const error = new Error('There are no goal with id: ' + req.params.goalId);
            error.statusCode = 404;
            throw error;
        }
        let end = new Date(goal.endDate);
        end = end.getTime();
        let now = new Date();
        now = now.getTime();
        if( now > end && goal.status && end !== 0 ) {
            res.status(202).json({
                message:'Deadline has been reached, Goal has been completed. goal id: ' + req.params.goalId,
                data: goal
            })
            next();
        } else {
            goal.status = !goal.status;
            goal.save();
            res.status(201).json({message: 'goal with id: ' + req.params.goalId + ' has been updated', data: goal});
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}

exports.deleteGoal = async (req, res, next) => {
    try {
       const goal = await Goal.findByPk(req.params.goalId);
        if(!goal) {
            const error = new Error('There are no goal with id: ' + req.params.goalId);
            error.statusCode = 401;
            throw error;
        }
        
        goal.destroy();
        res.status(202).json({message: 'goal with id: ' + req.params.goalId + ' has been deleted'});

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
}