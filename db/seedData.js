const db = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const { createEvent } = require('./events');

const dropTables = async () => {
  try {
    console.log("connected");
    await db.query(`
    DROP TABLE IF EXISTS messages;
    `);
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
    await db.query(`
    DROP TABLE IF EXISTS messages;
  `);

    console.log("Finished dropping tables!")
  } catch (error) {
    console.error("Error dropping tables!")
    throw error;
  }
}

const createTables = async () => {
  try {

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
        secondary_language VARCHAR(50),
        buddy_bio VARCHAR(2500)
      );
    `);

    await db.query(`  
      CREATE TABLE events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buddy_one VARCHAR(100) NOT NULL,
        buddy_two VARCHAR(100),
        primary_language VARCHAR(100) NOT NULL,
        secondary_language VARCHAR(100),
        date_time DATETIME NOT NULL,
        spots_available INT NOT NULL,
        meeting_link VARCHAR(255) NOT NULL
      );
    `)

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

    await db.query(`
    CREATE TABLE messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );
  `);

    console.log("created Tables");
  } catch (error) {
    console.error("error creating tables")
    throw error;
  }
}

async function createUser(user) {
  try {

    const { name, email, username, password, is_buddy, isAdmin } = user
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [results, rows, fields] = await db.execute(`
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
    console.log("Added User Details ->:", data);

  } catch (error) {
    console.error("error adding users");
    throw error;
  }
}

async function seedUserData() {

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

  await Promise.all(users.map(createUser))

}

async function seedEventData() {

  const events = [
    {
      buddy_one: 'Catherine',
      buddy_two: 'Hollye',
      primary_language: 'JavaScript',
      secondary_language: null,
      date_time: '2023-8-18 19:00:00',
      spots_available: 3,
      meeting_link: 'https://us06web.zoom.us/j/88350212230?pwd=YXh5UWk0WTY2QWQ2S2tPS3BBWUxXdz09'
    },
    {
      buddy_one: 'Hollye',
      buddy_two: null,
      primary_language: 'HTML',
      secondary_language: null,
      date_time: '2023-8-22 13:30:00',
      spots_available: 3,
      meeting_link: 'https://us06web.zoom.us/j/88350212695?pwd=YXh5UWk0WTY2QWQ2S2tPS3BBWUxXdz09'
    },
  ];

  await Promise.all(events.map(createEvent))

}

async function seedData() {
  await dropTables()
  await createTables()
  await seedUserData()
  await seedEventData()
}

seedData()