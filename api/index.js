const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getUserById } = require('../db/users');

const { JWT_SECRET } = process.env;

// GET /api/code - Passing test
router.get('/code', async (req, res, next) => {
  res.send({ message: 'Welcome to Code Buddies' });
});

// Middleware to handle token authentication
router.use(async (req, res, next) => {
  const prefix = 'Bearer ';
  const auth = req.header('Authorization');

  if (!auth) {
    next();
  } else if (auth.startsWith(prefix)) {
    const token = auth.slice(prefix.length);

    try {
      const { id } = jwt.verify(token, JWT_SECRET);

      if (id) {
        req.user = await getUserById(id)
        next();
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  } else {
    next({
      name: 'AuthorizationHeaderError',
      message: `Authorization token must start with ${prefix}`,
    });
  }
});

// ROUTER: /api/users
const usersRouter = require('./users');
router.use('/users', usersRouter);

router.use('*', (req, res, next) => {
  const err = new Error('Not found');
  err.status = 404;
  res.status(404);
  next({
    name: '404 Error',
    error: '404',
    message: 'Error 404 - Page not found',
  });
});

// Error handling middleware
router.use((err, req, res, next) => {
  res.send({
    name: err.name,
    error: err.error,
    message: err.message,
  });
});

module.exports = router;
