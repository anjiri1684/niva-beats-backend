const express = require("express");
const router = express.Router();
const Favorite = require("../models/Favorite");
const Beat = require("../models/Beat");
const { verifyUserToken } = require("../middleware/authMiddleware");

// Add a beat to favorites
router.post("/add", verifyUserToken, async (req, res) => {
  const { beatId } = req.body;
  const userId = req.user.id;

  try {
    // Check if the beat exists
    const beat = await Beat.findById(beatId);
    if (!beat) {
      return res.status(404).json({ message: "Beat not found" });
    }

    // Check if the beat is already in the user's favorites
    const existingFavorite = await Favorite.findOne({ userId, beatId });
    if (existingFavorite) {
      return res
        .status(400)
        .json({ message: "Beat is already in your favorites" });
    }

    // Add beat to favorites
    const favorite = new Favorite({ userId, beatId });
    await favorite.save();

    res.status(201).json({ message: "Beat added to favorites", favorite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all favorites for a user
router.get("/list", verifyUserToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const favorites = await Favorite.find({ userId }).populate(
      "beatId",
      "title price"
    );
    res.status(200).json({ favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
