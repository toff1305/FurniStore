import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./gcash.css";
import gcashLogo from "./assets/gcash_logo_no_background.png";

export default function GcashPayment() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  return (
    <>
      <header className="gc-header">
        <div className="gc-back-btn" onClick={goBack}>
          <i className="fa-solid fa-arrow-left"></i>
          <span>Back</span>
        </div>

        <div className="gc-header-title">
          <i className="fa-solid fa-wallet"></i>
          <h1>GCash Payment</h1>
        </div>
      </header>

      <div className="gc-main-container">
        <div className="gc-payment-box">
          <div className="gc-logo-section">
            <img src={gcashLogo} alt="GCash Logo" className="gc-gcash-logo" />
          </div>

          <div className="gc-form-section">
            <h2>GCash Payment</h2>
            <p>Please enter your GCash details to complete the payment.</p>

            <form className="gc-payment-form">
              <label>Full Name:</label>
              <input type="text" placeholder="Enter your full name" required />

              <label>GCash Number:</label>
              <input type="text" placeholder="Enter your GCash number" required />

              <label>GCash Pin:</label>
              <input type="password" placeholder="Enter your GCash PIN" required />

              <label>Order Total:</label>
              <input type="text" placeholder="₱ 0.00" required />

              <button type="submit" className="gc-submit-btn">
                Submit Payment
              </button>
            </form>

            <p className="gc-terms">
              By submitting, you agree to the{" "}
              <a href="#">Terms & Conditions</a> of GCash.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
