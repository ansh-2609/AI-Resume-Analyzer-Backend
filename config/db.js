const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Dean1000%',
    database: 'resume_analyzer',
});

module.exports = pool.promise();