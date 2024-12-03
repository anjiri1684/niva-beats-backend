const Subscription = require("../models/Subscription");
const User = require("../models/User");

exports.createSubscription = async (req, res) => {
  try {
    const { tier } = req.body;
    const userId = req.user.id;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days from now

    const subscription = new Subscription({ userId, tier, endDate });
    await subscription.save();

    res
      .status(201)
      .json({ message: "Subscription created successfully", subscription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
