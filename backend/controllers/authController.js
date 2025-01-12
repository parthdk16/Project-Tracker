const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const dotenv = require("dotenv")
dotenv.config();

const md5 = require("md5");


// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(403).send("A token is required for authentication");
    }
  
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(403).send("A token is required for authentication");
    }
  
    try {
      const decoded = jwt.verify(token,process.env.SECRETKEY);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).send("Invalid Token");
    }
  };
  
  // Login endpoint
  exports.login= (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = md5(password);
  
    const query = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(query, [username, hashedPassword], (err, results) => {
      if (err) {
        res.status(500).json({ message: "Internal server error" });
        return;
      }
  
      if (results.length === 0) {
        res.status(401).json({ message: "Invalid username or password" });
        return;
      }
  
      const user = results[0];
      const token = jwt.sign(
        {
          id: user.UserID,
          username: user.Username,
          name: user.Name,
          usertype: user.UserType,
          useremail: user.Email,
        },
        process.env.SECRETKEY,
        { expiresIn: "12h" }
      );
      res.status(200).json({ token });
    });
  };
  
  // Add new user
  exports.register= (req, res) => {
    const { username, name, email, password, usertype } = req.body;
  console.log('the details at the backend recivedd are',username, name, email, password, usertype)
    if (!username || !name || !email || !password || !usertype) {
      res
        .status(400)
        .send("Username, name, email, password & usertype all are required!");
      return;
    }
  
    const hashedPassword = md5(password); // Hash the password using md5
  
    const query =
      "INSERT INTO users (userid, username, name, email, password, usertype) VALUES (NULL, ?, ?, ?, ?, ?)";
    db.query(
      query,
      [username, name, email, hashedPassword, usertype],
      (err, results) => {
        if (err) {
          res.status(500).send(err);
          return;
        }
        res.status(201).json({ id: results.insertId, name, email });
      }
    );
  };