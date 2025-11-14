const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  payment_method: { type: String, required: true },
  payment_status: { type: String, default: "Pending" },
  payment_date: { type: Date, default: Date.now },
  total_amount: { type: Number, required: true }
});

module.exports = mongoose.model("Payment", PaymentSchema);
