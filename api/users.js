const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/db');
const { requireUser, requireAdmin } = require('./utils');
const { getUserbyUserNameOrEmail, createUser, getUserbyUserName } = require('../db/users');


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
  console.log('Database query error:', error);
  return res.status(500).send('Internal Server Error');
}
});


usersRouter.put('/promote/:id', requireUser, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const sql = 'UPDATE users SET is_buddy = TRUE WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      throw err;
    }
    res.send('User promoted to buddy');
  });
});

module.exports = usersRouter;
