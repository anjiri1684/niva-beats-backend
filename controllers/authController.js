const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const Joi = require("joi");
const cors = require("cors");

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Rate limiting middleware for login routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many login attempts. Please try again later.",
});

// User registration schema for validation
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  state: Joi.string().required(),
  city: Joi.string().required(),
  country: Joi.string().required(),
  age: Joi.number().integer().min(1).required(),
});

const registerUser = async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password, firstName, lastName, state, city, country, age } =
      req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      state,
      city,
      country,
      age,
      role: "user",
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ message: "Error registering user." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for user:", email);

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== "user") {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("User logged in successfully:", email);
    res.status(200).json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in. Please try again." });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Email verified. You can now reset your password." });
  } catch (error) {
    console.error("Error processing forgot password request:", error);
    res.status(500).json({ message: "Error processing request" });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email and new password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isValidPassword = (password) => {
      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/; // At least 8 characters, 1 letter, 1 number, 1 special char
      return passwordRegex.test(password);
    };

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one letter, one number, and one special character.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ _id: user._id }, { password: hashedPassword });

    console.log("Password reset successfully for user:", email);
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(500)
      .json({ message: "Error resetting password.", error: error.message });
  }
};

const registerAdmin = async (req, res) => {
  const { email, password } = req.body;
  console.log("Registering admin with email:", email);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Admin already exists:", email);
      return res.status(400).json({ message: "Admin already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      email,
      password: hashedPassword,
      role: "admin",
    });

    await newAdmin.save();
    console.log("Admin registered successfully:", email);
    res.status(201).json({ message: "Admin registered successfully." });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ message: "Error registering admin." });
  }
};

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Admin login attempt:", email);

    // Check if the user exists and is an admin
    const admin = await User.findOne({ email });
    if (!admin || admin.role !== "admin") {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    // Validate the password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Admin successfully logged in:", email);
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in admin:", error.message);

    // Avoid sending sensitive error details to the client
    res.status(500).json({ message: "An unexpected error occurred." });
  }
};

const resetPasswordDirectly = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const admin = await User.findOne({ email, role: "admin" });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Export functions
module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  registerAdmin,
  forgotPassword,
  resetPassword,
  resetPasswordDirectly,
};
