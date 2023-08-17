const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/db');
const { requireUser, requireAdmin } = require('./utils');
const { getUserbyUserNameOrEmail, createUser, getUserbyUserName, promoteUserToBuddy, saveMessage } = require('../db/users');

const usersRouter = express.Router();