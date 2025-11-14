import React from "react";
import "./footer.css";

export default function Footer() {
  return (
    
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
  );
}
