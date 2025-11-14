const mongoose = require("mongoose");

const ProductTypeSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  product_type_name: { type: String, required: true }
});

module.exports = mongoose.model("ProductType", ProductTypeSchema);
