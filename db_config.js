const dotenv = require('dotenv');

dotenv.config();

// db_config.js

module.exports = {
  user:  process.env.DB_USER,
    host:  process.env.DB_HOST,
    database:  process.env.DB_DATABASE,
    password:  process.env.DB_PASSWORD,
    port:  process.env.DB_PORT, // Change this port if necessary
};
