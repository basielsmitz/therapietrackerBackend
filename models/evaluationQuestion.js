const Sequelize = require('sequelize');

const uuid = require('uuid/v4')

const sequelize = require('../util/database');

const EvaluationQuestion = sequelize.define('evaluationQuestion', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => uuid()
  },
  question: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  type: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isIn: [['ja/nee', 'range', 'select', 'text']],
    }
  },
  data: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
})

module.exports = EvaluationQuestion;