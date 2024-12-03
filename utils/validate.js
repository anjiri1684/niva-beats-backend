const { body, validationResult } = require("express-validator");

// Validation for user registration
const validateUserRegistration = [
  body("email").isEmail().withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Validation for beat upload
const validateBeatUpload = [
  body("title").notEmpty().withMessage("Title is required"),
  body("artist").notEmpty().withMessage("Artist is required"),
  body("genre").notEmpty().withMessage("Genre is required"),
  body("price")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number"),
  body("audioFile").notEmpty().withMessage("Audio file is required"),
  body("image").notEmpty().withMessage("Image is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Validation for subscription
const validateSubscription = [
  body("tier")
    .isIn(["Basic", "Standard", "Premium"])
    .withMessage("Invalid subscription tier"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Validation for payment
const validatePayment = [
  body("beatId").isMongoId().withMessage("Invalid beat ID"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateUserRegistration,
  validateBeatUpload,
  validateSubscription,
  validatePayment,
};
