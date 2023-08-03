// const mysql = require('mysql');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

// // const db = mysql.createConnection({
// //   host: 'codebuddiesdb.c9nlci7opfpv.us-east-2.rds.amazonaws.com',
// //   user: 'admin',
// //   password: 'pGRy8i3j6f6sxpN',
// //   database: 'CodeBuddiesDB'
// // });

// // const db = mysql.createConnection({
// //   host: 'localhost',
// //   user: 'root',
// //   password: 'COdebuddi#s',
// //   database: 'CodeBuddiesDB'
// // });

// const users = [
//   {
//     name: 'Hollye',
//     email: 'hollyekedge@gmail.com',
//     username: 'Hollye',
//     password: 'ccc123',
//     is_buddy: true,
//     isAdmin: true
//   },
//   {
//     name: 'Catherine',
//     email: 'catherine.mugnai@gmail.com',
//     username: 'Catherine',
//     password: 'bbb123',
//     is_buddy: true,
//     isAdmin: true
//   },
// ];

// const seedUsers = () => {
//   // Delete existing users
//   const deleteQuery = 'DROP TABLE IF EXISTS users';
//   db.query(deleteQuery, (err, result) => {
//     if (err) throw err;
//     console.log('Dropped users table');

//     // Create users table
//     const createQuery = `
//   CREATE TABLE users (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     googleId VARCHAR(255),
//     is_buddy BOOLEAN DEFAULT FALSE,
//     isAdmin BOOLEAN DEFAULT FALSE,
//     name VARCHAR(100),
//     email VARCHAR(100) UNIQUE NOT NULL,
//     username VARCHAR(50) UNIQUE NOT NULL,
//     password VARCHAR(100) NOT NULL,
//     pfp_url VARCHAR(255),
//     primary_language VARCHAR(50),
//     secondary_language VARCHAR(50)
//   )
// `;
//     db.query(createQuery, (err, result) => {
//       if (err) throw err;
//       console.log('Created users table');

//       // Insert new users
//       users.forEach((user) => {
//         bcrypt.hash(user.password, saltRounds, (err, hashedPassword) => {
//           if (err) throw err;

//           const { name, email, username, is_buddy, isAdmin } = user;
//           const insertQuery =
//             'INSERT INTO users (name, email, username, password, is_buddy, isAdmin) VALUES (?, ?, ?, ?, ?, ?)';

//           db.query(
//             insertQuery,
//             [name, email, username, hashedPassword, is_buddy, isAdmin],
//             (err, result) => {
//               if (err) throw err;
//               console.log('User inserted');
//             }
//           );
//         });
//       });
//     });
//   });
// };

// db.connect((err) => {
//   if (err) throw err;
//   console.log('Connected to the database');

//   seedUsers();
// });

// const checkUsersExistence = () => {
//   users.forEach((user) => {
//     const { email, username } = user;
//     const sql = 'SELECT COUNT(*) AS count FROM users WHERE email = ? OR username = ?';
//     db.query(sql, [email, username], (err, result) => {
//       if (err) throw err;
//       const count = result[0].count;
//       if (count > 0) {
//         console.log(`User with email "${email}" or username "${username}" exists in the database.`);
//       } else {
//         console.log(`User with email "${email}" or username "${username}" does not exist in the database.`);
//       }
//     });
//   });
// };

// checkUsersExistence();

// !--------------------------------- my code below -------------------------------! //

const mysql2 = require('mysql2/promise');
const bcrypt = require('bcrypt');
// const bluebird = require('bluebird');
const saltRounds = 10;

    const db = mysql2.createPool({
      // host: 'localhost',
      // user: 'root',
      // password: 'COdebuddi#s',
      // database: 'CodeBuddiesDB',
      // // Promise: bluebird,
  host: 'codebuddiesdb.c9nlci7opfpv.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'pGRy8i3j6f6sxpN',
  database: 'CodeBuddiesDB'

    });

const dropTables = async () => {
  try {

    // (await db).connect()

    console.log("connected");

    await db.query(`
      DROP TABLE IF EXISTS schedule_events;
    `);
    await db.query(`
      DROP TABLE IF EXISTS schedule;
    `);
    await db.query(`
      DROP TABLE IF EXISTS events;
    `);
    await db.query(`
      DROP TABLE IF EXISTS users;
    `);

    console.log("Finished dropping tables!")
  } catch(error) {
    console.error("Error dropping tables!")
    throw error;
  }
}

// Create users table
const createTables = async () => {
  try{

    await db.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        is_buddy BOOLEAN DEFAULT FALSE,
        isAdmin BOOLEAN DEFAULT FALSE,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        pfp_url VARCHAR(255),
        primary_language VARCHAR(50),
        secondary_language VARCHAR(50)
      );
    `);

    await db.query(`  
      CREATE TABLE events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buddy_one VARCHAR(100) NOT NULL,
        buddy_two VARCHAR(100),
        primary_language VARCHAR(100) NOT NULL,
        secondary_language VARCHAR(100),
        date VARCHAR(100) NOT NULL,
        time VARCHAR(100) NOT NULL,
        spots_available INT NOT NULL,
        meeting_link VARCHAR(255) NOT NULL
      );
    `);

    await db.query(`  
      CREATE TABLE schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id)
      );
    `);

    await db.query(`  
      CREATE TABLE schedule_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        event_id INTEGER REFERENCES events(id)
      );
    `);
      
    console.log("created Tables");  
  } catch(error){
    console.error("error creating tables")
    throw error;
  }
}

async function createUser(user) {
  try {
    
    const {name, email, username, password, is_buddy, isAdmin} = user
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [results,rows,fields] = await db.execute(`
      INSERT INTO users (name, email, username, password, is_buddy, isAdmin) 
      VALUES (?, ?, ?, ?, ?, ?);
    `, [name, email, username, hashedPassword, is_buddy, isAdmin],
    );

    const [data] = await db.execute(`
      SELECT * 
      FROM users
      WHERE username='${username}';`,
    );

    delete data[0].password
    console.log("results:", data); 

  } catch (error) {
    console.error("error adding users");
    throw error;
  }
}

const seedUserData = async () => {


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
      {
        name: 'Friday',
        email: 'i_am_a_cat@gmail.com',
        username: 'Friday',
        password: 'aaa123',
        is_buddy: true,
        isAdmin: true
      },
    ];

    const insertUser = await Promise.all(users.map(createUser))

}


 

async function seedData(){
await dropTables()
await createTables()
await seedUserData()
}

seedData()