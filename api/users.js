const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/db');
const { requireUser, requireAdmin } = require('./utils');

const usersRouter = express.Router();

usersRouter.post('/register', (req, res) => {
  const { name, email, username, password } = req.body;
  const saltRounds = 10;

  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error while registering user');
    }

    const sql = 'INSERT INTO users (name, email, username, password) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, email, username, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).send('Email or username already exists');
        }
        throw err;
      }

      const userId = result.insertId;

      const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      res.json({
        message: 'User registered successfully',
        token,
      });
    });
  });
});

usersRouter.post('/login', function (req, res) {
  const { username, password } = req.body;

  console.log('Login request received for username:', username);

  if (!username) {
    console.log('No username provided');
    return res.status(400).send('Username is required');
  }

  if (!password) {
    console.log('No password provided');
    return res.status(400).send('Password is required');
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], function (err, results) {
    if (err) {
      console.log('Database query error:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length > 0) {
      const user = results[0];
      console.log('User found:', user.username);

      bcrypt.compare(password, user.password, function(err, result) {
        if (err) {
          console.log('bcrypt compare error:', err);
          return res.status(500).send('Internal Server Error');
        }

        if (result) {
          const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
          console.log('Login successful, token:', token);
          return res.json({ token });
        } else {
          console.log('Login failed: Invalid credentials');
          return res.status(401).send('Invalid credentials');
        }
      });
    } else {
      console.log('Login failed: No user found');
      return res.status(401).send('Invalid credentials');
    }
  });
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
