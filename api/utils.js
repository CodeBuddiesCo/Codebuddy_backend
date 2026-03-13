const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'catherine.mugnai@gmail.com';

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
      message: "You must be a buddy for this request",
    });
  }
  next();
}

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return next({
      name: "UnauthorizedError",
      message: "You must be an admin for this request",
    });
  }
  next();
};

function generateResetToken(userEmail) {
  const payload = { email: userEmail };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' });
}

function validateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).send('Token not provided');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user;
    console.log('User from token:', user);
    next();
  });
}

async function sendPasswordResetEmail(to, token) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/user/reset-password?token=${token}`;

  await sgMail.send({
    from: { email: EMAIL_FROM, name: 'CodeBuddies' },
    to,
    subject: 'Reset Your Password',
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password. This link will expire in 10 minutes.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
    `,
  });
}

async function sendUsernameEmail(to, username) {
  await sgMail.send({
    from: { email: EMAIL_FROM, name: 'CodeBuddies' },
    to,
    subject: 'Your CodeBuddies Username',
    html: `
      <p>You requested your username.</p>
      <p>Your username is: <strong>${username}</strong></p>
    `,
  });
}

module.exports = {
  requireUser,
  requireAdmin,
  validateToken,
  requireBuddy,
  generateResetToken,
  sendPasswordResetEmail,
  sendUsernameEmail,
};
