const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Beat = require("../models/Beat");
const User = require("../models/User");
const {
  createPaymentIntent,
  verifyPaymentIntent,
} = require("../config/stripe");
const { verifyUserToken } = require("../middleware/authMiddleware");

// Create a payment intent
router.post("/create-payment-intent", async (req, res) => {
  const { beatIds, userId } = req.body;

  if (!beatIds || !Array.isArray(beatIds)) {
    return res.status(400).json({ error: "Invalid beat IDs provided." });
  }

  try {
    const beats = await Beat.find({ _id: { $in: beatIds } });

    if (!beats || beats.length === 0) {
      return res
        .status(404)
        .json({ error: "No beats found for the provided IDs." });
    }

    const totalPrice = beats.reduce((sum, beat) => sum + beat.price, 0);

    // Generate payment intent with userId and beatIds as metadata
    const paymentIntent = await createPaymentIntent(totalPrice, {
      userId,
      beatIds: JSON.stringify(beatIds),
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      beats,
      totalPrice,
    });
  } catch (error) {
    console.error("Error during payment intent creation:", error);
    res.status(500).json({ error: "Payment creation failed." });
  }
});

// Stripe webhook for payment success
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const { amount_received, status, id } = paymentIntent;

        const { userId, beatIds } = paymentIntent.metadata;

        // Record payment in the database
        const payment = new Payment({
          paymentIntentId: id,
          userId,
          amount: amount_received / 100,
          paymentStatus: status,
          beatIds: JSON.parse(beatIds),
        });

        await payment.save();

        // Update user's purchased beats
        await User.findByIdAndUpdate(userId, {
          $addToSet: { purchasedBeats: { $each: JSON.parse(beatIds) } },
        });

        console.log("Payment and user purchases updated successfully.");
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error(`Error handling webhook: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Download route
router.get("/download/:id", verifyUserToken, async (req, res) => {
  const userId = req.user.id;
  const beatId = req.params.id;

  try {
    // Verify if user has purchased the beat
    const user = await User.findById(userId).populate("purchasedBeats", "_id");
    const hasAccess = user.purchasedBeats.some(
      (beat) => beat._id.toString() === beatId
    );

    if (!hasAccess) {
      return res
        .status(403)
        .json({ error: "You have not purchased this beat." });
    }

    // Fetch beat details and return download URL
    const beat = await Beat.findById(beatId);
    res.json({ downloadUrl: beat.downloadUrl });
  } catch (error) {
    console.error("Error fetching download URL:", error.message);
    res.status(500).json({ error: "Error fetching download URL." });
  }
});

module.exports = router;
