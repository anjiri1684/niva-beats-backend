const Favorite = require("../models/Favorite");

exports.addFavorite = async (req, res) => {
  try {
    const { beatId } = req.body;
    const userId = req.user.id;

    const favorite = new Favorite({ userId, beatId });
    await favorite.save();

    res.status(201).json({ message: "Beat added to favorites", favorite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
