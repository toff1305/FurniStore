const mongoose = require("mongoose");

const OrderDetailSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  order_price: { type: Number, required: true }
});

module.exports = mongoose.model("OrderDetail", OrderDetailSchema);
