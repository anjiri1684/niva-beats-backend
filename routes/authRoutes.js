const express = require("express");
const {
  registerUser,
  loginUser,
  registerAdmin,
  loginAdmin,
  resetPassword,
  resetPasswordDirectly,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser); // User registration
router.post("/login", loginUser); // User login

router.post("/register-admin", registerAdmin); // Admin registration
router.post("/login-admin", loginAdmin); // Admin login

router.post("/reset-password", resetPassword); // User password reset
router.post("/admin-reset-password", resetPasswordDirectly); // Admin direct password reset

module.exports = router;
