const express = require("express");
const router = express.Router();
const { verifyAdminToken } = require("../middleware/authMiddleware");
const User = require("../models/User");
const { getTotalRevenue } = require("../controllers/adminController");

// Get all users
router.get("/customers", verifyAdminToken, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Get revenue without redundant /admin in the route path
router.get("/revenue", verifyAdminToken, getTotalRevenue);

module.exports = router;
