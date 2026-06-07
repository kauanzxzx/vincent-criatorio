const mysql = require("mysql2");

const db = mysql.createPool({

    host: process.env.MYSQLHOST,

    user: process.env.MYSQLUSER,

    password: process.env.MYSQLPASSWORD,

    database:
        process.env.MYSQLDATABASE ||
        process.env.MYSQL_DATABASE,

    port: process.env.MYSQLPORT

});

module.exports = db;