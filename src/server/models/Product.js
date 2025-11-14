const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  product_type_id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductType", required: true },
  product_name: { type: String, required: true },
  price: { type: Number, required: true },
  product_description: { type: String },
  stock_quantity: { type: Number, default: 0 },
  images_id: { type: mongoose.Schema.Types.ObjectId, ref: "Images" },
  dimensions: {
    length: { type: Number, required: true }, // in cm
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
});

module.exports = mongoose.model("Product", ProductSchema);
