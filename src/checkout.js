import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "./user-header"; // make sure path is correct
import "./checkout.css";
import productImg from "./assets/vanity.jpg";
import summaryBg from "./assets/elevate.PNG";

export default function Checkout() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState("GCash");

  const handleBack = () => navigate(-1);
  const increaseQty = () => setQuantity((prev) => prev + 1);
  const decreaseQty = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const totalPrice = 38499 * quantity;
  const discounts = 100000;
  const amountPayable = totalPrice - discounts > 0 ? totalPrice - discounts : 0;

  const handleConfirm = () => {
    if (paymentMethod === "GCash") navigate("/gcash");
    else if (paymentMethod === "COD") alert("Your order will be processed as Cash on Delivery.");
  };

  return (
    <>
      {/* USER NAVBAR AT THE TOP */}
      <UserNavbar />

      <div className="co-page">
        <section className="co-container">
          {/* REVIEW ORDER */}
          <div className="co-section-box co-review-order">
            <div className="co-section-header">REVIEW ORDER</div>
            <div className="co-order-item">
              <img src={productImg} alt="Product" className="co-order-image" />
              <div className="co-order-details">
                <h3>HERA: Double Bed with Side Tables</h3>
                <p>₱38,499</p>
              </div>
              <div className="co-quantity">
                <button onClick={decreaseQty}>-</button>
                <span style={{ fontSize: "30px" }}>{quantity}</span>
                <button onClick={increaseQty}>+</button>
              </div>
            </div>
          </div>

          {/* PAYMENT METHODS */}
          <div className="co-section-box co-payment-section">
            <div className="co-section-header">PAYMENT METHODS</div>
            <div className="co-payment-options">
              <p><strong>Select Payment Method:</strong></p>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="GCash"
                  checked={paymentMethod === "GCash"}
                  onChange={() => setPaymentMethod("GCash")}
                /> GCash
              </label>
              <br />
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                /> Cash on Delivery
              </label>
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div className="co-summary">
            <div className="co-summary-left">
              <div className="co-section-header">ORDER SUMMARY</div>
              <div className="co-summary-content">
                <div className="co-summary-item">
                  <img src={productImg} alt="Product" className="co-summary-image" />
                  <div className="co-item-details">
                    <h3>HERA: Double Bed with Side Tables</h3>
                    <p>₱38,499</p>
                    <p>x{quantity}</p>
                  </div>
                </div>

                <div className="co-delivery-info">
                  <h4>Delivery Information:</h4>
                  <p>Sandoval, Iba Hagonoy, Bulacan</p>
                  <p>(+63) 905 654 5028</p>
                </div>

                <div className="co-payment-info">
                  <h4>Payment Details:</h4>
                  <p>Total Price: ₱{totalPrice}</p>
                  <p>Vouchers & Discounts: ₱{discounts}</p>
                  <p>Payment Method: {paymentMethod}</p>
                </div>

                <div className="co-amount-payable">
                  <h4>AMOUNT PAYABLE:</h4>
                  <p><strong>₱{amountPayable}</strong></p>
                </div>

                <button className="co-confirm-btn" onClick={handleConfirm}>
                  CONFIRM
                </button>
              </div>
            </div>

            <div className="co-summary-right">
              <img src={summaryBg} alt="Background" className="co-summary-bg" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
