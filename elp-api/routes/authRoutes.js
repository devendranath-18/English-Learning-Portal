const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// Helper function to query DB using promises
const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Helper for transaction operations
const beginTransaction = () => new Promise((res, rej) => db.beginTransaction(err => err ? rej(err) : res()));
const commitTransaction = () => new Promise((res, rej) => db.commit(err => err ? rej(err) : res()));
const rollbackTransaction = () => new Promise((res) => db.rollback(() => res()));

// Register endpoint (Supports transactional role-specific table inserting)
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!["student", "faculty", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role specified" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start Transaction
    await beginTransaction();

    try {
      // 1. Insert user
      const userSql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
      const userResult = await queryAsync(userSql, [name, email, hashedPassword, role]);
      const userId = userResult.insertId;

      // 2. Insert into role-specific table
      if (role === "student") {
        await queryAsync("INSERT INTO students (user_id) VALUES (?)", [userId]);
      } else if (role === "faculty") {
        await queryAsync("INSERT INTO faculty (user_id) VALUES (?)", [userId]);
      } else if (role === "admin") {
        await queryAsync("INSERT INTO admins (user_id) VALUES (?)", [userId]);
      }

      await commitTransaction();
      return res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      await rollbackTransaction();
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email is already registered" });
      }
      throw err;
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const users = await queryAsync("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Fetch the role-specific profile ID
    let profileId = null;
    if (user.role === "student") {
      const studentResult = await queryAsync("SELECT id FROM students WHERE user_id = ?", [user.id]);
      if (studentResult.length > 0) profileId = studentResult[0].id;
    } else if (user.role === "faculty") {
      const facultyResult = await queryAsync("SELECT id FROM faculty WHERE user_id = ?", [user.id]);
      if (facultyResult.length > 0) profileId = facultyResult[0].id;
    } else if (user.role === "admin") {
      const adminResult = await queryAsync("SELECT id FROM admins WHERE user_id = ?", [user.id]);
      if (adminResult.length > 0) profileId = adminResult[0].id;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        profileId: profileId
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileId: profileId
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;