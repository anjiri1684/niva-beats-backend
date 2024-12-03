const express = require("express");
const router = express.Router();
const Subscription = require("../models/Subscription");
const { verifyUserToken } = require("../middleware/authMiddleware");

// Subscribe to a plan
router.post("/subscribe", verifyUserToken, async (req, res) => {
  const { tier } = req.body;
  const userId = req.user.id;

  try {
    const existingSubscription = await Subscription.findOne({
      userId,
      status: "active",
    });
    if (existingSubscription) {
      return res
        .status(400)
        .json({ message: "You already have an active subscription." });
    }

    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1); // Add 1 month

    const newSubscription = new Subscription({
      userId,
      tier,
      status: "active",
      expirationDate,
    });
    await newSubscription.save();

    res.status(201).json({
      message: "Subscription created successfully",
      subscription: newSubscription,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get subscription status
router.get("/status", verifyUserToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });
    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found." });
    }

    res.status(200).json({ subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Cancel subscription
router.put("/cancel", verifyUserToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const subscription = await Subscription.findOneAndUpdate(
      {
        userId,
        status: "active",
      },
      { status: "inactive" },
      { new: true }
    );
    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found." });
    }

    res.status(200).json({ message: "Subscription canceled successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;

// Update subscription
router.patch("/update", verifyUserToken, async (req, res) => {
  const userId = req.user.id;
  const { tier } = req.body;

  try {
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });
    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found." });
    }

    subscription.tier = tier;
    await subscription.save();

    res.status(200).json({ message: "Subscription updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
