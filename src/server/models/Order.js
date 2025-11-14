const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  date_of_order: { type: Date, default: Date.now },
  order_status: { type: String, default: "Pending" },

  // ✅ NEW — required by your React lock button
  isLocked: { type: Boolean, default: false }
});


module.exports = mongoose.model("Order", OrderSchema);
