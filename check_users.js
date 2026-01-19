const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DATABASE_FILE || './database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Users in DB:', JSON.stringify(rows, null, 2));
    }
    db.close();
});
