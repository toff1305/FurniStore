const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");
const Customer = require("../models/Customer");
const Product = require("../models/Product");

// ✅ GET ALL ORDERS with customer + products populated
router.get("/all", async (req, res) => {
  try {
    // ✅ Get all orders with customer info
    const orders = await Order.find()
      .populate("customer_id") // customer info
      .lean();

    // ✅ Attach order details + product names
    for (let order of orders) {
      const details = await OrderDetail.find({ order_id: order._id })
        .populate("product_id") // product info
        .lean();

      order.items = details.map((item) => ({
        productName: item.product_id.product_name,
        quantity: item.quantity,
        price: item.order_price,
      }));

      // ✅ optional: flatten for easier frontend
      order.productName = order.items.map((i) => i.productName).join(", ");
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Order API Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
