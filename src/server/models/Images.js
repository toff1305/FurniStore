const mongoose = require("mongoose");

const ImagesSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", unique: true },
  main_photo_url: String,
  secondary_photo_url: String,
  third_photo_url: String,
  fourth_photo_url: String,
  fifth_photo_url: String
});

module.exports = mongoose.model("Images", ImagesSchema);
