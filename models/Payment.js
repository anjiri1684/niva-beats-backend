const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      required: true,
    },
    beatIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Beat" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
