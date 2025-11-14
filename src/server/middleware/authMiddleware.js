// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer'); // Adjust path if needed

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await Customer.findById(decoded.id).select('-password');
      if (!req.user) {
         return res.status(401).json({ message: "User not found" });
      }
      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// --- NEW: Export them ---
module.exports = { protect, isAdmin };