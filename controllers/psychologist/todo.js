const Psy = require('../../models/psychologist');
const ToDo = require('../../models/todo')

exports.addToDo = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id);
        const entry = await psy.createTodo({
            name: req.body.name,
            description: req.body.description,
            date: req.body.date,
            time: req.body.time,
            status: false,
        });
        if (entry) {
            res.status(201).json({message: 'new ToDo created!', data: {
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
exports.getAllTodos = async (req, res, next) => {
    try {
        const psy = await Psy.findByPk(req.role.id);
        const todos = await psy.getTodos();
        if (todos.length <= 0) {
            res.status(204).json({
                message: 'No ToDo\'s found',
                data: []
            });  
        } 
        res.status(201).json({ data: todos});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
        next(err);
    }
}
exports.getTodo = async (req, res, next) => {
    try {
        const todo = await ToDo.findByPk(req.params.todoId);
        if(!todo){
            const error = new Error('No ToDo with id: ' + req.params.todoId + ' found');
                error.statusCode = 401;
                throw error;
        }

        res.status(200).json({data: todo});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
        next(err);
    }    
}
exports.deleteTodo = async (req, res, next) => {
    try {
        const todo = await ToDo.findByPk(req.params.todoId);
        if(!todo){
            const error = new Error('No ToDo with id: ' + req.params.todoId + ' found');
                error.statusCode = 401;
                throw error;
        }
        todo.destroy();
        res.status(202).json({message: 'ToDo with id: ' + req.params.todoId + ' has been removed'});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
        next(err);
    }   
}
exports.todoStatusChange = async (req, res, next) => {
    try {
        const todo = await ToDo.findByPk(req.params.todoId);
        if(!todo){
            const error = new Error('No ToDo with id: ' + req.params.todoId + ' found');
                error.statusCode = 401;
                throw error;
        }
        todo.status = !todo.status;
        await todo.save();
        res.status(202).json({
            message: 'ToDo with id: ' + req.params.todoId + ' has been updated',
            data: todo
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
        next(err);
    }   }
