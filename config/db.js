const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    // host: 'localhost',
    // user: 'root',
    // password: 'Dean1000%',
    // database: 'resume_analyzer',

    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

module.exports = pool.promise();