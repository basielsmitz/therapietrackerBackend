const Sequelize = require('sequelize');

const uuid = require('uuid/v4')

const sequelize = require('../util/database');

const User = sequelize.define('user', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => uuid()
    
  },
  email: Sequelize.STRING,
  password: Sequelize.STRING,
  role: {
    type: Sequelize.STRING,
    defaultValue: 'client',
    validate: {
      isIn: [['client', 'psychologist']],
    }
  }
})

module.exports = User;