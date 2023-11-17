const jwt = require('jsonwebtoken');

function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "You must be logged in to perform this action",
      message: "You must be logged in to perform this action",
      name: "User token not received",
    });
  }
  next();
}

function requireBuddy(req, res, next) {
  if (!req.user.is_buddy) {
    return res.status(401).json({
      name: "UnauthorizedError",
      message: "You must be a buddy to create an event",
    });
  }
  next();
}

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return next({
      name: "UnauthorizedError",
      message: "You must be an admin to access this resource",
    });
  }
  next();
};

function generateResetToken(userEmail) {
  const payload = {
    email: userEmail,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });

  return token;
}

function validateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).send('Token not provided');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send('Invalid token');
    }

    req.user = user;
    console.log('User from token:', user); // Log the user info
    next();
  });
}

module.exports = {
  requireUser,
  requireAdmin,
  validateToken,
  requireBuddy,
  generateResetToken,
}
