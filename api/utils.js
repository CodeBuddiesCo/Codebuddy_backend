const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendPasswordResetEmail(to, token) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"CodeBuddies" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset Your Password',
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password. This link will expire in 10 minutes.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
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
};
