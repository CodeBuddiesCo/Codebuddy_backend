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
app.use(cors());

app.use((req, res, next) => {
  console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");

  next();
});

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

const db = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database');
});

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

const apiRouter = require('./api');
app.use('/api', apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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