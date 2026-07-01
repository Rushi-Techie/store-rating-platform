const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { validateUserFields, validatePassword } = require('../utils/validators');

// JWT signer helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'SuperSecureRushiTokenRatingAppKey2026!',
    { expiresIn: '24h' }
  );
};

// POST /api/auth/signup - Normal User signup
router.post('/signup', async (req, res) => {
  const { name, email, address, password } = req.body;

  // Validate fields
  const validationError = validateUserFields({ name, email, address, password });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    // Check if user exists
    const userExistRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExistRes.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, address, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role`,
      [name, email, passwordHash, address, 'user']
    );

    const user = result.rows[0];
    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error during signup.' });
  }
});

// POST /api/auth/login - Single login system
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// PUT /api/auth/change-password - Update password (for logged-in users)
router.put('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error during password update.' });
  }
});

module.exports = router;
