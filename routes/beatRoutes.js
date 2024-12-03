// beatRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Beat = require("../models/Beat");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Use your Stripe secret key
const { createPaymentIntent } = require("./paymentRoutes"); // Import createPaymentIntent

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.mimetype.startsWith("audio")
      ? "uploads/audio"
      : "uploads/images";
    cb(null, folder);
  },
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const isValid =
      file.mimetype.startsWith("audio") || file.mimetype.startsWith("image");
    isValid ? cb(null, true) : cb(new Error("Invalid file type"), false);
  },
});

// Upload beat route
router.post(
  "/upload",
  upload.fields([{ name: "audioFile" }, { name: "image" }]),
  async (req, res) => {
    try {
      // Construct URLs for the audio and image files
      const audioFileUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/audio/${req.files["audioFile"][0].filename}`;
      const imageUrl = req.files["image"]
        ? `${req.protocol}://${req.get("host")}/uploads/images/${
            req.files["image"][0].filename
          }`
        : null;

      // Create a new beat entry in MongoDB
      const newBeat = new Beat({
        title: req.body.title,
        artist: req.body.artist,
        genre: req.body.genre,
        price: req.body.price,
        audioFile: audioFileUrl,
        image: imageUrl,
      });

      await newBeat.save();
      res
        .status(201)
        .json({ message: "Beat uploaded successfully!", beat: newBeat });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Error uploading beat. Please try again." });
    }
  }
);

// Get all beats route
router.get("/", async (req, res) => {
  try {
    const beats = await Beat.find();
    res.status(200).json(beats);
  } catch (error) {
    console.error("Error retrieving beats:", error);
    res.status(500).json({ error: "Failed to retrieve beats." });
  }
});

// Checkout route

// Route for creating a payment intent
router.post("/create-payment-intent", async (req, res) => {
  const { beatIds } = req.body;

  if (!beatIds || !Array.isArray(beatIds)) {
    return res.status(400).json({ error: "Invalid beat IDs provided." });
  }

  // Fetch beats from the database based on beatIds
  const beats = await Beat.find({ _id: { $in: beatIds } });

  if (!beats || beats.length === 0) {
    return res
      .status(404)
      .json({ error: "No beats found for the provided IDs." });
  }

  // Calculate total price dynamically
  const totalPrice = beats.reduce((sum, beat) => sum + beat.price, 0);

  try {
    // Create payment intent
    const paymentIntent = await createPaymentIntent(totalPrice);

    // Return client secret and beats data to frontend
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

module.exports = router;
