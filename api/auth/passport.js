const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mysql = require('mysql');
require('dotenv').config();

// Database connection setup
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

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/auth/google/callback"
},

function(accessToken, refreshToken, profile, cb) {
    const query = 'SELECT * FROM users WHERE googleId = ?';
    db.query(query, [profile.id], function (error, results) {
      if (error) {
        return cb(error);
      }
  
      if (results.length > 0) {
        // User found
        return cb(null, results[0]);
      } else {
        // User not found, create a new one
        const googleId = profile.id;
        const name = profile.displayName;
        const email = profile.emails[0].value;
        
        const insertQuery = 'INSERT INTO users (googleId, name, email) VALUES (?, ?, ?)';
        db.query(insertQuery, [googleId, name, email], function (insertError, insertResults) {
          if (insertError) {
            return cb(insertError);
          }
          
          // Get the new user's data
          db.query(query, [googleId], function (selectError, selectResults) {
            if (selectError) {
              return cb(selectError);
            }
            
            return cb(null, selectResults[0]);
          });
        });
      }
    });
  }  
));

module.exports = passport;
