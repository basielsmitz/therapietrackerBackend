const Sequelize = require('sequelize');

const uuid = require('uuid/v4')

const sequelize = require('../util/database');

const Invite = sequelize.define('invite', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => uuid()
  },
  clientName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  clientEmail: {
    type: Sequelize.STRING,
    allowNull: false,
  },
})

module.exports = Invite;