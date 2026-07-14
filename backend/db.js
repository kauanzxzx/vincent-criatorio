const mysql = require("mysql2");

const db = mysql.createPool({

    host: process.env.MYSQLHOST,

    user: process.env.MYSQLUSER,

    password: process.env.MYSQLPASSWORD,

    database:
        process.env.MYSQLDATABASE ||
        process.env.MYSQL_DATABASE,

    port: process.env.MYSQLPORT,

    ssl: {
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0

});


db.getConnection((erro, connection) => {

    if (erro) {

        console.error("ERRO AO CONECTAR NO MYSQL:");
        console.error(erro);

        return;
    }

    console.log("Banco conectado com sucesso!");

    connection.release();

});


module.exports = db;

const db = require("./db");

db.query("SELECT DATABASE() AS banco", (err, result) => {

    if (err) {
        console.log("Erro ao consultar banco:");
        console.log(err);
        return;
    }

    console.log("Banco conectado:");
    console.log(result);

});