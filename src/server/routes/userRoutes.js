// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const OrderDetail = require('../models/OrderDetail');
const jwt = require('jsonwebtoken'); // Needed for login

// Import our new middleware
const { protect, isAdmin } = require('../middleware/authMiddleware');

// --- Auth Endpoints (Public) ---
// Note: Path changes from /api/register to /register
router.post("/register", async (req, res) => {
  // (Your existing /api/register logic...)
  try {
    const { customer_name, email, password } = req.body;
    if (!customer_name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const newUser = new Customer({ customer_name, email, password });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Note: Path changes from /api/login to /login
router.post("/login", async (req, res) => {
  // (Your existing /api/login logic...)
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid email or password" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userRole = user.role || "customer"; 
    res.status(200).json({ 
      message: "Login successful",
      redirect: userRole === "admin" ? "/admin" : "/shop",
      token: token,
      user: { id: user._id, name: user.customer_name, email: user.email, role: userRole }
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Error logging in user" });
  }
});

// --- User Profile Endpoints (Protected) ---
// Note: Path changes from /api/profile/me to /profile/me
router.get("/profile/me", protect, async (req, res) => {
  // (Your existing /api/profile/me logic...)
  try {
    const user = await Customer.findById(req.user.id, "customer_name email phone_number shipping_address");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      customer_name: user.customer_name, email: user.email, phone_number: user.phone_number, shipping_address: user.shipping_address
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Note: Path changes from /api/profile/me to /profile/me
router.put("/profile/me", protect, async (req, res) => {
  // (Your existing /api/profile/me logic for updating...)
  // ...
});

// Note: Path changes from /api/profile/me/orders to /profile/me/orders
router.get("/profile/me/orders", protect, async (req, res) => {
  // (Your existing /api/profile/me/orders logic...)
  // ...
});

// --- Admin User Management Endpoints (Admin Only) ---
// Note: Path changes from /api/users to /
router.get("/", [protect, isAdmin], async (req, res) => {
  // (Your existing /api/users logic...)
  // ...
});

// Note: Path changes from /api/users/:id to /:id
router.put("/:id", [protect, isAdmin], async (req, res) => {
  // (Your existing /api/users/:id logic...)
  // ...
});

// Note: Path changes from /api/users/:id to /:id
router.delete("/:id", [protect, isAdmin], async (req, res) => {
  // (Your existing /api/users/:id logic...)
  // ...
});

// Note: Path changes from /api/users/:id/orders to /:id/orders
router.get("/:id/orders", [protect, isAdmin], async (req, res) => {
  // (Your existing /api/users/:id/orders logic...)
  // ...
});

// --- NEW: Export the router ---
module.exports = router;