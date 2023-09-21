const db = require("./db")
const bcrypt = require('bcrypt');
const { createSchedule } = require("./schedules");
const saltRounds = 10;


async function createUser(user) {
  try {
    const { name, email, username, hashedPassword } = user
    const [results, rows, fields] = await db.execute(`
      INSERT INTO users (name, email, username, password) 
      VALUES (?, ?, ?, ?);
      `, [name, email, username, hashedPassword],
    );

    const [newUser] = await db.execute(`
      SELECT * 
      FROM users
      WHERE username='${username}';`,
    );

    delete newUser[0].password;
    console.log("Added User Details ->:", newUser);

    const userId = newUser[0].id;

    if (userId) {
      await createSchedule(userId);
    }

    return newUser;

  } catch (error) {
    console.error("error adding users");
    throw error;
  }
}

async function getAllUsers() {
  try {
    const [allUsers] = await db.execute(`
      SELECT * 
      FROM users; 
    `);

    allUsers.map((user) => delete user.password)

    console.log("Results from getAllUsers function ->", allUsers)
    return allUsers

  } catch (error) {
    console.error("error getting all users");
    throw error;
  }
}

async function getUserById(id) {

  try {

    const [user] = await db.execute(`
      SELECT *
      FROM users
      WHERE id = "${id}";`
    );

    delete user[0].password
    console.log("User by Id", id, "->", user);
    return user[0];

  } catch (error) {
    console.error("Error getting user by Id", id);
    throw error;
  }

}

async function getUserbyUserName(username) {
  try {
    const [userByUserName] = await db.execute(`
        SELECT * 
        FROM users 
        WHERE username = ?; 
      `, [username]);

    if (userByUserName[0]) {
      console.log("User By UserName:", username, "->", userByUserName);
      return userByUserName;
    } else {
      return "Username is not registered";
    }
  } catch (error) {
    console.error("error getting user by username", error);
    throw error;
  }
}

async function getUserbyUserNameOrEmail(username, email) {
  try {
    const [userByUserNameOrEmail] = await db.execute(`
      SELECT * 
      FROM users 
      WHERE username = "${username}" 
      OR email = "${email}"; 
    `);

    if (userByUserNameOrEmail[0]) {
      delete userByUserNameOrEmail[0].password
      if (userByUserNameOrEmail[1]) {
        delete userByUserNameOrEmail[1].password
      }
      console.log("User By UserName:", username, ", or email:", email, "->", userByUserNameOrEmail)
      return userByUserNameOrEmail;
    } else {
      return ("Username or email ok to use")
    }

  } catch (error) {
    console.error("error getting user by username or email");
    throw error;
  }
}

async function promoteUserToBuddy(userId) {
  try {
    const [results] = await db.execute(`
      UPDATE users
      SET is_buddy = TRUE 
      WHERE id = ?
    `, [userId]);

    if (results.changedRows >= 1) {
      const [updatedUser] = await db.execute(`
        SELECT * 
        FROM users 
        WHERE id = ?; 
      `, [userId]);

      console.log("Promoted User with userId:", userId, "->", updatedUser)
      return updatedUser[0]; // Return the individual user object
    } else {
      console.log("Error promoting user")
      return "Error promoting user found";
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// async function getAllMessages() {
//     try {
//         const [messages] = await db.execute(`
//         SELECT *
//         FROM messages;
//         `);
//         console.log(messages);
//         return messages;
//     } catch (error) {
//         console.error("Error retrieving messages");
//         throw error;
//     }
// }

async function createMessage(sender_id, receiver_id, message_content) {
  try {
    await db.execute(`
      INSERT INTO messages (sender_id, receiver_id, message_content)
      VALUES (?, ?, ?);
    `, [sender_id, receiver_id, message_content]);

    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error sending message:");
    throw error;
  }
}

async function getMessagesForUser(user_id) {
  try {
    const [messages] = await db.execute(`
      SELECT m.id, 
      m.sender_id, 
      m.receiver_id, 
      m.message_content, 
      m.timestamp, 
      m.marked_for_deletion,
      u.username as sender_username, 
      u.name as sender_name,
      u.is_buddy as sender_is_buddy
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.receiver_id = ?
        ORDER BY m.timestamp ASC;
      `, [user_id]);

    console.log("Messages retrieved successfully", messages);
    return messages;
  } catch (error) {
    console.error("Error retrieving messages");
    throw error;
  }
}

// Mark a message as deleted
async function markMessageAsDeleted(messageId) {
  try {
    await db.execute(`
      UPDATE messages
      SET marked_for_deletion = TRUE
      WHERE id = ?;
    `, [messageId]);
    console.log("Marked message as deleted");
  } catch (error) {
    console.error("Error marking message as deleted:", error);
    throw error;
  }
}

// Delete old marked messages
async function deleteOldMarkedMessages() {
  try {
    await db.execute(`
      DELETE FROM messages
      WHERE marked_for_deletion = TRUE AND timestamp < NOW() - INTERVAL 1 WEEK
    `);
    console.log("Old marked messages deleted successfully");
  } catch (error) {
    console.error("Error deleting old marked messages:", error);
    throw error;
  }
}

// Fetch soft deleted messages for a user
async function getDeletedMessagesForUser(user_id) {
  try {
    const [messages] = await db.execute(`
      SELECT messages.*, users.username as sender_username, users.name as sender_name
      FROM messages 
      JOIN users ON messages.sender_id = users.id
      WHERE receiver_id = ? AND marked_for_deletion = 1
      AND timestamp >= NOW() - INTERVAL 1 WEEK
      ORDER BY timestamp ASC;
    `, [user_id]);
    console.log("Deleted messages retrieved successfully");
    return messages;
  } catch (error) {
    console.error("Error retrieving deleted messages");
    throw error;
  }
}

// Update user info by ID
async function updateUserById(userId, updatedInfo) {
  try {
    const { name, email, username, pfp_url, primary_language, secondary_language, buddy_bio } = updatedInfo;
    await db.execute(`
      UPDATE users SET
      name = ?,
      email = ?,
      username = ?,
      pfp_url = ?,
      primary_language = ?,
      secondary_language = ?,
      buddy_bio = ?
      WHERE id = ?
    `, [name, email, username, pfp_url, primary_language, secondary_language, buddy_bio, userId]);
  } catch (error) {
    console.error("Error updating user by ID");
    throw error;
  }
}

module.exports = {
  getAllUsers,
  createUser,
  getUserbyUserNameOrEmail,
  getUserbyUserName,
  promoteUserToBuddy,
  getUserById,
  createMessage,
  getMessagesForUser,
  markMessageAsDeleted,
  deleteOldMarkedMessages,
  getDeletedMessagesForUser,
  updateUserById
};