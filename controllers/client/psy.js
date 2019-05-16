const Client = require('./../../models/client');
const User = require('./../../models/user');
const Psy = require('./../../models/psychologist');
const Invite = require('./../../models/invite');
const Contact = require('./../../models/contact');

const aFE = require('./../../util/asyncForEach');

exports.getInvites = async (req, res, next) => {
    try {
        const client = await Client.findByPk(req.role.id);
        const user = await User.findByPk(client.userId);
        const invites = await Invite.findAll({
            where:{
                clientEmail: user.email
            },
            raw: true
        })
        if(invites.length <= 0) {
            res.status(204).json({
                message: 'There are no invites',
                data: []
            });  
        }
        aFE.asyncForEach(invites, async invite => {
            const psy = await Psy.findByPk(invite.psychologistId, {
                raw: true,
            });
            console.log(psy); 
            const contact = await Contact.findOne({
                where: {
                    userId: psy.userId
                }
            });
            psy.contact = contact
            invite.psy = psy;
            if(invite.id === invites[invites.length -1].id) {
                res.status(200).json({
                    data: invites
                })
            }
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
        const client = await Client.findByPk(req.role.id);
        const test = await client.getPsychologists();
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
            error.statusCode = 404;
            throw error;
        }
        const client = await Client.findByPk(req.role.id);
        const psy = await Psy.findByPk(invite.psychologistId);
        if(req.body.approved){
            await client.addPsychologist(psy);
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