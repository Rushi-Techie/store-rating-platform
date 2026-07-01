const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, userOnly } = require('../middleware/auth');

// Apply user-only permissions to all routes in this file
router.use(authenticateToken);
router.use(userOnly);

// GET /api/user/stores - List stores with overall rating & user rating (with search and sort)
router.get('/stores', async (req, res) => {
  const userId = req.user.id;
  const { search, sortBy, sortOrder } = req.query;

  const allowedSortCols = ['name', 'address', 'overall_rating'];
  const sortCol = allowedSortCols.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';

  let queryText = `
    SELECT u.id, u.name, u.address, u.email,
           COALESCE(ROUND(AVG(r.rating), 2), 0)::numeric(10,2) as overall_rating,
           (SELECT rating FROM ratings WHERE user_id = $1 AND store_id = u.id) as user_rating
    FROM users u
    LEFT JOIN ratings r ON u.id = r.store_id
    WHERE u.role = 'store_owner'
  `;
  const queryParams = [userId];
  let paramIdx = 2;

  if (search) {
    queryText += ` AND (u.name ILIKE $${paramIdx} OR u.address ILIKE $${paramIdx})`;
    queryParams.push(`%${search}%`);
    paramIdx++;
  }

  queryText += ` GROUP BY u.id`;

  // Apply sorting
  if (sortCol === 'overall_rating') {
    queryText += ` ORDER BY overall_rating ${order}`;
  } else {
    queryText += ` ORDER BY u.${sortCol} ${order}`;
  }

  try {
    const result = await db.query(queryText, queryParams);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error listing stores.' });
  }
});

// POST /api/user/ratings - Submit a new rating (1 to 5) for a store
router.post('/ratings', async (req, res) => {
  const userId = req.user.id;
  const { storeId, rating } = req.body;

  const ratingVal = parseInt(rating);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
  }

  if (!storeId) {
    return res.status(400).json({ message: 'Store ID is required.' });
  }

  try {
    // Verify target user is indeed a store_owner
    const storeRes = await db.query("SELECT id FROM users WHERE id = $1 AND role = 'store_owner'", [storeId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found or invalid role.' });
    }

    // Check if user already rated this store
    const existRes = await db.query('SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2', [userId, storeId]);
    if (existRes.rows.length > 0) {
      return res.status(400).json({ message: 'You have already rated this store. Please modify your rating instead.' });
    }

    await db.query(
      'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)',
      [userId, storeId, ratingVal]
    );

    res.status(201).json({ message: 'Rating submitted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error submitting rating.' });
  }
});

// PUT /api/user/ratings/:storeId - Modify an existing rating for a store
router.put('/ratings/:storeId', async (req, res) => {
  const userId = req.user.id;
  const { storeId } = req.params;
  const { rating } = req.body;

  const ratingVal = parseInt(rating);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    const existRes = await db.query('SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2', [userId, storeId]);
    if (existRes.rows.length === 0) {
      return res.status(404).json({ message: 'Rating record not found to modify.' });
    }

    await db.query(
      'UPDATE ratings SET rating = $1 WHERE user_id = $2 AND store_id = $3',
      [ratingVal, userId, storeId]
    );

    res.status(200).json({ message: 'Rating updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error modifying rating.' });
  }
});

module.exports = router;
