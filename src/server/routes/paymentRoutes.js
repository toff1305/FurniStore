const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");

router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find().populate("order_id");
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
