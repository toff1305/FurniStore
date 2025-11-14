// ProductDetails.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./product-details.css"; // unique CSS file
import UserNavbar from "./user-header";
import vanity from "./assets/vanity.jpg"; // import local image

export default function ProductDetails() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const goBack = () => navigate(-1);

  // Use the same vanity image for all slides
  const images = [vanity, vanity, vanity];

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <UserNavbar />

      <div className="pd-page">
        {/* Back Button */}
        <header className="uc-header">
          <div className="uc-back-btn" onClick={goBack}>
            <i className="fa-solid fa-arrow-left"></i>
          </div>
          <div className="uc-header-title">
            <i className="fa-solid fa-cart-shopping"></i>
            <h1>Product Details</h1>
          </div>
        </header>

        <div className="pd-product-container">
          {/* Image Section */}
          <div className="pd-image-section">
            <div className="pd-carousel">
              <button className="pd-carousel-btn pd-prev" onClick={prevImage}>
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <img
                className="pd-carousel-image"
                src={images[currentIndex]}
                alt={`Product Image ${currentIndex + 1}`}
              />
              <button className="pd-carousel-btn pd-next" onClick={nextImage}>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>

            <div className="pd-carousel-dots">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`pd-dot ${idx === currentIndex ? "active" : ""}`}
                ></span>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="pd-details-section">
            <h2>HERA: Double Bed with Side Tables</h2>
            <p className="pd-price">₱38,499</p>

            <h4>Description:</h4>
            <p className="pd-desc">
              Inspired by Hera, the goddess of family and home, the Hera Double Bed brings comfort and sophistication to your sanctuary.
              Upholstered in plush fabric with built-in side tables and hidden storage, it's designed for modern living—
              balancing beauty, practicality, and a touch of divine luxury.
            </p>

            <h4>Dimensions:</h4>
            <p className="pd-dimensions">
              Headboard Width: 227 cm<br />
              Length: 214 cm<br />
              Headboard Height: 120 cm<br />
              Bed Height: 35 cm
            </p>

            {/* Buttons Section */}
            <div className="pd-buttons-section">
              {/* ADD TO CART */}
              <button className="pd-addcart-btn">
                ADD TO CART <i className="fa-solid fa-cart-plus"></i>
              </button>

              {/* CHECK OUT */}
              <Link to="/checkout" className="pd-checkout-link">
                <button className="pd-checkout-btn">
                  CHECK OUT <i className="fa-solid fa-cart-shopping"></i>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
