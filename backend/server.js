const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const storeRoutes = require('./routes/store');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests (port 5173 default for Vite)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Store Rating Platform Backend is running.' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/store', storeRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

// Global Error Handler (prevents server crashes, looks professional)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    message: 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server is listening on port ${PORT}`);
});
