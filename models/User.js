const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" }, // Role-based design
    subscription: {
      type: String,
      enum: ["Basic", "Standard", "Premium"], // Subscription options
      default: null, // No subscription by default
    },
    // Add these fields only for users (not admins)
    firstName: {
      type: String,
      required: function () {
        return this.role === "user"; // Only required for users
      },
    },
    lastName: {
      type: String,
      required: function () {
        return this.role === "user"; // Only required for users
      },
    },
    state: {
      type: String,
      required: function () {
        return this.role === "user"; // Only required for users
      },
    },
    city: {
      type: String,
      required: function () {
        return this.role === "user"; // Only required for users
      },
    },
    country: {
      type: String,
      required: function () {
        return this.role === "user"; // Only required for users
      },
    },
    age: {
      type: Number,
      required: function () {
        return this.role === "user"; // Only required for users
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
