const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('../backend/routes/auth');
const adminRoutes = require('../backend/routes/admin');
const userRoutes = require('../backend/routes/user');
const storeRoutes = require('../backend/routes/store');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/store', storeRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'API Endpoint not found.' });
});

module.exports = app;
