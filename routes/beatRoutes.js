const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const Beat = require("../models/Beat");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage and file size limits
const upload = multer({
  limits: { fileSize: 200 * 1024 * 1024 }, // 50 MB max size for both audio and image
}).fields([{ name: "audioFile" }, { name: "image" }]);

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload Route
router.post("/upload", upload, async (req, res) => {
  try {
    if (!req.files.audioFile || !req.files.image) {
      return res
        .status(400)
        .json({ error: "Both audio and image files are required." });
    }

    const { title, artist, genre, price } = req.body;
    const audioFile = req.files.audioFile[0];
    const image = req.files.image[0];

    // Upload audio to Cloudinary
    const audioUploadResponse = await cloudinary.uploader.upload(
      audioFile.path,
      {
        resource_type: "auto", // auto to handle audio formats
        public_id: uuidv4(),
      }
    );

    // Upload image to Cloudinary
    const imageUploadResponse = await cloudinary.uploader.upload(image.path, {
      folder: "beats/images", // Optional: categorize images under a folder
      public_id: uuidv4(),
    });

    const audioFileUrl = audioUploadResponse.secure_url;
    const imageUrl = imageUploadResponse.secure_url;

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
    console.log("Received audio file:", req.files.audioFile);
    console.log("Received image file:", req.files.image);
  } catch (error) {
    console.error("Error uploading beat:", error);
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File size is too large." });
    }
    res.status(500).json({ error: "Error adding beat. Please try again." });
  }
});

router.get("/", async (req, res) => {
  try {
    const beats = await Beat.find().sort({ createdAt: -1 });
    res.status(200).json(beats);
  } catch (error) {
    console.error("Error retrieving beats:", error);
    res.status(500).json({ error: "Failed to retrieve beats." });
  }
});

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

    const totalPrice = beats.reduce((sum, beat) => sum + beat.price, 0);

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

router.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = router;
