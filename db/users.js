const db = require("./db")
const bcrypt = require('bcrypt');
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
        return newUser

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

async function promoteUserToBuddy(userId) {
    try {
        const [results, rows, fields] = await db.execute(`
      UPDATE users
      SET is_buddy = TRUE 
      WHERE id = "${userId}"
    `);
        console.log(results)

        if (results.changedRows >= 1) {
            const [updatedUser] = await db.execute(`
        SELECT * 
        FROM users 
        WHERE id = "${userId}"; 
      `);
            console.log("Promoted User with userId:", userId, "->", updatedUser)
            return updatedUser;

        }
        else {
            console.log("Error promoting user")
            return ("Error promoting user found")
        }

    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function createMessage(sender_id, receiver_id, message_content) {
    try {
      await db.execute(`
        INSERT INTO messages (sender_id, receiver_id, message_content)
        VALUES (?, ?, ?);
      `, [sender_id, receiver_id, message_content]);
  
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message");
      throw error;
    }
  }
  
  async function getMessages(user1_id, user2_id) {
    try {
      const [messages] = await db.execute(`
        SELECT * 
        FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY timestamp ASC;
      `, [user1_id, user2_id, user2_id, user1_id]);
  
      console.log("Messages retrieved successfully", messages);
      return messages;
    } catch (error) {
      console.error("Error retrieving messages");
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
    getMessages
};