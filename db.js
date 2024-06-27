const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'msg_user',
    password: 'KtrP2sT379Ap!',
    database: 'msg'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connecté à la base de données MySQL');
});

module.exports = db;