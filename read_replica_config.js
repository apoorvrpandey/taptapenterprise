const dotenv = require('dotenv');

dotenv.config();

// db_config.js
module.exports = {
    user:  process.env.READ_USER,
    host:  process.env.READ_HOST,
    database:  process.env.READ_DATABASE,
    password:  process.env.READ_PASSWORD,
    port:  process.env.READ_PORT, // Change this port if necessary
  };
  