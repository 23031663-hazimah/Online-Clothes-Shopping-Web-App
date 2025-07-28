const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'c237-all.mysql.database.azure.com',
  user: 'c237admin',
  password: 'c2372025!',
  database: 'C237_010_23031663',
  port: 3306,
  ssl: {
    rejectUnauthorized: true
  }
});

db.connect((err) => {
  if (err) {
    console.error('❌ Failed to connect to Azure:', err);
  } else {
    console.log('✅ Connected to Azure MySQL as Hazimah');
  }
});

module.exports = db;
