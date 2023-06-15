const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { requireUser, requireAdmin } = require('./authMiddleware');

const usersRouter = express.Router();

usersRouter.post('/user/register', (req, res) => {
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
        // Check if the error is due to a duplicate entry
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).send('Email or username already exists');
        }
        throw err;
      }

      const userId = result.insertId;

      const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Set the expiration time for the token
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
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(sql, [username, password], function (err, results) {
    if (err) throw err;
    if (results.length > 0) {
      const user = results[0];
      const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
      res.json({ token });
    } else {
      res.status(401).send('Invalid credentials');
    }
  });
});

// Change is_buddy field to true to promote a regular user to a buddy, requires authentication
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
