const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/db');
const { requireUser, requireAdmin, validateToken } = require('./utils');
const {
  getUserbyUserNameOrEmail,
  getAllUsers,
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
  getSecurityQuestions,
  verifySecurityAnswers,
  resetPassword
} = require('../db/users');

const usersRouter = express.Router();

usersRouter.post('/register', async (req, res) => {
  const { name, email, username, password, security_question_1, security_answer_1, security_question_2, security_answer_2, security_question_3, security_answer_3 } = req.body;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const hashedAnswer1 = await bcrypt.hash(security_answer_1, saltRounds);
  const hashedAnswer2 = await bcrypt.hash(security_answer_2, saltRounds);
  const hashedAnswer3 = await bcrypt.hash(security_answer_3, saltRounds);

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
      hashedPassword,
      security_question_1,
      security_answer_1: hashedAnswer1,
      security_question_2,
      security_answer_2: hashedAnswer2,
      security_question_3,
      security_answer_3: hashedAnswer3
    });
    console.log(newUser)

    const token = jwt.sign({ id: newUser.id, isAdmin: newUser.isAdmin }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log("New user token ->", token)
    res.send({
      message: "Thank you for registering.",
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email, name: newUser.name } // Don't send back sensitive data
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send('Error while registering user');
  }
});

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

usersRouter.post('/message', async (req, res) => {
  const { sender_id, receiver_username, message_content } = req.body;
  try {
    // Get receiver ID from username
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

// Get a single user by ID
usersRouter.get('/users/:id', async (req, res) => {
  const userId = req.params.id;
  
  try {
    const user = await getUserById(userId);
    console.log('User fetched:', user);
    
    if (user && Object.keys(user).length > 0) {
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
usersRouter.put('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const updatedInfo = req.body;
  try {
    await updateUserById(userId, updatedInfo);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
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
  const { username, newPassword } = req.body;

  try {
    await resetPassword(username, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error resetting password' });
  }
});

module.exports = usersRouter;