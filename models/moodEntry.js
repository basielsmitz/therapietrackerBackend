const Sequelize = require('sequelize');

const uuid = require('uuid/v4')

const sequelize = require('../util/database');

const MoodEntry = sequelize.define('moodEntry', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => uuid()
  },
  mood: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  thought: {
    type: Sequelize.STRING,
    allowNull: true,
  },

})

module.exports = MoodEntry;