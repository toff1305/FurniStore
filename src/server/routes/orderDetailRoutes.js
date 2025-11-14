const express = require("express");
const router = express.Router();
const OrderDetail = require("../models/OrderDetail");

router.get("/", async (req, res) => {
  try {
    const orderDetails = await OrderDetail.find()
      .populate("order_id")
      .populate("product_id");
    res.json(orderDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const orderDetail = new OrderDetail(req.body);
    await orderDetail.save();
    res.json(orderDetail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
