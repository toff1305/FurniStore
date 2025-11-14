import React from "react";
import { Link } from "react-router-dom";
import "./header.css";
import logoImg from "./assets/logo.png";

export default function Navbar() {
  const handleScrollToFooter = (e) => {
    e.preventDefault();
    const footer = document.querySelector(".nn-footer"); // use your class name
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="navbar">
      <div className="logo">
        <Link to="/home">
          <img src={logoImg} alt="Logo" />
        </Link>
      </div>
{/*
      <div className="search-bar">
        <input type="text" placeholder="What product are you looking for?" />
        <button className="search-btn">🔍</button>
      </div>
*/}
      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About Us</Link>
        {/* Smooth scrolls to footer */}
        <a href="#footer" onClick={handleScrollToFooter}>
          Contacts
        </a>
        <Link to="/help">Help</Link>
      </nav>
    </header>
  );
}
