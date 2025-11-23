// src/db.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

// CASE 1: Cloud Mode (Render)
if (process.env.DB_URL) {
  sequelize = new Sequelize(process.env.DB_URL, {
    dialect: "postgres", // <--- This line fixes your error!
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
}
// CASE 2: Local Mode (Your Laptop/IDE)
else {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false,
  });
}

module.exports = sequelize;
