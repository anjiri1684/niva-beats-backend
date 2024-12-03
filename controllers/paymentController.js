const stripe = require("../config/stripe");
const Payment = require("../models/Payment");

const createPaymentIntent = async (amount, metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to the smallest currency unit (cents)
      currency: "usd", // Adjust as per your currency needs
      automatic_payment_methods: { enabled: true },
      metadata, // Optional metadata like beat IDs, user info, etc.
    });

    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error(`Payment creation failed: ${error.message || error}`);
  }
};
