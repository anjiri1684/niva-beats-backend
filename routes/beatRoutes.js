const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Beat = require("../models/Beat");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.mimetype.startsWith("audio")
      ? "uploads/audio"
      : "uploads/images";
    // Ensure folder exists or create it
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

// const upload = multer({
//   storage,
//   limits: { fileSize: 200 * 1024 * 1024 }, // 50MB file size limit
//   fileFilter: (req, file, cb) => {
//     const validMimeTypes = [
//       "audio/mpeg",
//       "audio/wav",
//       "image/jpeg",
//       "image/png",
//     ];
//     if (validMimeTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(
//         new Error(
//           "Invalid file type. Only MP3, WAV, JPEG, and PNG are allowed."
//         ),
//         false
//       );
//     }
//   },
// });

// Upload beat route
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
  fileFilter: (req, file, cb) => {
    const validMimeTypes = [
      "audio/mpeg",
      "audio/wav",
      "image/jpeg",
      "image/png",
    ];
    if (validMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only MP3, WAV, JPEG, and PNG are allowed."
        ),
        false
      );
    }
  },
});

router.post(
  "/upload",
  upload.fields([{ name: "audioFile" }, { name: "image" }]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.audioFile || !req.files.image) {
        return res
          .status(400)
          .json({ error: "Audio and Image files are required." });
      }

      // Construct URLs for the audio and image files
      const audioFileUrl = `/uploads/audio/${req.files["audioFile"][0].filename}`;
      const imageUrl = `/uploads/images/${req.files["image"][0].filename}`;

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
      console.error("File upload error:", error);
      res
        .status(500)
        .json({ error: "Error uploading beat. Please try again." });
    }
  }
);

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
    // Fetch beats from the database based on beatIds
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
      currency: "usd", // Modify as needed for your currency
    });

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

// Add error handling middleware
router.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const Beat = require("../models/Beat");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Ensure Stripe is configured correctly

// // Configure Multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const folder = file.mimetype.startsWith("audio")
//       ? "uploads/audio"
//       : "uploads/images";
//     // Ensure folder exists or create it
//     fs.mkdirSync(folder, { recursive: true });
//     cb(null, folder);
//   },
//   filename: (req, file, cb) =>
//     cb(null, Date.now() + path.extname(file.originalname)),
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 200 * 1024 * 1024 }, // 50MB file size limit
//   fileFilter: (req, file, cb) => {
//     const validMimeTypes = [
//       "audio/mpeg",
//       "audio/wav",
//       "image/jpeg",
//       "image/png",
//     ];
//     if (validMimeTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(
//         new Error(
//           "Invalid file type. Only MP3, WAV, JPEG, and PNG are allowed."
//         ),
//         false
//       );
//     }
//   },
// });

// // Upload beat route
// router.post(
//   "/upload",
//   upload.fields([{ name: "audioFile" }, { name: "image" }]),
//   async (req, res) => {
//     try {
//       if (!req.files || !req.files.audioFile || !req.files.image) {
//         return res
//           .status(400)
//           .json({ error: "Audio and Image files are required." });
//       }

//       // Construct URLs for the audio and image files
//       const audioFileUrl = `/uploads/audio/${req.files["audioFile"][0].filename}`;
//       const imageUrl = `/uploads/images/${req.files["image"][0].filename}`;

//       // Create a new beat entry in MongoDB
//       const newBeat = new Beat({
//         title: req.body.title,
//         artist: req.body.artist,
//         genre: req.body.genre,
//         price: req.body.price,
//         audioFile: audioFileUrl,
//         image: imageUrl,
//       });

//       await newBeat.save();
//       res
//         .status(201)
//         .json({ message: "Beat uploaded successfully!", beat: newBeat });
//     } catch (error) {
//       console.error("File upload error:", error);
//       res
//         .status(500)
//         .json({ error: "Error uploading beat. Please try again." });
//     }
//   }
// );

// // Get all beats route
// router.get("/", async (req, res) => {
//   try {
//     const beats = await Beat.find();
//     res.status(200).json(beats);
//   } catch (error) {
//     console.error("Error retrieving beats:", error);
//     res.status(500).json({ error: "Failed to retrieve beats." });
//   }
// });

// // Checkout route for creating a payment intent
// router.post("/create-payment-intent", async (req, res) => {
//   const { beatIds } = req.body;

//   if (!beatIds || !Array.isArray(beatIds)) {
//     return res.status(400).json({ error: "Invalid beat IDs provided." });
//   }

//   try {
//     // Fetch beats from the database based on beatIds
//     const beats = await Beat.find({ _id: { $in: beatIds } });

//     if (!beats || beats.length === 0) {
//       return res
//         .status(404)
//         .json({ error: "No beats found for the provided IDs." });
//     }

//     // Calculate total price dynamically
//     const totalPrice = beats.reduce((sum, beat) => sum + beat.price, 0);

//     // Create payment intent with Stripe
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: totalPrice * 100, // Convert to cents
//       currency: "usd", // Modify as needed for your currency
//     });

//     // Return client secret and beats data to frontend
//     res.status(200).json({
//       clientSecret: paymentIntent.client_secret,
//       beats,
//       totalPrice,
//     });
//   } catch (error) {
//     console.error("Error during payment intent creation:", error);
//     res.status(500).json({ error: "Payment creation failed." });
//   }
// });

// module.exports = router;
