const db = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const { createEvent } = require('./events');
const { createSchedule } = require('./schedules');

const dropTables = async () => {
  try {
    console.log("connected");
    await db.query(`
      DROP TABLE IF EXISTS schedule_events;
    `);
    await db.query(`
      DROP TABLE IF EXISTS schedules;
    `);
    await db.query(`
    DROP TABLE IF EXISTS messages;
    `);
    await db.query(`
      DROP TABLE IF EXISTS events;
    `);
    await db.query(`
      DROP TABLE IF EXISTS users;
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
        title VARCHAR(255),
        primary_language VARCHAR(50),
        secondary_language VARCHAR(50),
        buddy_bio VARCHAR(2500), 
        security_question_1 VARCHAR(255),
        security_answer_1 VARCHAR(255),
        security_question_2 VARCHAR(255),
        security_answer_2 VARCHAR(255),
        security_question_3 VARCHAR(255),
        security_answer_3 VARCHAR(255)
      );
    `);

    await db.query(`  
      CREATE TABLE events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buddy_one VARCHAR(100) NOT NULL,
        buddy_two VARCHAR(100) NOT NULL,
        primary_language VARCHAR(100) NOT NULL,
        secondary_language VARCHAR(100),
        date_time DATETIME NOT NULL,
        spots_available INT NOT NULL,
        meeting_link VARCHAR(255) NOT NULL, 
        is_active BOOLEAN DEFAULT TRUE,
        additional_info VARCHAR(255)
      );
    `)

    await db.query(`  
      CREATE TABLE schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id)
      );
    `);

    await db.query(`  
      CREATE TABLE schedule_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        schedule_id INTEGER REFERENCES schedules(id),        
        event_id INTEGER REFERENCES events(id),
        UNIQUE (schedule_id, event_id)
      );
    `);

    await db.query(`
    CREATE TABLE messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message_content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      marked_for_deletion BOOLEAN DEFAULT FALSE,
      deletion_timestamp DATETIME,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );
  `);

  await db.query(`
  CREATE TABLE user_languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    programming_language VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

    console.log("created Tables");
  } catch (error) {
    console.error("error creating tables")
    throw error;
  }
}

async function createUser(user, programmingLanguages) {
  try {
    const { name, email, username, password, is_buddy, isAdmin,
      security_question_1, security_answer_1, security_question_2, security_answer_2, security_question_3, security_answer_3 } = user;

    // Hashing password and security answers
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const hashedAnswer1 = await bcrypt.hash(security_answer_1, saltRounds);
    const hashedAnswer2 = await bcrypt.hash(security_answer_2, saltRounds);
    const hashedAnswer3 = await bcrypt.hash(security_answer_3, saltRounds);

    // Inserting the user into the users table
    await db.execute(`
      INSERT INTO users (name, email, username, password, is_buddy, isAdmin, 
      security_question_1, security_answer_1, security_question_2, security_answer_2, security_question_3, security_answer_3) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [name, email, username, hashedPassword, is_buddy, isAdmin,
      security_question_1, hashedAnswer1, security_question_2, hashedAnswer2, security_question_3, hashedAnswer3]);

    // Fetching the newly created user's ID
    const [data] = await db.execute(`
      SELECT id
      FROM users
      WHERE username = ?;`, [username]);

    const userId = data[0].id;

    // Check if userId is available and then proceed with additional operations
    if (userId) {
      // Inserting programming languages for the user
      for (const language of programmingLanguages) {
        await db.execute(`
          INSERT INTO user_languages (user_id, programming_language)
          VALUES (?, ?);
        `, [userId, language]);
      }
      await createSchedule(userId); // Assuming this function creates an initial schedule for the user
    }

    console.log("Added User and Programming Languages ->:", userId);

  } catch (error) {
    console.error("Error adding user and programming languages:", error);
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
      isAdmin: true,
      security_question_1: 'What is the name of the street where you grew up?',
      security_answer_1: '123 Street',
      security_question_2: 'What is the name of the town where you were born?',
      security_answer_2: 'Example Town',
      security_question_3: 'What was the make of your first mobile phone?',
      security_answer_3: 'Nokia',
      programmingLanguages: ['JavaScript', 'HTML', 'CSS']
    },
    {
      name: 'Catherine',
      email: 'catherine.mugnai@gmail.com',
      username: 'Catherine',
      password: 'bbb123',
      is_buddy: true,
      isAdmin: true,
      security_question_1: 'What is the name of the street where you grew up?',
      security_answer_1: '456 Street',
      security_question_2: 'What is the name of the town where you were born?',
      security_answer_2: 'New York',
      security_question_3: 'What was the make of your first mobile phone?',
      security_answer_3: 'Motorola',
      programmingLanguages: ['JavaScript', 'HTML', 'CSS']
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
      buddy_two: "open",
      primary_language: 'HTML',
      secondary_language: null,
      date_time: '2023-8-31 13:30:00',
      spots_available: 3,
      meeting_link: 'https://us06web.zoom.us/j/88350212695?pwd=YXh5UWk0WTY2QWQ2S2tPS3BBWUxXdz09'
    },
  ];

  await Promise.all(events.map(createEvent))

}

async function seedData() {
  try {
    await dropTables();
    await createTables();
    await seedUserData();
    await seedEventData();
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    db.end();
    console.log("Database connection closed.");
  }
}

seedData();