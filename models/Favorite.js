const mongoose = require("mongoose");

// Favorite schema
const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  beatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Beat",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;
