const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, storeOwnerOnly } = require('../middleware/auth');

// Apply store-owner-only permissions to all routes in this file
router.use(authenticateToken);
router.use(storeOwnerOnly);

// GET /api/store/my-store - Get store owner dashboard stats and user ratings list
router.get('/my-store', async (req, res) => {
  const storeId = req.user.id;
  const { sortBy, sortOrder } = req.query;

  const allowedSortCols = ['name', 'email', 'rating', 'created_at'];
  const sortCol = allowedSortCols.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'ASC' ? 'ASC' : 'DESC'; // Default to DESC (newest ratings first)

  try {
    // 1. Get average rating
    const avgRes = await db.query(
      'SELECT COALESCE(ROUND(AVG(rating), 2), 0)::numeric(10,2) as average_rating FROM ratings WHERE store_id = $1',
      [storeId]
    );
    const averageRating = avgRes.rows[0].average_rating;

    // 2. Get list of users who submitted ratings
    let queryText = `
      SELECT u.id as user_id, u.name, u.email, u.address, 
             r.rating, r.created_at
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
    `;

    // Apply sorting
    if (sortCol === 'rating' || sortCol === 'created_at') {
      queryText += ` ORDER BY r.${sortCol} ${order}`;
    } else {
      queryText += ` ORDER BY u.${sortCol} ${order}`;
    }

    const ratingsRes = await db.query(queryText, [storeId]);

    res.status(200).json({
      averageRating,
      ratings: ratingsRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error fetching store dashboard data.' });
  }
});

module.exports = router;
