const express = require("express");
const router = express.Router();
const ProductType = require("../models/ProductType");

router.get("/", async (req, res) => {
  try {
    const productTypes = await ProductType.find().populate("category_id");
    res.json(productTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const productType = new ProductType(req.body);
    await productType.save();
    res.json(productType);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
