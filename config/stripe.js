const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent
 * @param {number} amount - Total amount for the payment (in base currency units).
 * @param {object} metadata - Metadata to attach to the payment intent.
 * @returns {object} - The created payment intent.
 */
const createPaymentIntent = async (amount, metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit (cents)
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata,
    });
    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error.message);
    throw new Error("Payment creation failed.");
  }
};

/**
 * Verify a payment intent
 * @param {string} paymentIntentId - Stripe payment intent ID.
 * @returns {object} - The status and details of the payment intent.
 */
const verifyPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      paymentMethod: paymentIntent.payment_method,
    };
  } catch (error) {
    console.error("Error verifying payment intent:", error.message);
    throw new Error("Payment verification failed.");
  }
};

module.exports = { createPaymentIntent, verifyPaymentIntent };
