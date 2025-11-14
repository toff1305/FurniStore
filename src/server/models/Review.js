const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  review_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", ReviewSchema);
