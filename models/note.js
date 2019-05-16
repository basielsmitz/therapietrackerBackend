const Sequelize = require('sequelize');

const uuid = require('uuid/v4')

const sequelize = require('../util/database');

const Note = sequelize.define('note', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => uuid()
  },
  body: {
    type: Sequelize.TEXT,
    allowNull: false,
  }
})

module.exports = Note;