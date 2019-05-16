const Sequelize = require('sequelize');

const uuid = require('uuid/v4')

const sequelize = require('../util/database');

const ListSession = sequelize.define('listSession', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => uuid()
  },
})

module.exports = ListSession;