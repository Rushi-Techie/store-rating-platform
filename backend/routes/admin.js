const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { validateUserFields } = require('../utils/validators');

// Apply admin permissions to all routes in this file
router.use(authenticateToken);
router.use(adminOnly);

// GET /api/admin/stats - Admin Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const usersCount = await db.query('SELECT COUNT(*)::integer as count FROM users');
    const storesCount = await db.query("SELECT COUNT(*)::integer as count FROM users WHERE role = 'store_owner'");
    const ratingsCount = await db.query('SELECT COUNT(*)::integer as count FROM ratings');

    res.status(200).json({
      totalUsers: usersCount.rows[0].count,
      totalStores: storesCount.rows[0].count,
      totalRatings: ratingsCount.rows[0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error fetching stats.' });
  }
});

// POST /api/admin/users - Admin adds new user (admin, user, store_owner)
router.post('/users', async (req, res) => {
  const { name, email, password, address, role } = req.body;

  // Validate fields
  const validationError = validateUserFields({ name, email, address, password });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  if (!role || !['admin', 'user', 'store_owner'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    // Check if email already registered
    const existRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existRes.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, address, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role`,
      [name, email, passwordHash, address, role]
    );

    res.status(201).json({
      message: 'User created successfully.',
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error creating user.' });
  }
});

// GET /api/admin/users - List normal and admin users (with sorting & filters)
router.get('/users', async (req, res) => {
  const { name, email, address, role, sortBy, sortOrder } = req.query;

  // Whitelist sort fields to prevent SQL injection
  const allowedSortCols = ['name', 'email', 'address', 'role'];
  const sortCol = allowedSortCols.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';

  let queryText = "SELECT id, name, email, address, role FROM users WHERE role IN ('admin', 'user')";
  const queryParams = [];
  let paramIdx = 1;

  if (name) {
    queryText += ` AND name ILIKE $${paramIdx++}`;
    queryParams.push(`%${name}%`);
  }
  if (email) {
    queryText += ` AND email ILIKE $${paramIdx++}`;
    queryParams.push(`%${email}%`);
  }
  if (address) {
    queryText += ` AND address ILIKE $${paramIdx++}`;
    queryParams.push(`%${address}%`);
  }
  if (role) {
    queryText += ` AND role = $${paramIdx++}`;
    queryParams.push(role);
  }

  queryText += ` ORDER BY ${sortCol} ${order}`;

  try {
    const result = await db.query(queryText, queryParams);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error listing users.' });
  }
});

// GET /api/admin/stores - List all store owners with ratings (with sorting & filters)
router.get('/stores', async (req, res) => {
  const { name, email, address, sortBy, sortOrder } = req.query;

  const allowedSortCols = ['name', 'email', 'address', 'rating'];
  const sortCol = allowedSortCols.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';

  let queryText = `
    SELECT u.id, u.name, u.email, u.address, u.role, 
           COALESCE(ROUND(AVG(r.rating), 2), 0)::numeric(10,2) as rating
    FROM users u
    LEFT JOIN ratings r ON u.id = r.store_id
    WHERE u.role = 'store_owner'
  `;
  const queryParams = [];
  let paramIdx = 1;

  if (name) {
    queryText += ` AND u.name ILIKE $${paramIdx++}`;
    queryParams.push(`%${name}%`);
  }
  if (email) {
    queryText += ` AND u.email ILIKE $${paramIdx++}`;
    queryParams.push(`%${email}%`);
  }
  if (address) {
    queryText += ` AND u.address ILIKE $${paramIdx++}`;
    queryParams.push(`%${address}%`);
  }

  queryText += ` GROUP BY u.id`;

  // Apply sorting - rating is group aggregated, name/email/address are group attributes
  queryText += ` ORDER BY ${sortCol === 'rating' ? 'rating' : `u.${sortCol}`} ${order}`;

  try {
    const result = await db.query(queryText, queryParams);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error listing stores.' });
  }
});

// GET /api/admin/users/:id - View specific user details (including rating if store owner)
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const userRes = await db.query('SELECT id, name, email, address, role FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userRes.rows[0];

    if (user.role === 'store_owner') {
      const ratingRes = await db.query(
        'SELECT COALESCE(ROUND(AVG(rating), 2), 0)::numeric(10,2) as avg_rating FROM ratings WHERE store_id = $1',
        [id]
      );
      user.rating = ratingRes.rows[0].avg_rating;
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error fetching user details.' });
  }
});

module.exports = router;
