const User = require("../models/User"); // Ensure this path is correct

// Get the current logged-in user's profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // Assuming JWT middleware sets req.user.id
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email,
      subscription: user.subscription, // Assuming subscription is a field in User
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

module.exports = { getUserProfile };
