const express = require("express");
const router = express.Router();
const { verifyUserToken } = require("../middleware/authMiddleware");
const User = require("../models/User");

// Endpoint to fetch current user data
router.get("/users/me", verifyUserToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user); // Send user data (including subscription)
  } catch (error) {
    res.status(500).json({ message: "Error fetching user data" });
  }
});

module.exports = router;
