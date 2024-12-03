const Payment = require("../models/Payment");

const getTotalRevenue = async (req, res) => {
  try {
    const payments = await Payment.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);

    const totalRevenue = payments.length ? payments[0].totalRevenue : 0;
    res.status(200).json({ totalRevenue });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching revenue", error: error.message });
  }
};

module.exports = { getTotalRevenue };
