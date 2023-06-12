const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'codebuddiesdb.c9nlci7opfpv.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'pGRy8i3j6f6sxpN',
  database: 'CodeBuddiesDB'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database');
});

let createUsersTable = `
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    is_buddy BOOLEAN DEFAULT FALSE,
    isAdmin BOOLEAN DEFAULT FALSE;
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    pfp_url VARCHAR(255),
    primary_language VARCHAR(50),
    secondary_language VARCHAR(50)
);
`;

db.query(createUsersTable, (err, result) => {
  if (err) throw err;
  console.log('Users table created');
});

db.end();
