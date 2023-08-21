const express = require('express');
const { requireUser, requireAdmin } = require('./utils');


const eventsRouter = express.Router();

module.exports = eventsRouter;