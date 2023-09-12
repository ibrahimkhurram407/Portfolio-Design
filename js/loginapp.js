const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;

// Create a MySQL database connection
const db = mysql.createConnection({
  host: '2.tcp.eu.ngrok.io',
  port: 14449,
  user: 'kali-server',
  password: 'Kali User 407',
  database: 'Portfolio_Webstore',
});

// Connect to the database
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'your_secret_key',
    resave: true,
    saveUninitialized: true,
  })
);

// Routes for login and registration
const bcrypt = require('bcrypt');

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Generate a random salt
  const saltRounds = 10; // You can adjust this value
  const salt = await bcrypt.genSalt(saltRounds);

  // Hash the user's password with the salt
  const hashedPassword = await bcrypt.hash(password, salt);

  // Store the hashed password and salt in your_passwords_table
  const saltInsertQuery = 'INSERT INTO your_passwords_table (user_id, salt) VALUES (?, ?)';
  const userInsertQuery = 'INSERT INTO your_users_table (username, email, password) VALUES (?, ?, ?)';

  db.beginTransaction((err) => {
    if (err) {
      throw err;
    }

    db.query(saltInsertQuery, [user_id, salt], (saltErr, saltResult) => {
      if (saltErr) {
        db.rollback(() => {
          throw saltErr;
        });
      }

      const user_id = saltResult.insertId;

      db.query(userInsertQuery, [username, email, hashedPassword], (userErr, userResult) => {
        if (userErr) {
          db.rollback(() => {
            throw userErr;
          });
        }

        db.commit((commitErr) => {
          if (commitErr) {
            db.rollback(() => {
              throw commitErr;
            });
          }
          res.send('Registration successful');
        });
      });
    });
  });
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    // Retrieve the hashed password and salt for the given username
    const passwordQuery = 'SELECT id, password FROM your_users_table WHERE username = ?';
  
    db.query(passwordQuery, [username], async (err, results) => {
      if (err) {
        throw err;
      }
  
      if (results.length === 0) {
        res.send('User not found');
      } else {
        const user = results[0];
        const hashedPassword = user.password;
  
        // Compare the input password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, hashedPassword);
  
        if (passwordMatch) {
          req.session.username = username;
          res.send('Login successful');
        } else {
          res.send('Incorrect password');
        }
      }
    });
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
