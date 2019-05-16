const Sequelize = require('sequelize');

const uuid = require('uuid/v4')

const sequelize = require('../util/database');

const MoodAnswer = sequelize.define('moodAnswer', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => uuid()
  },
  value: {
    type: Sequelize.STRING,
    allowNull: false,
  },
})

module.exports = MoodAnswer;