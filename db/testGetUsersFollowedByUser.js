// testGetUsersFollowedByUser.js
const mysql = require('mysql2/promise');

const db = require("./db")


// Function to test
async function getUsersFollowedByUser(userId) {
  try {
    const [followedUsers] = await db.execute(`
      SELECT u.id, u.name, u.email, u.username, u.is_buddy, u.isAdmin
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

// Test function call
(async () => {
  try {
    const userId = 1; // Replace with the user ID you want to test
    const result = await getUsersFollowedByUser(userId);
    console.log('Test Result:', result);
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    await db.end(); // Close the database connection
  }
})();
