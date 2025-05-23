const db = require("./db")
const bcrypt = require('bcrypt');
const { createSchedule } = require("./schedules");
const saltRounds = 10;

async function createUser(user) {
  try {
    const { name, email, username, password,
      security_question_1, security_answer_1, security_question_2, security_answer_2, security_question_3, security_answer_3 } = user;

    // Hash the password and security answers inside the createUser function
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer1 = security_answer_1 ? await bcrypt.hash(security_answer_1, 10) : null;
    const hashedAnswer2 = security_answer_2 ? await bcrypt.hash(security_answer_2, 10) : null;
    const hashedAnswer3 = security_answer_3 ? await bcrypt.hash(security_answer_3, 10) : null;

    await db.execute(`
      INSERT INTO users (name, email, username, password, security_question_1, security_answer_1, security_question_2, security_answer_2, security_question_3, security_answer_3) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [name, email, username, hashedPassword, security_question_1, hashedAnswer1, security_question_2, hashedAnswer2, security_question_3, hashedAnswer3]);

    const [newUser] = await db.execute(`
      SELECT id, name, email, username, is_buddy, isAdmin FROM users WHERE username = ?;
    `, [username]);

    const userId = newUser[0].id;

    if (userId) {
      await createSchedule(userId);
    }

    return newUser[0];

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

async function getAllBuddies() {
  try {
    const [buddyUsers] = await db.execute(`
      SELECT * 
      FROM users 
      WHERE is_buddy = true; 
    `);

    buddyUsers.map((user) => delete user.password)

    console.log("Results from getBuddyUsers function ->", buddyUsers)
    return buddyUsers

  } catch (error) {
    console.error("Error getting buddy users");
    throw error;
  }
}

async function getUserById(id) {
  try {
    console.log(`About to fetch user with id ${id}`);
    // Fetch the user details
    const [userRows] = await db.execute(`
      SELECT id, name, email, username, pfp_url, title, primary_language, secondary_language, buddy_bio, is_buddy, isAdmin
      FROM users
      WHERE id = ?
    `, [id]);

    if (userRows.length === 0) {
      console.log(`No user found with id ${id}`);
      return null;
    }

    const user = userRows[0];
    delete user.password;

    const [languageRows] = await db.execute(`
      SELECT programming_language
      FROM user_languages
      WHERE user_id = ?
    `, [id]);
    console.log("Programming languages fetched for user:", languageRows);

    const programmingLanguages = languageRows.map(row => row.programming_language);
    console.log("Programming languages for user by Id", id, "->", programmingLanguages);

    user.programmingLanguages = programmingLanguages;

    console.log("User by Id", id, "->", user);
    return user;
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

async function getUserByEmail(email) {
  try {
    const [results] = await db.execute(`SELECT * FROM users WHERE email = ?`, [email]);
    console.log("Query result for getUserByEmail:", results);
    
    if (results.length > 0) {
      delete results[0].password;
      return results[0];
    }
    return null;
  } catch (err) {
    console.error("Error in getUserByEmail:", err);
    throw err;
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

async function demoteUserFromBuddy(userId) {
  try {
    const [results] = await db.execute(`
      UPDATE users
      SET is_buddy = FALSE 
      WHERE id = ?
    `, [userId]);

    if (results.changedRows >= 1) {
      const [updatedUser] = await db.execute(`
        SELECT * 
        FROM users 
        WHERE id = ?; 
      `, [userId]);

      console.log("Demoted User with userId:", userId, "->", updatedUser)
      return updatedUser[0]; // Return the individual user object
    } else {
      console.log("Error demoting user")
      return "Error demoting user found";
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
async function updateUserById(userId, updatedInfo, programmingLanguages = null) {
  try {
    if (Object.keys(updatedInfo).length > 0) {
      const entries = Object.entries(updatedInfo).filter(([_, value]) => value != null);
      const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
      const values = entries.map(([_, value]) => value);

      if (entries.length > 0) {
        const query = `UPDATE users SET ${setClause} WHERE id = ?`;
        await db.execute(query, [...values, userId]);
      }
    }

    if (programmingLanguages) {
      await db.execute('DELETE FROM user_languages WHERE user_id = ?', [userId]);

      for (const language of programmingLanguages) {
        await db.execute('INSERT INTO user_languages (user_id, programming_language) VALUES (?, ?)', [userId, language]);
      }
    }

    console.log("User and programming languages updated successfully for user ID:", userId);
  } catch (error) {
    console.error("Error updating user by ID and programming languages:", error);
    throw error;
  }
}

async function updateUserProgrammingLanguages(userId, programmingLanguages) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('DELETE FROM user_languages WHERE user_id = ?', [userId]);

    for (const language of programmingLanguages) {
      await connection.query('INSERT INTO user_languages (user_id, programming_language) VALUES (?, ?)', [userId, language]);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Retrieve security questions
async function getSecurityQuestions(username) {
  try {
    const [user] = await db.execute(`
      SELECT security_question_1, security_question_2, security_question_3 
      FROM users 
      WHERE username = ?;
    `, [username]);

    if (user.length === 0) {
      throw new Error('User not found');
    }

    return user[0];
  } catch (error) {
    console.error("Error retrieving security questions:", error);
    throw error;
  }
}

// Verify Security Answers
async function verifySecurityAnswers(username, answer1, answer2, answer3) {
  try {
    const [user] = await db.execute(`
      SELECT security_answer_1, security_answer_2, security_answer_3 
      FROM users 
      WHERE username = ?;
    `, [username]);
    console.log('Provided answers:', { answer1, answer2, answer3 });
    console.log('Hashed answers from DB:', {
      security_answer_1: user[0].security_answer_1,
      security_answer_2: user[0].security_answer_2,
      security_answer_3: user[0].security_answer_3,
    });

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const isAnswer1Correct = await bcrypt.compare(answer1, user[0].security_answer_1);
    const isAnswer2Correct = await bcrypt.compare(answer2, user[0].security_answer_2);
    const isAnswer3Correct = await bcrypt.compare(answer3, user[0].security_answer_3);
    if (!answer1 || !user[0].security_answer_1 ||
      !answer2 || !user[0].security_answer_2 ||
      !answer3 || !user[0].security_answer_3) {
      throw new Error('Invalid answer or security answer not set');
    }

    return isAnswer1Correct && isAnswer2Correct && isAnswer3Correct;
  } catch (error) {
    console.error("Error verifying security answers:", error);
    throw error;
  }
}

// Reset Password
async function resetPassword(username, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.execute(`
      UPDATE users 
      SET password = ? 
      WHERE username = ?;
    `, [hashedPassword, username]);

    console.log("Password has been reset successfully");
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
}

// Update Security Questions
async function updateSecurityQuestionsAndAnswers(userId, security_question_1, security_answer_1, security_question_2, security_answer_2, security_question_3, security_answer_3) {
  try {
    const hashedAnswer1 = security_answer_1 ? await bcrypt.hash(security_answer_1, saltRounds) : null;
    const hashedAnswer2 = security_answer_2 ? await bcrypt.hash(security_answer_2, saltRounds) : null;
    const hashedAnswer3 = security_answer_3 ? await bcrypt.hash(security_answer_3, saltRounds) : null;

    const [result] = await db.execute(`
      UPDATE users 
      SET security_question_1 = ?, security_answer_1 = ?,
          security_question_2 = ?, security_answer_2 = ?,
          security_question_3 = ?, security_answer_3 = ?
      WHERE id = ?;
    `, [security_question_1, hashedAnswer1, security_question_2, hashedAnswer2, security_question_3, hashedAnswer3, userId]);

    console.log("Attempted to update security questions and answers for user ID:", userId);

    if (result.affectedRows > 0) {
      console.log("Security questions and answers updated successfully for user ID:", userId);
      return true;
    } else {
      console.log("No user found with ID:", userId);
      return false;
    }
  } catch (error) {
    console.error("Error updating security questions and answers:", error);
    throw error;
  }
}

// Fetch User Follows

async function getUsersFollowedByUser(userId) {
  try {
    const [followedUsers] = await db.execute(`
      SELECT u.id, u.name, u.email, u.username, u.pfp_url, u.title, u.primary_language, u.secondary_language, u.buddy_bio, u.is_buddy, u.isAdmin
      FROM follows f
      JOIN users u ON f.followee_id = u.id
      WHERE f.follower_id = ?;
    `, [userId]);

    console.log("Users followed by user ID", userId, "->", followedUsers);
    return followedUsers;
  } catch (error) {
    console.error("Error getting users followed by user ID", userId, error);
    throw error;
  }
}

// Follow User
async function followUser(followerId, followeeId) {
  try {
    await db.execute(`
      INSERT INTO follows (follower_id, followee_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE follower_id = follower_id;
    `, [followerId, followeeId]);

    console.log(`User with ID ${followerId} is now following user with ID ${followeeId}`);
    return { success: true, message: 'Follow successful' };
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
}

// Unfollow User
async function unfollowUser(followerId, followeeId) {
  try {
    await db.execute(`
      DELETE FROM follows 
      WHERE follower_id = ? AND followee_id = ?;
    `, [followerId, followeeId]);

    console.log(`User with ID ${followerId} has unfollowed user with ID ${followeeId}`);
    return { success: true, message: 'Unfollow successful' };
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
}

 getUsersFollowedByUser(1);

module.exports = {
  getAllUsers,
  getAllBuddies,
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
  updateUserById,
  updateUserProgrammingLanguages,
  getSecurityQuestions,
  verifySecurityAnswers,
  resetPassword,
  updateSecurityQuestionsAndAnswers,
  demoteUserFromBuddy,
  getUsersFollowedByUser,
  followUser,
  unfollowUser,
  getUserByEmail,
};