const Sequelize = require('sequelize');

const uuid = require('uuid/v4')

const sequelize = require('../util/database');

const MoodDay = sequelize.define('moodDay', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => uuid()
  },
  date: {
    type: Sequelize.DATE,
    allowNull: false,
  },
})

module.exports = MoodDay;