const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/db');
const { requireUser, requireAdmin } = require('./utils');
const { getUserbyUserNameOrEmail, createUser, getUserbyUserName, promoteUserToBuddy } = require('../db/users');

const usersRouter = express.Router();

usersRouter.post('/register', async (req, res) => {
  const { name, email, username, password } = req.body;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

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

    const [newUser] = await createUser({
      name,
      email,
      username,
      hashedPassword,
    });
    console.log(newUser)

    const token = jwt.sign(newUser, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log("New user token ->", token)
    res.send({
      message: "Thank you for registering.",
      token,
      user: newUser,
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

    bcrypt.compare(password, user.password, function(err, result) {
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

usersRouter.put('/promote/:id', requireUser, requireAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const promotedUser = await promoteUserToBuddy(userId);
  
    if (promotedUser.is_buddy) {
    res.send('User successfully promoted to buddy');
    }

  }catch (error) {
    console.error(error);
    return res.status(400).send('Error while promoting user');
  }
});

usersRouter.post('/send-message', requireUser, async (req, res) => {
  const { userId, message } = req.body;
  const senderId = req.user.id;

  try {
    const savedMessage = await db.saveMessage(senderId, userId, message);

    return res.status(200).json({ message: 'Message sent successfully', savedMessage });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error while sending message');
  }
});

usersRouter.get('/messages', requireUser, async (req, res) => {
  const userId = req.user.id;

  try {
    const userMessages = await db.getUserMessages(userId);

    return res.status(200).json(userMessages);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error while retrieving messages');
  }
});

module.exports = usersRouter;
