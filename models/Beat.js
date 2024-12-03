const mongoose = require("mongoose");

const beatSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  artist: { type: String, required: true, trim: true },
  genre: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  audioFile: { type: String, required: true },
  image: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Beat", beatSchema);
