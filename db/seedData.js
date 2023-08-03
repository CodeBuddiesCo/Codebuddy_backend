const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const db = mysql.createConnection({
  host: 'codebuddiesdb.c9nlci7opfpv.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'pGRy8i3j6f6sxpN',
  database: 'CodeBuddiesDB'
});

const users = [
  {
    name: 'Hollye',
    email: 'hollyekedge@gmail.com',
    username: 'Hollye',
    password: 'ccc123',
    is_buddy: true,
    isAdmin: true
  },
  {
    name: 'Catherine',
    email: 'catherine.mugnai@gmail.com',
    username: 'Catherine',
    password: 'bbb123',
    is_buddy: true,
    isAdmin: true
  },
];

const seedUsers = () => {
  // Delete existing users
  const deleteQuery = 'DROP TABLE IF EXISTS users';
  db.query(deleteQuery, (err, result) => {
    if (err) throw err;
    console.log('Dropped users table');

    // Create users table
    const createQuery = `
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    googleId VARCHAR(255),
    is_buddy BOOLEAN DEFAULT FALSE,
    isAdmin BOOLEAN DEFAULT FALSE,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    pfp_url VARCHAR(255),
    primary_language VARCHAR(50),
    secondary_language VARCHAR(50)
  )
`;
    db.query(createQuery, (err, result) => {
      if (err) throw err;
      console.log('Created users table');

      // Insert new users
      users.forEach((user) => {
        bcrypt.hash(user.password, saltRounds, (err, hashedPassword) => {
          if (err) throw err;

          const { name, email, username, is_buddy, isAdmin } = user;
          const insertQuery =
            'INSERT INTO users (name, email, username, password, is_buddy, isAdmin) VALUES (?, ?, ?, ?, ?, ?)';

          db.query(
            insertQuery,
            [name, email, username, hashedPassword, is_buddy, isAdmin],
            (err, result) => {
              if (err) throw err;
              console.log('User inserted');
            }
          );
        });
      });
    });
  });
};

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database');

  seedUsers();
});

const checkUsersExistence = () => {
  users.forEach((user) => {
    const { email, username } = user;
    const sql = 'SELECT COUNT(*) AS count FROM users WHERE email = ? OR username = ?';
    db.query(sql, [email, username], (err, result) => {
      if (err) throw err;
      const count = result[0].count;
      if (count > 0) {
        console.log(`User with email "${email}" or username "${username}" exists in the database.`);
      } else {
        console.log(`User with email "${email}" or username "${username}" does not exist in the database.`);
      }
    });
  });
};

checkUsersExistence();