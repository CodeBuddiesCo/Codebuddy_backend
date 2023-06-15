require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const client = require('./db/client');
client.connect();

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

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

const apiRouter = require('./api');
app.use('/api', apiRouter);

module.exports = app;
