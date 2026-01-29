// const mysql2 = require('mysql2/promise');
// require('dotenv').config();

// console.log(process.env.DB_HOST)

// const db = mysql2.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   maxIdle: 10, 
//   idleTimeout: 50, 
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 0
// });

// module.exports = db;



const mysql2 = require('mysql2/promise');
require('dotenv').config();

console.log('DB HOST:', process.env.DB_HOST);
console.log('DB PORT:', process.env.DB_PORT);

const db = mysql2.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  connectTimeout: 20000,

  ssl: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
