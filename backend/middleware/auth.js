const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(101).json({ message: 'Access token required' }); // Custom code or standard 401
  }

  jwt.verify(token, process.env.JWT_SECRET || 'SuperSecureRushiTokenRatingAppKey2026!', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Requires administrator permissions' });
  }
};

const userOnly = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.status(403).json({ message: 'Requires customer privileges' });
  }
};

const storeOwnerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'store_owner') {
    next();
  } else {
    res.status(403).json({ message: 'Requires store owner privileges' });
  }
};

module.exports = {
  authenticateToken,
  adminOnly,
  userOnly,
  storeOwnerOnly,
};
