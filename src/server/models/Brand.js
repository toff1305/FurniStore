const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema({
  brand_name: { type: String, required: true }
});

module.exports = mongoose.model("Brand", BrandSchema);
