const mysql = require("mysql2");

const db = mysql.createPool({

    host: "localhost",

    user: "root",

    password: "Kau@3007",

    database: "vincent_criatorio"

});

module.exports = db;