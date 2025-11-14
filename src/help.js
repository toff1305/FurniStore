import React, { useEffect } from "react";
import "./help.css";
import Navbar from "./header";
import Footer from "./footer";

export default function Help() {
  useEffect(() => {
    const headers = document.querySelectorAll(".accordion-header");

    headers.forEach((header) => {
      header.addEventListener("click", () => {
        const currentItem = header.parentElement;
        const isFocused = currentItem.classList.contains("focused");

        // Reset all cards
        document.querySelectorAll(".accordion-item").forEach((item) => {
          item.classList.remove("focused", "hidden");
        });

        // Focus current one
        if (!isFocused) {
          currentItem.classList.add("focused");
          document.querySelectorAll(".accordion-item").forEach((item) => {
            if (item !== currentItem) item.classList.add("hidden");
          });
        }
      });
    });

    // Popup logic
    const popup = document.getElementById("popup");
    const helpBtn = document.querySelector(".help-btn");
    const closeBtn = document.querySelector(".close");
    const popupBtn = document.querySelector(".popup-btn");

    const openPopup = () => popup.classList.add("show");
    const closePopup = () => popup.classList.remove("show");
    const clickOutside = (e) => {
      if (e.target === popup) popup.classList.remove("show");
    };

    helpBtn.addEventListener("click", openPopup);
    closeBtn.addEventListener("click", closePopup);
    popupBtn.addEventListener("click", closePopup);
    window.addEventListener("click", clickOutside);

    // Cleanup event listeners when component unmounts
    return () => {
      headers.forEach((header) =>
        header.removeEventListener("click", () => {})
      );
      helpBtn.removeEventListener("click", openPopup);
      closeBtn.removeEventListener("click", closePopup);
      popupBtn.removeEventListener("click", closePopup);
      window.removeEventListener("click", clickOutside);
    };
  }, []);

  return (
    <>
      <Navbar />
      <div className="help-container">
        <header>
          <h1>
            <i className="fa-solid fa-circle-question"></i> HELP CENTER
          </h1>
          <p>
            Find answers about ordering, accounts, shipping, and payments below.
          </p>
        </header>

        <div className="accordion">
          {/* ===== Ordering Help ===== */}
          <div className="accordion-item">
            <button className="accordion-header">
              <i className="fa-solid fa-cart-shopping"></i> Ordering and Account
              Help
            </button>
            <div className="accordion-content">
              <h3>How to Place an Order</h3>
              <ol>
                <li>
                  <strong>Browse Products –</strong> Explore our catalog by
                  category or use the search bar to find what you need.
                </li>
                <li>
                  <strong>Select an Item –</strong> Click the product to view
                  its details, price, and available options.
                </li>
                <li>
                  <strong>Add to Cart –</strong> Once you’ve chosen your item,
                  click “Add to Cart.”
                </li>
                <li>
                  <strong>Review Your Cart –</strong> Check your items and update
                  if needed.
                </li>
                <li>
                  <strong>Proceed to Checkout –</strong> Enter your address,
                  choose payment, and review your order.
                </li>
                <li>
                  <strong>Confirm and Pay –</strong> Complete your payment
                  securely.
                </li>
                <li>
                  <strong>Order Confirmation –</strong> You’ll receive a
                  confirmation via email or SMS.
                </li>
              </ol>
              <p className="tip">
                <i className="fa-solid fa-lightbulb"></i> Tip: Double-check your
                shipping details to avoid delays.
              </p>

              <h3>Creating and Managing an Account</h3>
              <ul>
                <li>
                  <strong>To Create:</strong> Click “Sign Up” or “Register,” fill
                  in your details, and verify your email (if required).
                </li>
                <li>
                  <strong>Managing:</strong> Update info, change your password,
                  or edit your address anytime in Account Settings.
                </li>
                <li>
                  <strong>Login Issues:</strong> Make sure your credentials are
                  correct or contact support.
                </li>
              </ul>
            </div>
          </div>

          {/* ===== Payment Help ===== */}
          <div className="accordion-item">
            <button className="accordion-header">
              <i className="fa-solid fa-credit-card"></i> Payment and Billing
            </button>
            <div className="accordion-content">
              <h3>Accepted Payment Methods</h3>
              <ul>
                <li>
                  <strong>Cash on Delivery (COD):</strong> Pay for your order in
                  cash upon delivery.
                </li>
                <li>
                  <strong>GCash:</strong> Enjoy quick and secure payment via the
                  GCash app.
                </li>
              </ul>
              <p className="note">
                Note: All payments are processed securely, and your information
                remains protected.
              </p>

              <h3>How to Make a Payment</h3>
              <h4>Cash on Delivery (COD)</h4>
              <ol>
                <li>Select COD at checkout.</li>
                <li>Confirm your order and wait for delivery confirmation.</li>
                <li>Prepare the exact amount and pay the courier upon delivery.</li>
              </ol>
              <p className="tip">
                <i className="fa-solid fa-location-dot"></i> COD is available only
                in select areas. Please check if your address is serviceable.
              </p>

              <h4>GCash</h4>
              <ol>
                <li>Select GCash as your payment method at checkout.</li>
                <li>Log in to your GCash account when redirected.</li>
                <li>Confirm the transaction to complete your payment.</li>
                <li>
                  You’ll receive a confirmation from both GCash and our store.
                </li>
              </ol>
            </div>
          </div>

          {/* ===== Shipping Help ===== */}
          <div className="accordion-item">
            <button className="accordion-header">
              <i className="fa-solid fa-truck"></i> Shipping and Delivery
            </button>
            <div className="accordion-content">
              <h3>Shipping Options and Coverage</h3>
              <p>
                We aim to deliver your orders quickly and safely right to your
                doorstep.
              </p>
              <p>
                Currently, we offer standard delivery within the Philippines
                through our trusted courier partners. Delivery coverage may vary
                depending on your location.
              </p>
              <p className="note">
                Note: Shipping options and delivery times may differ for certain
                areas such as remote provinces or islands.{" "}
                <strong>Shipping fee is FREE.</strong>
              </p>

              <h3>Delivery Timeframe</h3>
              <ul>
                <li>
                  <strong>Metro Manila:</strong> 2–5 business days
                </li>
                <li>
                  <strong>Provincial Areas:</strong> 5–10 business days
                </li>
              </ul>
              <p>
                Delivery time may vary during holidays, sale events, or due to
                weather conditions. You’ll receive an email or SMS notification
                once your order has been shipped.
              </p>

              <h3>Order Processing</h3>
              <ol>
                <li>
                  <strong>Order Confirmation –</strong> After you place an order,
                  you’ll receive a confirmation message with your order details.
                </li>
                <li>
                  <strong>Packaging and Dispatch –</strong> We carefully pack your
                  items and hand them over to our courier partners.
                </li>
                <li>
                  <strong>Delivery Updates –</strong> You’ll receive updates as
                  your package moves through the delivery process.
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Popup */}
        <div id="popup" className="popup">
          <div className="popup-content">
            <span className="close">&times;</span>
            <h2>Need More Help?</h2>
            <p>Contact our support team for further assistance via email or chat.</p>
            <button className="popup-btn">Got It</button>
          </div>
        </div>

        <button className="help-btn">
          <i className="fa-solid fa-headset"></i>
        </button>
      </div>
       <footer className="nn-footer">
      <div className="nn-footer-top">
        <div className="nn-footer-column">
          <h3>CONTACT US</h3>
          <p>(+63) 912 892 9876</p>
          <p>Hagonoy, Bulacan, Philippines 3002</p>
        </div>

        <div className="nn-footer-column">
          <h3>SOCIALS</h3>
          <p>Facebook</p>
          <p>Instagram</p>
          <p>Shopee</p>
          <p>TikTok</p>
        </div>

        <div className="nn-footer-column">
          <h3>QUICK LINKS</h3>
          <p>Home</p>
          <p>About Us</p>
          <p>Contacts</p>
          <p>Help</p>
        </div>
      </div>

      <hr className="nn-footer-divider" />

      <div className="nn-footer-bottom">
        <div className="nn-footer-column">
          <h4>Customer Service</h4>
          <p>Warranty & Care</p>
          <p>Shipping & Delivery Information</p>
        </div>

        <div className="nn-footer-column">
          <h4>Legal / Policies</h4>
          <p>Terms and Conditions</p>
        </div>
      </div>
    </footer>
    </>
    
  );
}
