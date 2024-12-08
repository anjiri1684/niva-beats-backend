const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2; // Import Cloudinary
const Beat = require("../models/Beat");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require("uuid");

// Configure Cloudinary with your credentials (set these in your .env file)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload route
router.post("/upload", async (req, res) => {
  try {
    const { title, artist, genre, price } = req.body;
    const { audioFile, image } = req.files;

    if (!audioFile || !image) {
      return res
        .status(400)
        .json({ error: "Audio and Image files are required." });
    }

    // Upload audio file to Cloudinary
    const audioUploadResponse = await cloudinary.uploader.upload(
      audioFile[0].path,
      {
        resource_type: "auto", // Automatically detects whether it's an image or audio
        public_id: uuidv4(), // Generates a unique ID for each file
      }
    );

    // Upload image file to Cloudinary
    const imageUploadResponse = await cloudinary.uploader.upload(
      image[0].path,
      {
        folder: "beats/images", // Organize images into a folder
        public_id: uuidv4(), // Unique ID for the image
      }
    );

    // Construct URLs for the audio and image files
    const audioFileUrl = audioUploadResponse.secure_url;
    const imageUrl = imageUploadResponse.secure_url;

    // Create a new beat entry in MongoDB
    const newBeat = new Beat({
      title,
      artist,
      genre,
      price,
      audioFile: audioFileUrl,
      image: imageUrl,
    });

    await newBeat.save();
    res
      .status(201)
      .json({ message: "Beat uploaded successfully!", beat: newBeat });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ error: "Error uploading beat. Please try again." });
  }
});

// Get all beats route
router.get("/", async (req, res) => {
  try {
    const beats = await Beat.find().sort({ createdAt: -1 });
    res.status(200).json(beats);
  } catch (error) {
    console.error("Error retrieving beats:", error);
    res.status(500).json({ error: "Failed to retrieve beats." });
  }
});

// Checkout route for creating a payment intent
router.post("/create-payment-intent", async (req, res) => {
  const { beatIds } = req.body;

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

    // Calculate total price dynamically
    const totalPrice = beats.reduce((sum, beat) => sum + beat.price, 0);

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100, // Convert to cents
      currency: "usd",
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

// Add error handling middleware
router.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = router;
