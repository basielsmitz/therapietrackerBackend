const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.SCHEMA, process.env.DB_USER, process.env.DB_PW, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST
});

module.exports = sequelize;