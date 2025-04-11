const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/db');
const { requireUser, requireAdmin, validateToken, generateResetToken, sendPasswordResetEmail } = require('./utils');
const {
  getUserbyUserNameOrEmail,
  getAllUsers,
  getAllBuddies,
  createUser,
  getUserbyUserName,
  promoteUserToBuddy,
  createMessage,
  getMessagesForUser,
  markMessageAsDeleted,
  deleteOldMarkedMessages,
  getDeletedMessagesForUser,
  getUserById,
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
} = require('../db/users');
const { getScheduleWithEventsByUserId } = require('../db/schedules');

const usersRouter = express.Router();

//Register
usersRouter.post('/register', async (req, res) => {
  const { name, email, username, password, 
    security_question_1, security_answer_1, 
    security_question_2, security_answer_2, 
    security_question_3, security_answer_3 } = req.body;

  try {
    if (password.length < 6) {
      console.error("Provided Password does not meet requirements");
      return res.status(400).send('Password is too short');
    }

    const userExists = await getUserbyUserNameOrEmail(username, email);
    console.log("UserExists function result ->", userExists)

    if (userExists !== "Username or email ok to use") {
      console.error(`${username} or ${email} is already in use.`);
      return res.status(400).send(`${username} or ${email} is already in use.`);
    }

    const newUser = await createUser({
      name,
      email,
      username,
      password, 
      security_question_1,
      security_answer_1,
      security_question_2,
      security_answer_2,
      security_question_3,
      security_answer_3
    });
    console.log(newUser)

    const token = jwt.sign({ id: newUser.id, isAdmin: newUser.isAdmin }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log("New user token ->", token)
    res.send({
      message: "Thank you for registering.",
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email, name: newUser.name }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send('Error while registering user');
  }
});

//Login
usersRouter.post('/login', async function (req, res) {
  const { username, password } = req.body;

  console.log('Login request received for username:', username);

  try {

    if (!username) {
      console.log('No username provided');
      return res.status(400).send('Username is required');
    }

    if (!password) {
      console.log('No password provided');
      return res.status(400).send('Password is required');
    }

    const [user] = await getUserbyUserName(username);
    console.log("User ->", user)

    if (user.username) {
      console.log('User found:', user.username);

      bcrypt.compare(password, user.password, function (err, result) {
        if (err) {
          console.log('bcrypt compare error:', err);
          return res.status(500).send('Internal Server Error');
        }
        delete user.password
        if (result) {
          const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
          console.log('Login successful, token:', token);
          res.send({
            message: "Login successful",
            token,
            user: user,
          });
        } else {
          console.log('Login failed: Invalid credentials');
          return res.status(401).send('Invalid credentials');
        }
      });

    } else {
      console.log('Login failed: No user found');
      return res.status(401).send('Invalid credentials');
    }

  } catch (error) {
    console.error(error);
    return res.status(500).send('Error while logging in user');
  }
});

//Promote user to buddy
usersRouter.put('/promote/:id', validateToken, requireUser, requireAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const promotedUser = await promoteUserToBuddy(userId);

    if (promotedUser.is_buddy) {
      res.send('User successfully promoted to buddy');
    }

  } catch (error) {
    console.error(error);
    return res.status(400).send('Error while promoting user');
  }
});

//Demote user from buddy
usersRouter.put('/demote/:id', validateToken, requireUser, requireAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const demotedUser = await demoteUserFromBuddy(userId);

    if (!demotedUser.is_buddy) {
      res.send('User successfully demoted from buddy');
    } else {
      res.status(400).send('Error while demoting user');
    }

  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error while demoting user');
  }
});

//Send message
usersRouter.post('/message', async (req, res) => {
  const { sender_id, receiver_username, message_content } = req.body;
  try {
    const [receiver] = await getUserbyUserName(receiver_username);
    if (!receiver) {
      return res.status(404).json({ success: false, error: 'Receiver not found' });
    }
    const receiver_id = receiver.id;

    await createMessage(sender_id, receiver_id, message_content);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/users/message:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

//Receive messages
usersRouter.get('/messages/:user_id', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const messages = await getMessagesForUser(user_id);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Soft delete a message
usersRouter.delete('/message/:messageId', async (req, res) => {
  try {
    const messageId = req.params.messageId;
    await markMessageAsDeleted(messageId);
    res.status(200).send('Message marked for deletion');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error marking message for deletion');
  }
});

// Hard delete marked messages older than one week
usersRouter.delete('/deleteOldMarkedMessages', async (req, res) => {
  try {
    await deleteOldMarkedMessages();
    res.status(200).send('Old marked messages deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting old marked messages');
  }
});

// Fetch soft deleted messages
usersRouter.get('/deletedMessages/:user_id', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const messages = await getDeletedMessagesForUser(user_id);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users
usersRouter.get('/users', async (req, res) => {
  try {
    const allUsers = await getAllUsers();
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error getting all users' });
  }
});

// Get user by ID
usersRouter.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// Get all buddies
usersRouter.get('/buddies', async (req, res) => {
  try {
    const buddyUsers = await getAllBuddies();
    res.json(buddyUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error getting buddies' });
  }
});

// Get signed in user by id
usersRouter.get('/me', requireUser, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await getUserById(userId);
    console.log('User fetched:', user);

    if (user && Object.keys(user).length > 0) {
      const followsArray = await getUsersFollowedByUser(userId)
      user.follows = followsArray
      const userSchedule = await getScheduleWithEventsByUserId(userId)
      if (userSchedule) {
       user.schedule = userSchedule[0] 
      }
      console.log('Sending response', user);
      return res.json(user);
    } else {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Error getting user' });
  }
});

// Update a user by ID
usersRouter.put('/:id', requireUser, async (req, res) => {
  const userId = req.user.id;
  const { programmingLanguages, ...updatedInfo } = req.body;
  
  try {
     // Update general user information
     await updateUserById(userId, updatedInfo);
    
     // Update programming languages if provided
     if (programmingLanguages) {
       await updateUserProgrammingLanguages(userId, programmingLanguages);
     }
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Retrieve security questions
usersRouter.get('/security-questions/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const questions = await getSecurityQuestions(username);
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving security questions' });
  }
});

// Verify answers
usersRouter.post('/verify-answers', async (req, res) => {
  const { username, answer1, answer2, answer3 } = req.body;

  try {
    const isVerified = await verifySecurityAnswers(username, answer1, answer2, answer3);
    if (isVerified) {
      res.status(200).json({ verified: true });
    } else {
      res.status(401).json({ verified: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error verifying answers' });
  }
});

// Reset password
usersRouter.post('/reset-password', async (req, res) => {
  const { username, newPassword, answer1, answer2, answer3 } = req.body;

  try {
    // Ensure all required fields are provided
    if (!username || !newPassword || !answer1 || !answer2 || !answer3) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify security answers
    const isVerified = await verifySecurityAnswers(username, answer1, answer2, answer3);
    if (!isVerified) {
      return res.status(401).json({ error: 'Security answers do not match' });
    }

    // Proceed with password reset
    await resetPassword(username, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error resetting password' });
  }
});

// Update security questions and answers
usersRouter.put('/update-security/:id', async (req, res) => {
  const userId = req.params.id;
  const { security_question_1, security_answer_1, security_question_2, security_answer_2, security_question_3, security_answer_3 } = req.body;

  try {
    // Ensure all required fields are provided
    if (!security_question_1 || !security_answer_1 || !security_question_2 || !security_answer_2 || !security_question_3 || !security_answer_3) {
      return res.status(400).json({ error: 'All security questions and answers are required' });
    }

    // Update security questions and answers in the database
    const wasUpdated = await updateSecurityQuestionsAndAnswers(userId, security_question_1, security_answer_1, security_question_2, security_answer_2, security_question_3, security_answer_3);

    if (wasUpdated) {
      res.status(200).json({ message: 'Security questions and answers updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating security questions and answers' });
  }
});

// Get all users followed by a specific user
usersRouter.get('/:id/follows', async (req, res) => {
  console.log('Route hit: /:id/follows');
  const userId = req.params.id;

  try {
    console.log('Fetching followed users for user ID:', userId);
    const followedUsers = await getUsersFollowedByUser(userId);
    console.log('Followed users fetched:', followedUsers);

    if (followedUsers && followedUsers.length > 0) {
      console.log('Sending response', followedUsers);
      return res.json(followedUsers);
    } else {
      console.log('No followed users found');
      return res.status(404).json({ error: 'No followed users found' });
    }
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Error getting followed users' });
  }
});

// Follow a user
usersRouter.post('/:id/follow', requireUser, async (req, res) => {
  console.log('Route hit: /:id/follow');
  const followerId = req.user.id;
  const followeeId = req.params.id;

  try {
    if (followeeId != followerId) {
      console.log(`User ID ${followerId} wants to follow user ID ${followeeId}`);
      const result = await followUser(followerId, followeeId);
      return res.json(result);
    } else console.log('Error:', error);
      return res.status(500).json({ error: 'Matching User Ids' });

  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Error following user' });
  }
});

// Unfollow a user
usersRouter.delete('/:id/unfollow', requireUser, async (req, res) => {
  console.log('Route hit: /:id/unfollow');
  const followerId = req.user.id;
  const followeeId = req.params.id;

  try {
    console.log(`User ID ${followerId} wants to unfollow user ID ${followeeId}`);
    const result = await unfollowUser(followerId, followeeId);
    return res.json(result);
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Error unfollowing user' });
  }
});

// Fetch user profile by ID
usersRouter.get('/profile/:id', async (req, res) => {
  console.log('Route hit: /profile/:id');
  const userId = req.params.id;

  try {
    console.log(`Fetching profile for user ID: ${userId}`);
    const user = await getUserById(userId);
    
    console.log('User profile fetched:', user);

    if (user) {
      const followsArray = await getUsersFollowedByUser(userId)
      user.follows = followsArray
      const userSchedule = await getScheduleWithEventsByUserId(userId)
      if (userSchedule) {
       user.schedule = userSchedule[0] 
      }
      console.log('Sending response', user);
      return res.json(user);
    } else {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Error fetching user profile' });
  }
});

usersRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await getUserByEmail(email);
    console.log("Found user:", user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = generateResetToken(email);
    await sendPasswordResetEmail(email, token);

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

usersRouter.post('/reset-password-token', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      `UPDATE users SET password = ? WHERE email = ?`,
      [hashedPassword, email]
    );

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

module.exports = usersRouter;