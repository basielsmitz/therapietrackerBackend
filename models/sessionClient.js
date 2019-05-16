const Sequelize = require('sequelize');

const uuid = require('uuid/v4')

const sequelize = require('../util/database');

const SessionClient = sequelize.define('sessionClient', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => uuid()
  },
})

module.exports = SessionClient;