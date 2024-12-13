require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mysql = require('mysql');

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cors({
  origin: '*', // Temporarily allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Include OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); // Enable preflight requests for all routes

app.use((req, res, next) => {
  console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");
  next();
});

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

// Test route
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// API routes
const apiRouter = require('./api');
app.use('/api', apiRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Scheduled tasks
const cron = require('node-cron');
const { deleteOldMarkedMessages } = require('./db/users');

// Schedule the task to run once every day at 2:30 am
cron.schedule('30 2 * * *', async () => {
  try {
    await deleteOldMarkedMessages();
    console.log("Automatic: Old marked messages deleted successfully");
  } catch (error) {
    console.error("Automatic: Error deleting old marked messages", error);
  }
});