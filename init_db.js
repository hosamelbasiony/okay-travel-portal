const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DATABASE_FILE || './database.sqlite');
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // SQLite's exec can run multiple statements
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing database:', err.message);
        } else {
            console.log('Database re-initialized with Arabic sample data.');
        }
        db.close();
    });
});
