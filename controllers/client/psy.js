const Client = require('./../../models/client');
const User = require('./../../models/user');
const Psy = require('./../../models/psychologist');
const Invite = require('./../../models/invite');


exports.getInvites = async (req, res, next) => {
    try {
        const client = await Client.findByPk(req.role.id);
        const user = await User.findByPk(client.userId);
        const invites = await Invite.findAll({
            where:{
                clientEmail: user.email
            }
        })
        if(invites.length <= 0) {
            const error = new Error('There are no new invites');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({
            data: invites
        })

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
    
}
exports.getPsy = async (req, res, next) => {
    try {
        //TODO
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}
exports.answerInvite = async (req, res, next) => {
    try {
        const invite = await Invite.findByPk(req.body.inviteId);
        if(!invite) {
            const error = new Error('Invite with id: ' + req.body.inviteId + ' has not been found');
            error.statusCode = 401;
            throw error;
        }
        const client = await Client.findByPk(req.role.id);
        const psy = await Psy.findByPk(invite.psychologistId);
        if(req.body.approved){
            await client.addPsychologist(psy);
            const test = await client.getPsychologists();
        }
        await invite.destroy();
        res.status(200).json({
            message: req.body.approved?'The Invite has been approved!':'The Invite has been rejected!',
            approved: req.body.approved
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}

exports.removePsy = async (req, res, next) => {
    try {
        //TODO
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); 
    }
}